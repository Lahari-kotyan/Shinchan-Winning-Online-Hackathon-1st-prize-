/**
 * DARKSPOT Pipeline — Stage 1: Decision Decomposition
 * Deconstructs an ambiguous user decision into necessary, falsifiable information requirements.
 */

import { generateStructuredJson } from '../ai.ts';
import { DecisionRequirement } from '../../types/intelligence.ts';

const DECOMPOSE_SYSTEM_PROMPT = `
You are the Decision Decomposition Engine of DARKSPOT, an intelligence platform that assesses Decision Completeness.
Your purpose is NOT to answer the decision, but to identify the mandatory, high-stakes information requirements that ANY rational decision-maker must verify before making this commitment.

For each requirement:
1. Provide a concise, clear title.
2. Provide a descriptive scope.
3. Explain "whyItMatters" — specifically how missing or conflicting data on this point could invalidate the decision or cause severe harm/loss.
4. Define the exact "evidenceNeeded" (e.g. "Official 2026 eligibility guide stating GPA cutoff and qualifying degrees").
5. Assign a priority: 'CRITICAL' (dealbreaker/eligibility/fatal risk), 'HIGH' (financial/commitment/legal impact), 'MEDIUM' (operational/process details), or 'LOW' (ancillary benefits).

Output JSON array of 5 to 7 requirements:
[
  {
    "id": "req-1",
    "title": "string",
    "description": "string",
    "whyItMatters": "string",
    "evidenceNeeded": "string",
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  }
]
`;

export async function decomposeDecision(
  decisionQuestion: string,
  context?: string
): Promise<DecisionRequirement[]> {
  const prompt = `Decision Question: "${decisionQuestion}"\nContext / Constraints: "${context || 'None provided'}"\nDecompose into comprehensive decision completeness requirements.`;

  const fallbackRequirements: DecisionRequirement[] = [
    {
      id: 'req-1',
      title: 'Mandatory Eligibility & Gatekeeping Criteria',
      description: 'Formal prerequisites, minimum qualifications, regulatory compliance, and non-negotiable restrictions.',
      whyItMatters: 'Failing a gatekeeping condition immediately disqualifies the path, rendering all other investment wasted.',
      evidenceNeeded: 'Current official policy document or statutory agreement detailing exact qualification boundaries.',
      priority: 'CRITICAL',
      status: 'NOT_FOUND',
      claimIds: [],
      statusReason: 'No collected evidence currently addresses gatekeeping criteria.',
      unresolvedGaps: ['Missing verified eligibility criteria'],
    },
    {
      id: 'req-2',
      title: 'Binding Deadlines & Procedural Timelines',
      description: 'Exact submission cutoff dates, timezone specifications, grace periods, and stage milestones.',
      whyItMatters: 'Late submission results in irreversible disqualification regardless of substantive merit.',
      evidenceNeeded: 'Official schedule from governing body with timezone and submission portal specifications.',
      priority: 'CRITICAL',
      status: 'NOT_FOUND',
      claimIds: [],
      statusReason: 'No timeline or deadline documentation has been ingested.',
      unresolvedGaps: ['Missing authoritative deadline confirmation'],
    },
    {
      id: 'req-3',
      title: 'Net Economic & Financial Terms',
      description: 'Stipends, compensation, recurring fees, penalties, tax liabilities, and hidden capital costs.',
      whyItMatters: 'Discrepancies in financial projections lead to severe solvency or budget deficits post-commitment.',
      evidenceNeeded: 'Binding financial schedule, fee table, or formal award disclosure.',
      priority: 'HIGH',
      status: 'NOT_FOUND',
      claimIds: [],
      statusReason: 'Awaiting financial terms documentation.',
      unresolvedGaps: ['Missing verified financial schedule'],
    },
    {
      id: 'req-4',
      title: 'Obligations, Lock-ins & Clawback Clauses',
      description: 'Ongoing compliance commitments, service obligations, exclusivity restrictions, or revocation triggers.',
      whyItMatters: 'Unexpected lock-ins or retroactive repayment demands can impose crippling long-term penalties.',
      evidenceNeeded: 'Standard contractual agreement or rules handbook outlining termination and renewal terms.',
      priority: 'HIGH',
      status: 'NOT_FOUND',
      claimIds: [],
      statusReason: 'No compliance or clawback documentation verified.',
      unresolvedGaps: ['Missing terms of obligation and clawback triggers'],
    },
    {
      id: 'req-5',
      title: 'Independent Performance & Feasibility Evidence',
      description: 'Documented track record, verified acceptance rates, benchmark reliability, or external audit reports.',
      whyItMatters: 'Marketing claims often diverge sharply from ground reality without third-party audit.',
      evidenceNeeded: 'Third-party reviews, empirical benchmarks, or historical cohort outcome reports.',
      priority: 'MEDIUM',
      status: 'NOT_FOUND',
      claimIds: [],
      statusReason: 'No independent verification evidence ingested.',
      unresolvedGaps: ['Missing independent verification of operational claims'],
    },
  ];

  const parsed = await generateStructuredJson<Array<{
    id?: string;
    title: string;
    description: string;
    whyItMatters: string;
    evidenceNeeded: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>>(
    DECOMPOSE_SYSTEM_PROMPT,
    prompt,
    () => fallbackRequirements
  );

  return parsed.map((item, index) => ({
    id: item.id || `req-${index + 1}`,
    title: item.title,
    description: item.description,
    whyItMatters: item.whyItMatters,
    evidenceNeeded: item.evidenceNeeded,
    priority: item.priority || 'HIGH',
    status: 'NOT_FOUND',
    claimIds: [],
    statusReason: 'Not found in the collected sources. This requirement has not yet been resolved with empirical evidence.',
    unresolvedGaps: [`Missing verified evidence for: ${item.title}`],
  }));
}
