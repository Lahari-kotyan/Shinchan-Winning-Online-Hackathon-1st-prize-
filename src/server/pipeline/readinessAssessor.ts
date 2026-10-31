/**
 * DARKSPOT Pipeline — Stage 6: Decision Readiness Assessment
 * Synthesizes completeness score with defensible mathematical weights and qualitative risk synthesis.
 */

import { generateStructuredJson } from '../ai.ts';
import {
  DecisionRequirement,
  ContradictionFinding,
  DecisionReadiness,
} from '../../types/intelligence.ts';

const PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const STATUS_MULTIPLIERS: Record<string, number> = {
  SUPPORTED: 1.0,
  USER_ASSERTED: 0.65,
  PARTIALLY_SUPPORTED: 0.45,
  OUTDATED: 0.2,
  INSUFFICIENT_EVIDENCE: 0.15,
  CONFLICTING: 0.0,
  NOT_FOUND: 0.0,
};

export function calculateCompletenessScore(requirements: DecisionRequirement[]): number {
  if (requirements.length === 0) return 0;

  let totalMax = 0;
  let totalEarned = 0;

  for (const r of requirements) {
    const weight = PRIORITY_WEIGHTS[r.priority] ?? 2;
    const mult = STATUS_MULTIPLIERS[r.status] ?? 0;
    totalMax += weight;
    totalEarned += weight * mult;
  }

  if (totalMax === 0) return 0;
  return Math.round((totalEarned / totalMax) * 100);
}

const READINESS_SYNTHESIS_SYSTEM = `
You are the Chief Intelligence Assessor of DARKSPOT.
Provide a clear, objective, non-hallucinatory assessment of whether the user should proceed with their decision, proceed with caution, or hold.

Do not use sugar-coated cheerleading. State precisely:
1. "summary": 2-3 concise sentences stating the grounded situation.
2. "supportedAspects": Array of what is solid and verifiable.
3. "unresolvedRisks": Array of risks stemming from missing/incomplete evidence.
4. "materialGaps": Array of findings that, if false or resolved negatively, would reverse the decision.
5. "preConditions": Array of mandatory conditions that must be verified before signing/committing.

Return JSON:
{
  "summary": "string",
  "supportedAspects": ["string"],
  "unresolvedRisks": ["string"],
  "materialGaps": ["string"],
  "preConditions": ["string"]
}
`;

export async function assessDecisionReadiness(
  decisionQuestion: string,
  requirements: DecisionRequirement[],
  contradictions: ContradictionFinding[]
): Promise<DecisionReadiness> {
  const score = calculateCompletenessScore(requirements);

  const hasCriticalConflict = contradictions.some(c => {
    const r = requirements.find(req => req.id === c.requirementId);
    return r?.priority === 'CRITICAL' || r?.priority === 'HIGH';
  });

  const hasCriticalMissing = requirements.some(
    r => r.priority === 'CRITICAL' && (r.status === 'NOT_FOUND' || r.status === 'CONFLICTING')
  );

  let status: 'DECISION_READY' | 'PROCEED_WITH_CAUTION' | 'NOT_READY';
  if (hasCriticalConflict || hasCriticalMissing || score < 50) {
    status = 'NOT_READY';
  } else if (score >= 82 && !requirements.some(r => r.priority === 'CRITICAL' && r.status !== 'SUPPORTED')) {
    status = 'DECISION_READY';
  } else {
    status = 'PROCEED_WITH_CAUTION';
  }

  const payload = `Decision Question: "${decisionQuestion}"
Calculated Evidence Completeness: ${score}%
Computed Rating: ${status}
Requirements Status:
${requirements.map(r => `- [${r.priority}] ${r.title}: ${r.status} (${r.statusReason})`).join('\n')}
Active Contradictions:
${contradictions.map(c => `- Conflict on ${c.requirementTitle} (${c.type}): ${c.impactAnalysis}`).join('\n') || 'None'}
`;

  const fallbackFactory = () => ({
    summary:
      status === 'NOT_READY'
        ? `Evidence completeness is currently ${score}%. Critical gaps or contradictions remain unresolved, preventing a safe decision.`
        : status === 'PROCEED_WITH_CAUTION'
        ? `Evidence completeness is at ${score}%. Key foundational terms are supported, but peripheral or operational specifics remain unverified.`
        : `Evidence completeness is at ${score}%. Core requirements are thoroughly corroborated by ingested documentation.`,
    supportedAspects: requirements
      .filter(r => r.status === 'SUPPORTED')
      .map(r => r.title),
    unresolvedRisks: requirements
      .filter(r => r.status === 'CONFLICTING' || r.status === 'OUTDATED' || r.status === 'NOT_FOUND')
      .map(r => `${r.title}: ${r.statusReason}`),
    materialGaps: requirements
      .filter(r => r.priority === 'CRITICAL' && r.status !== 'SUPPORTED')
      .map(r => r.whyItMatters),
    preConditions: requirements
      .filter(r => r.status !== 'SUPPORTED')
      .map(r => `Resolve ${r.title} with authoritative documentation`),
  });

  const qualitative = await generateStructuredJson<{
    summary: string;
    supportedAspects: string[];
    unresolvedRisks: string[];
    materialGaps: string[];
    preConditions: string[];
  }>(READINESS_SYNTHESIS_SYSTEM, payload, fallbackFactory);

  return {
    status,
    completenessScore: score,
    summary: qualitative.summary,
    supportedAspects: qualitative.supportedAspects || [],
    unresolvedRisks: qualitative.unresolvedRisks || [],
    materialGaps: qualitative.materialGaps || [],
    preConditions: qualitative.preConditions || [],
  };
}
