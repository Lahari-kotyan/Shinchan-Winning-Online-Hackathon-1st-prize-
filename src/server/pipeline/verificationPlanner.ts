/**
 * DARKSPOT Pipeline — Stage 5: Prioritized Verification Planner
 * Converts unresolved gaps, contradictions, and outdated findings into concrete next actions.
 */

import { generateStructuredJson } from '../ai.ts';
import {
  DecisionRequirement,
  ContradictionFinding,
  VerificationAction,
} from '../../types/intelligence.ts';

const PLANNER_SYSTEM = `
You are the Verification Action Planning Engine of DARKSPOT.
Your purpose is to generate concrete, high-leverage verification tasks for the user to resolve critical decision unknowns.

For each unresolved, conflicting, outdated, or insufficiently supported requirement:
1. Define precisely "whatNeedsVerification" (concrete question).
2. Explain "whyItMatters" to the final decision.
3. Assign priority ('CRITICAL', 'HIGH', or 'MEDIUM').
4. Recommend a "suggestedAuthority" (specific official, registry, legal counsel, API provider, or governing body).
5. Specify the exact "concreteEvidenceRequired" (e.g. "Written email from program director or signed PDF amendment").

Return JSON array:
[
  {
    "requirementId": "req-1",
    "whatNeedsVerification": "string",
    "whyItMatters": "string",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM",
    "suggestedAuthority": "string",
    "concreteEvidenceRequired": "string"
  }
]
`;

export async function generateVerificationPlan(
  requirements: DecisionRequirement[],
  contradictions: ContradictionFinding[]
): Promise<VerificationAction[]> {
  const unresolvedReqs = requirements.filter(r => r.status !== 'SUPPORTED');

  if (unresolvedReqs.length === 0 && contradictions.length === 0) {
    return [];
  }

  const reqSummary = unresolvedReqs
    .map(
      r => `Requirement [${r.id}] ${r.title} (Priority: ${r.priority}, Status: ${r.status})
Status Reason: ${r.statusReason}
Unresolved Gaps: ${r.unresolvedGaps.join('; ')}`
    )
    .join('\n\n');

  const conflictSummary = contradictions
    .map(
      c => `Conflict on [${c.requirementId}] ${c.requirementTitle} (${c.type}):
Claim A: "${c.claimA.statement}" (${c.claimA.sourceTitle})
Claim B: "${c.claimB.statement}" (${c.claimB.sourceTitle})
Resolution: ${c.suggestedResolution}`
    )
    .join('\n\n');

  const prompt = `Unresolved Requirements:\n${reqSummary}\n\nActive Conflicts:\n${conflictSummary || 'None'}\n\nGenerate prioritized verification actions.`;

  const fallbackFactory = (): VerificationAction[] => {
    return unresolvedReqs.map((r, idx) => ({
      id: `act-${idx + 1}`,
      requirementId: r.id,
      requirementTitle: r.title,
      whatNeedsVerification: `Verify current terms for ${r.title}`,
      whyItMatters: r.whyItMatters,
      priority: r.priority === 'CRITICAL' ? 'CRITICAL' : r.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      suggestedAuthority: 'Primary governing authority or official documentation custodian',
      concreteEvidenceRequired: `Current signed or timestamped documentation addressing ${r.evidenceNeeded}`,
      completed: false,
    }));
  };

  const actions = await generateStructuredJson<
    Array<{
      requirementId: string;
      whatNeedsVerification: string;
      whyItMatters: string;
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      suggestedAuthority: string;
      concreteEvidenceRequired: string;
    }>
  >(PLANNER_SYSTEM, prompt, fallbackFactory);

  return actions.map((act, index) => {
    const parentReq = requirements.find(r => r.id === act.requirementId);
    return {
      id: `act-${index + 1}`,
      requirementId: act.requirementId || requirements[0]?.id || 'req-1',
      requirementTitle: parentReq?.title || 'Decision Requirement',
      whatNeedsVerification: act.whatNeedsVerification,
      whyItMatters: act.whyItMatters,
      priority: act.priority || 'HIGH',
      suggestedAuthority: act.suggestedAuthority,
      concreteEvidenceRequired: act.concreteEvidenceRequired,
      completed: false,
    };
  });
}
