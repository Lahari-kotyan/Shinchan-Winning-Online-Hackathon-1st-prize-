/**
 * DARKSPOT — Express API Routes
 * Endpoints for managing investigations, starting pipelines, incremental evidence ingestion,
 * and conflict resolution.
 */

import { Router, Request, Response } from 'express';
import {
  loadInvestigations,
  getInvestigationById,
  upsertInvestigation,
  deleteInvestigationById,
  saveInvestigations,
} from './storage.ts';
import { runInvestigationPipeline, runInvestigationFromExisting } from './pipeline/runner.ts';
import { fetchEvidenceFromUrl } from './pipeline/urlFetcher.ts';
import { extractClaimsFromSources } from './pipeline/claimExtractor.ts';
import { detectContradictions } from './pipeline/conflictDetector.ts';
import { analyzeInformationGaps } from './pipeline/gapAnalyzer.ts';
import { generateVerificationPlan } from './pipeline/verificationPlanner.ts';
import { assessDecisionReadiness } from './pipeline/readinessAssessor.ts';
import { checkGeminiHealth, PRIMARY_MODEL } from './ai.ts';
import { SAMPLE_INVESTIGATIONS } from './sampleData.ts';
import {
  NewInvestigationPayload,
  EvidenceSource,
  Investigation,
  ContradictionFinding,
  VerificationAction,
} from '../types/intelligence.ts';

export const apiRouter = Router();

