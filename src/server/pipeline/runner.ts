/**
 * DARKSPOT — Full Intelligence Pipeline Orchestrator
 * Sequences decomposition, evidence ingestion, claim extraction, conflict detection,
 * gap analysis, verification planning, and decision readiness calculation.
 */

import {
  Investigation,
  NewInvestigationPayload,
  EvidenceSource,
  ActivityLogEntry,
} from '../../types/intelligence.ts';
import { decomposeDecision } from './decompose.ts';
import { extractClaimsFromSources } from './claimExtractor.ts';
import { detectContradictions } from './conflictDetector.ts';
import { analyzeInformationGaps } from './gapAnalyzer.ts';
import { generateVerificationPlan } from './verificationPlanner.ts';
import { assessDecisionReadiness } from './readinessAssessor.ts';
import { fetchEvidenceFromUrl } from './urlFetcher.ts';
import { upsertInvestigation } from '../storage.ts';

export async function runInvestigationPipeline(
  payload: NewInvestigationPayload,
  investigationId?: string
): Promise<Investigation> {
  const id = investigationId || `inv-${Date.now()}`;
  const now = new Date().toISOString();
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: now,
      stage: 'SUBMISSION',
      description: `Investigation configured for: "${payload.decisionQuestion.trim()}"`,
      status: 'INFO',
    },
  ];

  // If saved as draft, do not run the AI pipeline yet
  if (payload.saveAsDraft) {
    const draftSources: EvidenceSource[] = [];
    if (payload.documents && payload.documents.length > 0) {
      payload.documents.forEach((doc, idx) => {
        draftSources.push({
          id: `src-doc-${idx + 1}`,
          title: doc.title || doc.fileName || `Document ${idx + 1}`,
          publisher: doc.publisher || 'User Upload',
          domain: doc.fileName ? 'file.upload' : 'local.upload',
          fileRef: doc.fileName,
          publicationDate: doc.publicationDate || now.split('T')[0],
          retrievalDate: now.split('T')[0],
          sourceType: doc.fileName?.toLowerCase().endsWith('.pdf') ? 'OFFICIAL_DOCUMENT' : 'USER_UPLOAD',
          extractedPassage: doc.content || '(Pending extraction on pipeline run)',
          authorityScore: 85,
          freshnessScore: 90,
          reliabilityNotes: 'Draft document queued for evidence synthesis.',
        });
      });
    }

    if (payload.sourceUrls && payload.sourceUrls.length > 0) {
      payload.sourceUrls.forEach((url, idx) => {
        const cleanUrl = url.trim();
        if (cleanUrl) {
          try {
            const parsed = new URL(cleanUrl);
            draftSources.push({
              id: `src-url-draft-${idx + 1}`,
              title: `Pending Retrieval: ${parsed.hostname}`,
              url: cleanUrl,
              publisher: parsed.hostname,
              domain: parsed.hostname,
              retrievalDate: now.split('T')[0],
              sourceType: 'WEB_PAGE',
              extractedPassage: '(Pending retrieval on pipeline run)',
              authorityScore: 75,
              freshnessScore: 80,
              reliabilityNotes: 'Queued reference URL awaiting extraction.',
            });
          } catch {
            // ignore malformed in draft
          }
        }
      });
    }

    const draftInv: Investigation = {
      id,
      decisionQuestion: payload.decisionQuestion.trim(),
      context: (payload.context || '').trim(),
      createdAt: now,
      updatedAt: now,
      status: 'DRAFT',
      progressStage: 'Draft specification saved. Ready for pipeline execution.',
      requirements: [],
      sources: draftSources,
      claims: [],
      contradictions: [],
      verificationPlan: [],
      readiness: {
        status: 'NOT_READY',
        completenessScore: 0,
        summary: 'Investigation is in draft mode. Click "Run Analysis" to execute decomposition and gap analysis.',
        supportedAspects: [],
        unresolvedRisks: ['Analysis pipeline has not yet been executed on this draft.'],
        materialGaps: ['Decision requirements and evidence claims pending decomposition.'],
        preConditions: ['Execute investigation pipeline to evaluate decision completeness.'],
      },
      isSample: false,
      activityLog: [
        ...activityLog,
        {
          timestamp: new Date().toISOString(),
          stage: 'DRAFT_SAVED',
          description: `Saved as draft with ${draftSources.length} configured source(s).`,
          status: 'INFO',
        },
      ],
    };

    upsertInvestigation(draftInv);
    return draftInv;
  }

  // Create initial processing state
  const currentInv: Investigation = {
    id,
    decisionQuestion: payload.decisionQuestion.trim(),
    context: (payload.context || '').trim(),
    createdAt: now,
    updatedAt: now,
    status: 'PROCESSING',
    progressStage: 'Stage 1/6: Decomposing decision into necessary information requirements...',
    requirements: [],
    sources: [],
    claims: [],
    contradictions: [],
    verificationPlan: [],
    readiness: {
      status: 'NOT_READY',
      completenessScore: 0,
      summary: 'Pipeline processing in progress...',
      supportedAspects: [],
      unresolvedRisks: [],
      materialGaps: [],
      preConditions: [],
    },
    isSample: false,
    activityLog,
  };

  upsertInvestigation(currentInv);

  try {
    // Stage 1: Decision Decomposition
    console.log(`[DARKSPOT Pipeline] Stage 1: Decomposing decision for "${payload.decisionQuestion}"`);
    const initialRequirements = await decomposeDecision(payload.decisionQuestion, payload.context);
    currentInv.requirements = initialRequirements;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'DECOMPOSITION',
      description: `Synthesized ${initialRequirements.length} decision requirements across Critical, High, and Medium priorities.`,
      status: 'SUCCESS',
    });
    currentInv.progressStage = 'Stage 2/6: Ingesting and validating evidence sources...';
    upsertInvestigation(currentInv);

    // Stage 2: Ingest Sources
    const collectedSources: EvidenceSource[] = [];
    const ingestionErrors: string[] = [];

    // Process user documents and PDF uploads
    if (payload.documents && payload.documents.length > 0) {
      payload.documents.forEach((doc, idx) => {
        if (doc.content && doc.content.trim()) {
          const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.mimeType === 'application/pdf';
          collectedSources.push({
            id: `src-doc-${idx + 1}`,
            title: doc.title || doc.fileName || `Document ${idx + 1}`,
            publisher: doc.publisher || (isPdf ? 'Official PDF Upload' : 'User Provided Document'),
            domain: doc.fileName ? 'file.upload' : 'local.upload',
            fileRef: doc.fileName,
            publicationDate: doc.publicationDate || new Date().toISOString().split('T')[0],
            retrievalDate: new Date().toISOString().split('T')[0],
            sourceType: isPdf ? 'OFFICIAL_DOCUMENT' : 'USER_UPLOAD',
            extractedPassage: doc.content.trim(),
            authorityScore: isPdf ? 92 : 85,
            freshnessScore: 90,
            reliabilityNotes: isPdf
              ? `Primary PDF document "${doc.fileName || doc.title}" uploaded directly for evidentiary review.`
              : 'Uploaded text document provided directly by user for evidence synthesis.',
          });
        }
      });
    }

    // Process raw notes
    if (payload.rawNotes && payload.rawNotes.trim()) {
      collectedSources.push({
        id: `src-notes-${Date.now()}`,
        title: 'User Contextual Notes & Primary Disclosures',
        publisher: 'User Submission',
        domain: 'internal.notes',
        publicationDate: new Date().toISOString().split('T')[0],
        retrievalDate: new Date().toISOString().split('T')[0],
        sourceType: 'PRIMARY_DISCLOSURE',
        extractedPassage: payload.rawNotes.trim(),
        authorityScore: 80,
        freshnessScore: 95,
        reliabilityNotes: 'Firsthand user notes and preliminary facts.',
      });
    }

    // Process URLs
    if (payload.sourceUrls && payload.sourceUrls.length > 0) {
      for (let i = 0; i < payload.sourceUrls.length; i++) {
        const url = payload.sourceUrls[i].trim();
        if (!url) continue;
        const result = await fetchEvidenceFromUrl(url, i);
        if (result.source) {
          collectedSources.push(result.source);
        } else if (result.error) {
          ingestionErrors.push(result.error);
        }
      }
    }

    currentInv.sources = collectedSources;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'INGESTION',
      description: `Ingested ${collectedSources.length} verified evidence sources.${
        ingestionErrors.length > 0 ? ` (${ingestionErrors.length} external URL failures)` : ''
      }`,
      status: ingestionErrors.length > 0 ? 'WARNING' : 'SUCCESS',
    });
    currentInv.progressStage = 'Stage 3/6: Extracting traceable claims with verbatim citations...';
    upsertInvestigation(currentInv);

    // Stage 3: Claim Extraction
    console.log(`[DARKSPOT Pipeline] Stage 3: Extracting claims from ${collectedSources.length} sources`);
    const extractedClaims = await extractClaimsFromSources(currentInv.requirements, collectedSources);
    currentInv.claims = extractedClaims;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'CLAIM_EXTRACTION',
      description: `Extracted ${extractedClaims.length} verifiable claims with source citations.`,
      status: 'SUCCESS',
    });
    currentInv.progressStage = 'Stage 4/6: Cross-examining claims for direct contradictions and date discrepancies...';
    upsertInvestigation(currentInv);

    // Stage 4: Contradiction Detection
    console.log(`[DARKSPOT Pipeline] Stage 4: Detecting contradictions among ${extractedClaims.length} claims`);
    const contradictions = await detectContradictions(currentInv.requirements, collectedSources, extractedClaims);
    currentInv.contradictions = contradictions;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'CONTRADICTION_RADAR',
      description: `Cross-examined evidence; isolated ${contradictions.length} contradiction and discrepancy findings.`,
      status: contradictions.length > 0 ? 'WARNING' : 'SUCCESS',
    });
    currentInv.progressStage = 'Stage 5/6: Classifying information gaps and completeness states...';
    upsertInvestigation(currentInv);

    // Stage 5: Gap Analysis
    console.log(`[DARKSPOT Pipeline] Stage 5: Analyzing information gaps`);
    const analyzedRequirements = await analyzeInformationGaps(
      currentInv.requirements,
      collectedSources,
      extractedClaims,
      contradictions
    );
    currentInv.requirements = analyzedRequirements;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'GAP_ANALYSIS',
      description: `Epistemic gap audit completed across all ${analyzedRequirements.length} requirements.`,
      status: 'SUCCESS',
    });
    currentInv.progressStage = 'Stage 6/6: Formulating prioritized verification action plan & readiness...';
    upsertInvestigation(currentInv);

    // Stage 6: Verification Planning
    console.log(`[DARKSPOT Pipeline] Stage 6: Formulating verification plan`);
    const verificationPlan = await generateVerificationPlan(analyzedRequirements, contradictions);
    currentInv.verificationPlan = verificationPlan;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'VERIFICATION_PLAN',
      description: `Formulated ${verificationPlan.length} concrete verification action items.`,
      status: 'SUCCESS',
    });

    // Stage 7: Decision Readiness Assessment
    console.log(`[DARKSPOT Pipeline] Stage 7: Computing readiness`);
    const readiness = await assessDecisionReadiness(
      currentInv.decisionQuestion,
      analyzedRequirements,
      contradictions
    );
    currentInv.readiness = readiness;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'DECISION_READINESS',
      description: `Readiness indexed: ${readiness.status} with completeness score of ${readiness.completenessScore}%.`,
      status: readiness.status === 'DECISION_READY' ? 'SUCCESS' : readiness.status === 'PROCEED_WITH_CAUTION' ? 'WARNING' : 'ERROR',
    });

    if (ingestionErrors.length > 0) {
      currentInv.errorMessage = `Notice: Some external sources could not be retrieved: ${ingestionErrors.join('; ')}`;
      currentInv.status = collectedSources.length > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED';
    } else {
      currentInv.status = 'COMPLETED';
    }

    currentInv.progressStage = undefined;
    currentInv.updatedAt = new Date().toISOString();

    upsertInvestigation(currentInv);
    console.log(`[DARKSPOT Pipeline] Investigation ${id} finished with status ${currentInv.status}.`);
    return currentInv;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[DARKSPOT Pipeline] Fatal pipeline failure for ${id}:`, err);
    currentInv.status = 'FAILED';
    currentInv.errorMessage = `Investigation pipeline halted: ${errorMsg}`;
    currentInv.progressStage = undefined;
    currentInv.activityLog!.push({
      timestamp: new Date().toISOString(),
      stage: 'FAILURE',
      description: `Pipeline aborted: ${errorMsg}`,
      status: 'ERROR',
    });
    upsertInvestigation(currentInv);
    return currentInv;
  }
}

/**
 * Executes or re-executes pipeline on an existing investigation (e.g. from DRAFT or FAILED)
 */
export async function runInvestigationFromExisting(existingInv: Investigation): Promise<Investigation> {
  const payload: NewInvestigationPayload = {
    decisionQuestion: existingInv.decisionQuestion,
    context: existingInv.context,
    sourceUrls: existingInv.sources.filter(s => s.url).map(s => s.url!),
    documents: existingInv.sources
      .filter(s => !s.url)
      .map(s => ({
        title: s.title,
        content: s.extractedPassage,
        publisher: s.publisher,
        fileName: s.fileRef,
      })),
  };
  return runInvestigationPipeline(payload, existingInv.id);
}
