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
import { SAMPLE_INVESTIGATIONS } from './sampleData.ts';
import { NewInvestigationPayload, EvidenceSource } from '../types/intelligence.ts';

export const apiRouter = Router();

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
        description: `Removed evidence source (${req.params.sourceId}). ${inv.sources.length} sources remain.`,
        status: 'INFO',
      });
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
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    const { url, title, content, publisher, publicationDate } = req.body;
    let newSource: EvidenceSource | null = null;

    if (url && url.trim()) {
      const fetchResult = await fetchEvidenceFromUrl(url.trim(), inv.sources.length);
      if (fetchResult.error) {
        return res.status(422).json({ error: fetchResult.error });
      }
      if (fetchResult.source) {
        newSource = fetchResult.source;
      }
    } else if (content && content.trim()) {
      newSource = {
        id: `src-doc-${Date.now()}`,
        title: title?.trim() || `Supplemental Document ${inv.sources.length + 1}`,
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

    inv.sources.push(newSource);

    // Incremental extraction from this new source against current requirements
    const newClaims = await extractClaimsFromSources(inv.requirements, [newSource]);
    inv.claims.push(...newClaims);

    // Re-detect contradictions across all claims
    const updatedConflicts = await detectContradictions(inv.requirements, inv.sources, inv.claims);
    inv.contradictions = updatedConflicts;

    // Re-analyze information gaps
    const updatedReqs = await analyzeInformationGaps(
      inv.requirements,
      inv.sources,
      inv.claims,
      updatedConflicts
    );
    inv.requirements = updatedReqs;

    // Re-run verification planner
    const updatedPlan = await generateVerificationPlan(updatedReqs, updatedConflicts);
    inv.verificationPlan = updatedPlan;

    // Re-run readiness assessment
    const updatedReadiness = await assessDecisionReadiness(
      inv.decisionQuestion,
      updatedReqs,
      updatedConflicts
    );
    inv.readiness = updatedReadiness;
    inv.updatedAt = new Date().toISOString();

    upsertInvestigation(inv);
    res.json(inv);
  } catch (error) {
    console.error('Error adding evidence source:', error);
    res.status(500).json({ error: 'Failed to ingest new evidence source' });
  }
});

// PATCH resolve contradiction finding
apiRouter.patch('/investigations/:id/conflicts/:conflictId/resolve', async (req: Request, res: Response) => {
  try {
    const inv = getInvestigationById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    const conflict = inv.contradictions.find(c => c.id === req.params.conflictId);
    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

    const { resolutionNotes } = req.body;
    conflict.resolved = true;
    conflict.resolutionNotes = resolutionNotes || 'Resolved by decision investigator.';
    conflict.resolvedAt = new Date().toISOString();

    // Check if other unresolved conflicts remain for this requirement
    const remainingConflicts = inv.contradictions.filter(
      c => c.requirementId === conflict.requirementId && !c.resolved
    );

    const reqItem = inv.requirements.find(r => r.id === conflict.requirementId);
    if (reqItem && remainingConflicts.length === 0) {
      reqItem.status = 'SUPPORTED';
      reqItem.statusReason = `Contradiction officially resolved: ${conflict.resolutionNotes}`;
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