// GET health check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const geminiHealth = await checkGeminiHealth();
    res.json({
      status: 'ok',
      engine: geminiHealth.healthy ? 'gemini' : 'heuristic',
      model: PRIMARY_MODEL,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      geminiLive: geminiHealth.healthy,
      error: geminiHealth.error,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

// POST health check
apiRouter.post('/health', async (_req: Request, res: Response) => {
  try {
    const geminiHealth = await checkGeminiHealth();
    res.json({
      status: 'ok',
      engine: geminiHealth.healthy ? 'gemini' : 'heuristic',
      model: PRIMARY_MODEL,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      geminiLive: geminiHealth.healthy,
      error: geminiHealth.error,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

// GET all investigations
apiRouter.get('/investigations', (_req: Request, res: Response) => {
  try {
    const list = loadInvestigations();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load investigations' });
  }
});

// GET single investigation
apiRouter.get('/investigations/:id', (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }
    res.json(inv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load investigation' });
  }
});

// POST start new investigation (live run or draft)
apiRouter.post('/investigations', async (req: Request, res: Response) => {
  try {
    const body: NewInvestigationPayload = req.body;
    if (!body.decisionQuestion || !body.decisionQuestion.trim()) {
      return res.status(400).json({ error: 'Decision question is required' });
    }

    const id = `inv-${Date.now()}`;
    const completedInv = await runInvestigationPipeline(body, id);
    res.status(201).json(completedInv);
  } catch (error) {
    console.error('Error starting investigation:', error);
    res.status(500).json({ error: 'Failed to run investigation pipeline' });
  }
});

// POST run pipeline on an existing investigation (draft or retry)
apiRouter.post('/investigations/:id/run', async (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    inv.status = 'PROCESSING';
    inv.progressStage = 'Stage 1/6: Decomposing decision into necessary information requirements...';
    upsertInvestigation(inv);

    const completed = await runInvestigationFromExisting(inv);
    res.json(completed);
  } catch (error) {
    console.error('Error running existing investigation:', error);
    res.status(500).json({ error: 'Failed to execute investigation pipeline' });
  }
});

// DELETE remove evidence source from investigation
apiRouter.delete('/investigations/:id/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    const initialSourceCount = inv.sources.length;
    inv.sources = inv.sources.filter(s => s.id !== req.params.sourceId);
    inv.claims = inv.claims.filter(c => c.sourceId !== req.params.sourceId);

    if (inv.sources.length === initialSourceCount) {
      return res.status(404).json({ error: 'Source not found in investigation' });
    }

    if (inv.activityLog) {
      inv.activityLog.push({
        timestamp: new Date().toISOString(),
        stage: 'SOURCE_REMOVED',
        description: `Removed evidence source (${req.params.sourceId}). Re-evaluating claims and gaps...`,
        status: 'INFO',
      });
    }

    // Downstream pipeline recalculation
    if (inv.requirements && inv.requirements.length > 0) {
      const updatedConflicts = await detectContradictions(inv.requirements, inv.sources, inv.claims);
      inv.contradictions = updatedConflicts;

      const updatedReqs = await analyzeInformationGaps(
        inv.requirements,
        inv.sources,
        inv.claims,
        updatedConflicts
      );
      inv.requirements = updatedReqs;

      const updatedPlan = await generateVerificationPlan(updatedReqs, updatedConflicts);
      inv.verificationPlan = updatedPlan;

      const activeConflicts = updatedConflicts.filter(c => !c.resolved);
      const updatedReadiness = await assessDecisionReadiness(
        inv.decisionQuestion,
        updatedReqs,
        activeConflicts
      );
      inv.readiness = updatedReadiness;
    }

    inv.updatedAt = new Date().toISOString();
    upsertInvestigation(inv);
    res.json(inv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove source' });
  }
});

// POST ingest new evidence source into existing investigation
apiRouter.post('/investigations/:id/sources', async (req: Request, res: Response) => {
  const inv = getInvestigationById(req.params.id);
  if (!inv) {
    return res.status(404).json({ error: 'Investigation not found' });
  }

  // Work on a deep clone to prevent corrupting state if an AI step fails
  const workingInv: Investigation = JSON.parse(JSON.stringify(inv));

  try {
    const { url, title, content, publisher, publicationDate } = req.body;
    let newSource: EvidenceSource | null = null;

    if (url && url.trim()) {
      const fetchResult = await fetchEvidenceFromUrl(url.trim(), workingInv.sources.length);
      if (fetchResult.error) {
        return res.status(422).json({ error: fetchResult.error });
      }
      if (fetchResult.source) {
        newSource = fetchResult.source;
      }
    } else if (content && content.trim()) {
      newSource = {
        id: `src-doc-${Date.now()}`,
        title: title?.trim() || `Supplemental Document ${workingInv.sources.length + 1}`,
        publisher: publisher?.trim() || 'User Upload',
        domain: 'user.document',
        publicationDate: publicationDate || new Date().toISOString().split('T')[0],
        retrievalDate: new Date().toISOString().split('T')[0],
        sourceType: 'USER_UPLOAD',
        extractedPassage: content.trim(),
        authorityScore: 85,
        freshnessScore: 92,
        reliabilityNotes: 'Supplemental evidence added directly to active investigation.',
      };
    }

    if (!newSource) {
      return res.status(400).json({ error: 'Provide a valid URL or text content' });
    }

    workingInv.sources.push(newSource);

    // Incremental extraction from this new source against current requirements
    const newClaims = await extractClaimsFromSources(workingInv.requirements, [newSource]);
    const existingClaimIds = new Set(workingInv.claims.map(c => c.id));
    for (const claim of newClaims) {
      if (!existingClaimIds.has(claim.id)) {
        workingInv.claims.push(claim);
        existingClaimIds.add(claim.id);
      }
    }

    // Re-detect contradictions across all claims
    const detectedConflicts = await detectContradictions(workingInv.requirements, workingInv.sources, workingInv.claims);
    
    // Preserve previously resolved conflicts
    const resolvedConflictMap = new Map<string, ContradictionFinding>(
      workingInv.contradictions
        .filter((c: ContradictionFinding) => Boolean(c.resolved))
        .map((c: ContradictionFinding) => [c.id, c])
    );
    const mergedConflicts: ContradictionFinding[] = detectedConflicts.map(c => {
      const existing = resolvedConflictMap.get(c.id);
      if (existing) {
        return {
          ...c,
          resolved: true,
          resolutionNotes: existing.resolutionNotes,
          resolvedAt: existing.resolvedAt,
        };
      }
      return c;
    });
    for (const [id, resolvedC] of resolvedConflictMap.entries()) {
      if (!mergedConflicts.some(c => c.id === id)) {
        mergedConflicts.push(resolvedC);
      }
    }
    workingInv.contradictions = mergedConflicts;

    // Re-analyze information gaps
    const updatedReqs = await analyzeInformationGaps(
      workingInv.requirements,
      workingInv.sources,
      workingInv.claims,
      mergedConflicts
    );
    workingInv.requirements = updatedReqs;

    // Re-run verification planner, preserving completed state of existing actions
    const updatedPlan = await generateVerificationPlan(updatedReqs, mergedConflicts);
    const existingCompletedActionIds = new Set<string>(
      workingInv.verificationPlan
        .filter((a: VerificationAction) => Boolean(a.completed))
        .map((a: VerificationAction) => a.id)
    );
    workingInv.verificationPlan = updatedPlan.map(action => ({
      ...action,
      completed: existingCompletedActionIds.has(action.id) || action.completed || false,
    }));

    // Re-run readiness assessment
    const activeConflicts = mergedConflicts.filter(c => !c.resolved);
    const updatedReadiness = await assessDecisionReadiness(
      workingInv.decisionQuestion,
      updatedReqs,
      activeConflicts
    );
    workingInv.readiness = updatedReadiness;
    workingInv.updatedAt = new Date().toISOString();

    // Commit changes only after all pipeline steps succeed
    upsertInvestigation(workingInv);
    res.json(workingInv);
  } catch (error: any) {
    console.error('Error adding evidence source:', error);
    // Abort and return HTTP 502 Bad Gateway without corrupting valid state
    res.status(502).json({
      error: 'Intelligence pipeline execution failed while processing evidence. Existing investigation state was preserved.',
      details: error?.message || String(error),
    });
  }
});

// PATCH resolve contradiction finding
apiRouter.patch('/investigations/:id/conflicts/:conflictId/resolve', async (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    const conflict = inv.contradictions.find(c => c.id === req.params.conflictId);
    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

    const { resolutionNotes, sourceUrl } = req.body;
    const cleanNotes = (resolutionNotes || '').trim();
    const cleanUrl = (sourceUrl || '').trim();

    if (cleanNotes.length < 20 && !cleanUrl) {
      return res.status(400).json({
        error: 'Resolution requires a substantive justification note (minimum 20 characters) or a verified source URL.',
      });
    }

    conflict.resolved = true;
    conflict.resolutionNotes = cleanUrl ? `${cleanNotes} (Source: ${cleanUrl})` : cleanNotes;
    conflict.resolvedAt = new Date().toISOString();

    // Check if other unresolved conflicts remain for this requirement
    const remainingConflicts = inv.contradictions.filter(
      c => c.requirementId === conflict.requirementId && !c.resolved
    );

    const reqItem = inv.requirements.find(r => r.id === conflict.requirementId);
    if (reqItem && remainingConflicts.length === 0) {
      reqItem.status = 'USER_ASSERTED';
      reqItem.statusReason = `User asserted resolution (partial confidence): ${conflict.resolutionNotes}`;
      reqItem.unresolvedGaps = [];
    }

    // Recompute readiness
    const activeConflicts = inv.contradictions.filter(c => !c.resolved);
    const updatedReadiness = await assessDecisionReadiness(
      inv.decisionQuestion,
      inv.requirements,
      activeConflicts
    );
    inv.readiness = updatedReadiness;
    inv.updatedAt = new Date().toISOString();

    upsertInvestigation(inv);
    res.json(inv);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// PATCH toggle verification action completed status
apiRouter.patch('/investigations/:id/actions/:actionId/toggle', (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    const action = inv.verificationPlan.find(a => a.id === req.params.actionId);
    if (!action) {
      return res.status(404).json({ error: 'Verification action not found' });
    }

    action.completed = !action.completed;
    upsertInvestigation(inv);
    res.json(inv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// DELETE investigation
apiRouter.delete('/investigations/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteInvestigationById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Investigation not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete investigation' });
  }
});

// POST restore demo samples
apiRouter.post('/investigations/reset-samples', (_req: Request, res: Response) => {
  try {
    saveInvestigations(SAMPLE_INVESTIGATIONS);
    res.json({ success: true, count: SAMPLE_INVESTIGATIONS.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore samples' });
  }
});

// POST test URL fetcher
apiRouter.post('/sources/fetch', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const result = await fetchEvidenceFromUrl(url, 0);
    if (result.error) {
      return res.status(422).json({ error: result.error });
    }
    res.json(result.source);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch URL evidence' });
  }
});
