/**
 * DARKSPOT Pipeline — Stage 3: Contradiction & Conflict Detection
 * Evaluates claims addressing the same requirement across different sources.
 * Flags date discrepancies, threshold mismatches, policy conflicts, and numerical inconsistencies.
 */

import { generateStructuredJson } from '../ai.ts';
import {
  DecisionRequirement,
  EvidenceSource,
  ExtractedClaim,
  ContradictionFinding,
} from '../../types/intelligence.ts';

const CONTRADICTION_DETECTION_SYSTEM = `
You are the Contradiction Analysis Engine of DARKSPOT.
Your job is to compare claims that address the same Decision Requirement across different sources and detect genuine conflicts.

TYPES OF CONFLICT:
- DIRECT_CONTRADICTION: One source says X is mandatory/allowed, while another says X is forbidden/optional.
- DATE_DISCREPANCY: Sources give different deadlines, start dates, or milestones for the exact same event.
- NUMERICAL_MISMATCH: Inconsistent monetary amounts, percentages, limits, hours, or requirements.
- SCOPE_MISMATCH: Incompatible statements regarding who is covered or what conditions apply.

STRICT CONTEXT RULES:
- Do not treat every minor difference as a conflict (e.g. 2024 historical fact vs 2026 current rule if clearly marked as history).
- If one claim clearly supersedes another by virtue of being an official amendment or later publication date, note that, but still register the discrepancy so the user knows an older document is floating around.
- Explain the real impact: why this discrepancy threatens the decision.
- Provide a concrete "suggestedResolution" (e.g., "Request confirmation from the Admissions Registrar regarding the active March vs April cutoff").

Output JSON array:
[
  {
    "requirementId": "req-1",
    "type": "DIRECT_CONTRADICTION" | "DATE_DISCREPANCY" | "NUMERICAL_MISMATCH" | "SCOPE_MISMATCH",
    "claimA_id": "claim-1",
    "claimB_id": "claim-2",
    "impactAnalysis": "string",
    "suggestedResolution": "string"
  }
]
`;

export async function detectContradictions(
  requirements: DecisionRequirement[],
  sources: EvidenceSource[],
  claims: ExtractedClaim[]
): Promise<ContradictionFinding[]> {
  if (claims.length < 2) {
    return [];
  }

  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const claimMap = new Map(claims.map(c => [c.id, c]));

  // Group claims by requirement
  const claimsByReq = new Map<string, ExtractedClaim[]>();
  for (const c of claims) {
    const list = claimsByReq.get(c.requirementId) || [];
    list.push(c);
    claimsByReq.set(c.requirementId, list);
  }

  // Filter requirements that have at least 2 claims from different sources
  const candidateReqs: Array<{ req: DecisionRequirement; reqClaims: ExtractedClaim[] }> = [];
  for (const req of requirements) {
    const rClaims = claimsByReq.get(req.id) || [];
    const uniqueSources = new Set(rClaims.map(c => c.sourceId));
    if (uniqueSources.size >= 2) {
      candidateReqs.push({ req, reqClaims: rClaims });
    }
  }

  if (candidateReqs.length === 0) {
    return [];
  }

  const prompt = candidateReqs
    .map(({ req, reqClaims }) => {
      const claimsText = reqClaims
        .map(c => {
          const s = sourceMap.get(c.sourceId);
          return `  [${c.id}] (Source: "${s?.title}", Date: ${c.publicationDate || s?.publicationDate || 'Unknown'}): "${c.claimText}"\n    Quote: "${c.verbatimQuote}"`;
        })
        .join('\n');
      return `Requirement [${req.id}] ${req.title}:\n${claimsText}`;
    })
    .join('\n\n');

  const fallbackFactory = () => [];

  const rawFindings = await generateStructuredJson<
    Array<{
      requirementId: string;
      type: 'DIRECT_CONTRADICTION' | 'DATE_DISCREPANCY' | 'NUMERICAL_MISMATCH' | 'SCOPE_MISMATCH';
      claimA_id: string;
      claimB_id: string;
      impactAnalysis: string;
      suggestedResolution: string;
    }>
  >(CONTRADICTION_DETECTION_SYSTEM, prompt, fallbackFactory);

  const findings: ContradictionFinding[] = [];
  rawFindings.forEach((f, idx) => {
    const claimA = claimMap.get(f.claimA_id);
    const claimB = claimMap.get(f.claimB_id);
    const req = requirements.find(r => r.id === f.requirementId);

    if (claimA && claimB && req) {
      const srcA = sourceMap.get(claimA.sourceId);
      const srcB = sourceMap.get(claimB.sourceId);

      // Link contradiction in claims
      claimA.contradictsClaimIds = claimA.contradictsClaimIds || [];
      if (!claimA.contradictsClaimIds.includes(claimB.id)) claimA.contradictsClaimIds.push(claimB.id);
      claimB.contradictsClaimIds = claimB.contradictsClaimIds || [];
      if (!claimB.contradictsClaimIds.includes(claimA.id)) claimB.contradictsClaimIds.push(claimA.id);

      findings.push({
        id: `conflict-${idx + 1}`,
        requirementId: req.id,
        requirementTitle: req.title,
        type: f.type,
        claimA: {
          claimId: claimA.id,
          sourceId: claimA.sourceId,
          sourceTitle: srcA?.title || 'Source A',
          statement: claimA.claimText,
          quote: claimA.verbatimQuote,
          date: claimA.publicationDate || srcA?.publicationDate,
        },
        claimB: {
          claimId: claimB.id,
          sourceId: claimB.sourceId,
          sourceTitle: srcB?.title || 'Source B',
          statement: claimB.claimText,
          quote: claimB.verbatimQuote,
          date: claimB.publicationDate || srcB?.publicationDate,
        },
        impactAnalysis: f.impactAnalysis,
        suggestedResolution: f.suggestedResolution,
      });
    }
  });

  return findings;
}
