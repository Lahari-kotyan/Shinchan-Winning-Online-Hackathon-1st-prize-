/**
 * DARKSPOT Pipeline — Stage 4: Information Gap & Completeness Classification
 * Evaluates each decision requirement against collected claims and detected conflicts.
 * Categorizes strictly into SUPPORTED, PARTIALLY_SUPPORTED, CONFLICTING, OUTDATED,
 * INSUFFICIENT_EVIDENCE, or NOT_FOUND.
 */

import { generateStructuredJson } from '../ai.ts';
import {
  DecisionRequirement,
  EvidenceSource,
  ExtractedClaim,
  ContradictionFinding,
  GapStatus,
} from '../../types/intelligence.ts';

const GAP_ANALYSIS_SYSTEM = `
You are the Decision Completeness & Gap Analysis Engine of DARKSPOT.
Your purpose is to evaluate every Decision Requirement with intellectual honesty and scientific rigor.

STRICT GAP STATUS DEFINITIONS:
1. 'SUPPORTED': Clear, current, authoritative, non-conflicted evidence provides complete answers to what is needed.
2. 'PARTIALLY_SUPPORTED': Evidence exists but leaves critical edge cases, caveats, or scope undefined.
3. 'CONFLICTING': Two or more sources present irreconcilable claims, differing numbers, or conflicting deadlines.
4. 'OUTDATED': The available evidence dates from prior cycles, old regulations, or is known to be superseded.
5. 'INSUFFICIENT_EVIDENCE': Mentions exist but are secondary, vague, hearsay, or ungrounded.
6. 'NOT_FOUND': No evidence was found in the collected sources. (Remember: not found in collected sources does NOT mean it does not exist in the world).

For each requirement:
- Assign the accurate "status"
- Provide a clear, honest "statusReason" explaining the evidence state
- List explicit "unresolvedGaps" (concrete questions that remain unanswered)

Output JSON:
[
  {
    "requirementId": "req-1",
    "status": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "CONFLICTING" | "OUTDATED" | "INSUFFICIENT_EVIDENCE" | "NOT_FOUND",
    "statusReason": "string explaining exactly why",
    "unresolvedGaps": ["gap 1", "gap 2"]
  }
]
`;

export async function analyzeInformationGaps(
  requirements: DecisionRequirement[],
  sources: EvidenceSource[],
  claims: ExtractedClaim[],
  contradictions: ContradictionFinding[]
): Promise<DecisionRequirement[]> {
  const claimMapByReq = new Map<string, ExtractedClaim[]>();
  for (const c of claims) {
    const list = claimMapByReq.get(c.requirementId) || [];
    list.push(c);
    claimMapByReq.set(c.requirementId, list);
  }

  const conflictsByReq = new Map<string, ContradictionFinding[]>();
  for (const con of contradictions) {
    const list = conflictsByReq.get(con.requirementId) || [];
    list.push(con);
    conflictsByReq.set(con.requirementId, list);
  }

  const payloadText = requirements
    .map(r => {
      const rClaims = claimMapByReq.get(r.id) || [];
      const rConflicts = conflictsByReq.get(r.id) || [];
      const claimsList = rClaims
        .map(c => `  - Claim: "${c.claimText}" (Date: ${c.publicationDate || 'None'})`)
        .join('\n');
      const conflictList = rConflicts
        .map(c => `  - [CONFLICT ${c.type}]: ${c.impactAnalysis}`)
        .join('\n');

      return `[${r.id}] ${r.title} (Priority: ${r.priority})
Scope: ${r.description}
Evidence Needed: ${r.evidenceNeeded}
Collected Claims (${rClaims.length}):
${claimsList || '  (None)'}
Detected Conflicts (${rConflicts.length}):
${conflictList || '  (None)'}`;
    })
    .join('\n\n');

  const fallbackFactory = (): Array<{
    requirementId: string;
    status: GapStatus;
    statusReason: string;
    unresolvedGaps: string[];
  }> => {
    return requirements.map(r => {
      const rClaims = claimMapByReq.get(r.id) || [];
      const rConflicts = conflictsByReq.get(r.id) || [];

      if (rConflicts.length > 0) {
        return {
          requirementId: r.id,
          status: 'CONFLICTING' as GapStatus,
          statusReason: `Identified ${rConflicts.length} direct contradiction(s) between ingested sources.`,
          unresolvedGaps: [rConflicts[0].impactAnalysis],
        };
      }
      if (rClaims.length === 0) {
        return {
          requirementId: r.id,
          status: 'NOT_FOUND' as GapStatus,
          statusReason: 'Not found in the collected sources. Does not imply non-existence, but remains unverified.',
          unresolvedGaps: [`Missing primary evidence for: ${r.title}`],
        };
      }
      if (rClaims.some(c => c.publicationDate && parseInt(c.publicationDate) < 2025)) {
        return {
          requirementId: r.id,
          status: 'OUTDATED' as GapStatus,
          statusReason: 'Found claims originate from prior publication years and may not reflect current operational rules.',
          unresolvedGaps: ['Requires current cycle policy verification'],
        };
      }
      if (rClaims.length >= 2) {
        return {
          requirementId: r.id,
          status: 'SUPPORTED' as GapStatus,
          statusReason: 'Multiple corroborating claims from sources address this requirement without contradiction.',
          unresolvedGaps: [],
        };
      }
      return {
        requirementId: r.id,
        status: 'PARTIALLY_SUPPORTED' as GapStatus,
        statusReason: 'Single claim found without external cross-verification or explicit operational details.',
        unresolvedGaps: ['Awaiting secondary corroboration'],
      };
    });
  };

  const results = await generateStructuredJson<
    Array<{
      requirementId: string;
      status: GapStatus;
      statusReason: string;
      unresolvedGaps: string[];
    }>
  >(GAP_ANALYSIS_SYSTEM, payloadText, fallbackFactory);

  const resultMap = new Map(results.map(res => [res.requirementId, res]));

  return requirements.map(r => {
    const res = resultMap.get(r.id);
    const rClaims = claimMapByReq.get(r.id) || [];
    const rConflicts = conflictsByReq.get(r.id) || [];

    // Prioritize explicit CONFLICTING if conflicts exist
    let status: GapStatus = res?.status || 'NOT_FOUND';
    if (rConflicts.length > 0 && status !== 'CONFLICTING') {
      status = 'CONFLICTING';
    }

    return {
      ...r,
      claimIds: rClaims.map(c => c.id),
      status,
      statusReason:
        status === 'CONFLICTING' && rConflicts.length > 0
          ? `${rConflicts.length} active contradiction(s) found across sources. ${rConflicts[0].impactAnalysis}`
          : res?.statusReason || 'Pending evidence assessment.',
      unresolvedGaps: res?.unresolvedGaps || (status === 'SUPPORTED' ? [] : [`Unverified: ${r.title}`]),
    };
  });
}
