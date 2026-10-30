/**
 * DARKSPOT — Workspace View: Prioritized Verification Planner
 * Turns information gaps into actionable next steps with designated authorities and evidence standards.
 */

import React, { useState } from 'react';
import { Investigation, VerificationAction } from '../types/intelligence.ts';
import { PriorityBadge } from './StatusBadge.tsx';
import {
  CheckSquare,
  Square,
  Copy,
  Check,
  Building2,
  FileCheck2,
  HelpCircle,
  Share2,
} from 'lucide-react';

interface PlannerViewProps {
  investigation: Investigation;
  onToggleAction: (actionId: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  investigation,
  onToggleAction,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const actions = investigation.verificationPlan;
  const filteredActions = actions.filter(
    a => filterPriority === 'all' || a.priority === filterPriority
  );

  const completedCount = actions.filter(a => a.completed).length;

  const handleCopyMarkdown = () => {
    const md = `# DARKSPOT — Verification Plan
Decision: ${investigation.decisionQuestion}
Date: ${new Date().toISOString().split('T')[0]}
Readiness Rating: ${investigation.readiness.status}
Completeness Score: ${investigation.readiness.completenessScore}%

## Prioritized Verification Tasks (${actions.length} total)

${actions
  .map(
    (a, i) => `### ${i + 1}. [${a.priority}] ${a.whatNeedsVerification}
- **Status:** ${a.completed ? 'COMPLETED' : 'PENDING'}
- **Requirement:** ${a.requirementTitle}
- **Why It Matters:** ${a.whyItMatters}
- **Authority to Consult:** ${a.suggestedAuthority}
- **Concrete Proof Needed:** ${a.concreteEvidenceRequired}
`
  )
  .join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Prioritized Verification Planner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Actionable next steps designed to close critical blind spots before you commit to this decision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Plan Markdown!' : 'Export Plan Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-semibold text-slate-900 block">
            Verification Progress: {completedCount} of {actions.length} Resolved
          </span>
          <span className="text-slate-500 mt-0.5 block">
            Resolve critical actions to increase overall Decision Completeness score.
          </span>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-md">
          <button
            onClick={() => setFilterPriority('all')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filterPriority === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({actions.length})
          </button>
          <button
            onClick={() => setFilterPriority('CRITICAL')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filterPriority === 'CRITICAL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterPriority('HIGH')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filterPriority === 'HIGH' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setFilterPriority('MEDIUM')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filterPriority === 'MEDIUM' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            No verification actions match the selected filter.
          </div>
        ) : (
          filteredActions.map((action, idx) => {
            const isCritical = action.priority === 'CRITICAL';

            return (
              <div
                key={action.id}
                className={`p-5 rounded-lg border bg-white shadow-xs transition-all ${
                  action.completed
                    ? 'border-slate-200 opacity-60 bg-slate-50/50'
                    : isCritical
                    ? 'border-rose-200 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleAction(action.id)}
                      className="mt-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                      title={action.completed ? 'Mark as pending' : 'Mark as verified'}
                    >
                      {action.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={action.priority} />
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {action.requirementTitle}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-bold ${
                          action.completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {action.whatNeedsVerification}
                      </h3>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-slate-400 uppercase">
                    STEP {idx + 1}
                  </span>
                </div>

                {/* Body Details */}
                <div className="pl-8 space-y-2.5 mt-3 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Why It Matters:</strong> {action.whyItMatters}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block text-[11px] uppercase">
                          Consult Authority:
                        </span>
                        <span className="text-slate-700">{action.suggestedAuthority}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                      <FileCheck2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block text-[11px] uppercase">
                          Required Proof:
                        </span>
                        <span className="text-slate-700">{action.concreteEvidenceRequired}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
