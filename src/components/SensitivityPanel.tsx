/**
 * DARKSPOT — Sensitivity Analysis: "What Flips This Verdict?"
 * Computes counterfactual completeness score deltas to pinpoint the single highest-leverage actions.
 */

import React from 'react';
import {
  Investigation,
  DecisionRequirement,
  ContradictionFinding,
  RequirementPriority,
  RequirementStatus,
} from '../types/intelligence.ts';
import {
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { PriorityBadge } from './StatusBadge.tsx';

interface SensitivityPanelProps {
  investigation: Investigation;
  onSelectRequirement: (req: DecisionRequirement) => void;
  onResolveConflict?: (conflict: ContradictionFinding) => void;
}

interface LeverageItem {
  id: string;
  type: 'REQUIREMENT_GAP' | 'ACTIVE_CONFLICT';
  title: string;
  priority: RequirementPriority;
  currentStatus: string;
  potentialDelta: number;
  newScore: number;
  explanation: string;
  targetRequirement?: DecisionRequirement;
  targetConflict?: ContradictionFinding;
}

const PRIORITY_WEIGHTS: Record<RequirementPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const STATUS_WEIGHTS: Record<RequirementStatus, number> = {
  SUPPORTED: 1.0,
  USER_ASSERTED: 0.65,
  PARTIALLY_SUPPORTED: 0.45,
  OUTDATED: 0.2,
  INSUFFICIENT_EVIDENCE: 0.15,
  CONFLICTING: 0.0,
  NOT_FOUND: 0.0,
};

export const SensitivityPanel: React.FC<SensitivityPanelProps> = ({
  investigation,
  onSelectRequirement,
  onResolveConflict,
}) => {
  const requirements = investigation.requirements || [];
  const activeConflicts = (investigation.contradictions || []).filter(c => !c.resolved);

  if (requirements.length === 0) return null;

  // Calculate base score mathematics
  let totalPotential = 0;
  let currentEarned = 0;

  for (const req of requirements) {
    const weight = PRIORITY_WEIGHTS[req.priority] || 2;
    totalPotential += weight;
    const mult = STATUS_WEIGHTS[req.status] || 0;
    currentEarned += weight * mult;
  }

  const currentScore = totalPotential > 0 ? Math.round((currentEarned / totalPotential) * 100) : 0;

  // Compute counterfactual deltas
  const candidates: LeverageItem[] = [];

  // 1. Unresolved conflicts: resolving pushes CONFLICTING (0.0) -> USER_ASSERTED (0.65)
  for (const conflict of activeConflicts) {
    const parentReq = requirements.find(r => r.id === conflict.requirementId);
    if (!parentReq) continue;
    const weight = PRIORITY_WEIGHTS[parentReq.priority] || 2;
    const currentMult = STATUS_WEIGHTS[parentReq.status] || 0;
    const resolvedMult = 0.65; // User asserted status
    const gainedPoints = weight * Math.max(0, resolvedMult - currentMult);
    const counterfactualScore = Math.round(((currentEarned + gainedPoints) / totalPotential) * 100);
    const delta = counterfactualScore - currentScore;

    if (delta > 0) {
      candidates.push({
        id: `sens-conflict-${conflict.id}`,
        type: 'ACTIVE_CONFLICT',
        title: `Resolve conflict: "${conflict.requirementTitle}"`,
        priority: parentReq.priority,
        currentStatus: 'CONFLICTING',
        potentialDelta: delta,
        newScore: counterfactualScore,
        explanation: `Reconciling "${conflict.claimA.sourceTitle}" vs "${conflict.claimB.sourceTitle}" clears the dealbreaker and earns partial completeness.`,
        targetRequirement: parentReq,
        targetConflict: conflict,
      });
    }
  }

  // 2. Missing or partially supported requirements -> if upgraded to SUPPORTED (1.0)
  for (const req of requirements) {
    if (req.status === 'SUPPORTED') continue;
    const weight = PRIORITY_WEIGHTS[req.priority] || 2;
    const currentMult = STATUS_WEIGHTS[req.status] || 0;
    const gainedPoints = weight * (1.0 - currentMult);
    const counterfactualScore = Math.round(((currentEarned + gainedPoints) / totalPotential) * 100);
    const delta = counterfactualScore - currentScore;

    if (delta > 0) {
      candidates.push({
        id: `sens-req-${req.id}`,
        type: 'REQUIREMENT_GAP',
        title: `Verify requirement: "${req.title}"`,
        priority: req.priority,
        currentStatus: req.status.replace('_', ' '),
        potentialDelta: delta,
        newScore: counterfactualScore,
        explanation: req.whyItMatters || `Providing official empirical evidence upgrades status from ${req.status} to fully SUPPORTED.`,
        targetRequirement: req,
      });
    }
  }

  // Sort by highest potential delta descending, then priority
  candidates.sort((a, b) => {
    if (b.potentialDelta !== a.potentialDelta) return b.potentialDelta - a.potentialDelta;
    return PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
  });

  const pivotPoint = candidates[0] || null;

  return (
    <div className="border border-slate-200 bg-white rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Sensitivity Analysis: What Flips This Verdict?
            </h3>
            <p className="text-[11px] text-slate-500">
              Counterfactual simulation ranking which single gap produces the largest mathematical jump in decision readiness
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-500">
          Baseline Score: <strong className="text-slate-900 font-bold">{currentScore}%</strong>
        </span>
      </div>

      {pivotPoint ? (
        <div className="space-y-4">
          {/* Hero Pivot Point Card */}
          <div className="p-4 bg-linear-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  Highest-Leverage Pivot Point
                </span>
                <PriorityBadge priority={pivotPoint.priority} />
                <span className="text-slate-400">·</span>
                <span className="text-[11px] font-mono text-slate-600">
                  Current: {pivotPoint.currentStatus}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">
                {pivotPoint.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {pivotPoint.explanation}
              </p>
            </div>

            {/* Delta Score Visualizer */}
            <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-md border border-amber-200 shadow-2xs">
              <div className="text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Baseline</span>
                <span className="text-base font-bold font-mono text-slate-700">{currentScore}%</span>
              </div>

              <ArrowRight className="w-4 h-4 text-amber-600" />

              <div className="text-center">
                <span className="text-[10px] uppercase font-mono text-emerald-600 font-bold block">New Score</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  {pivotPoint.newScore}%
                </span>
              </div>

              <div className="pl-2 border-l border-slate-100 flex flex-col items-center justify-center">
                <span className="text-xs font-extrabold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  +{pivotPoint.potentialDelta}%
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">delta</span>
              </div>

              {pivotPoint.targetConflict && onResolveConflict ? (
                <button
                  onClick={() => onResolveConflict(pivotPoint.targetConflict!)}
                  className="ml-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
                >
                  Resolve Now
                </button>
              ) : pivotPoint.targetRequirement ? (
                <button
                  onClick={() => onSelectRequirement(pivotPoint.targetRequirement!)}
                  className="ml-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors whitespace-nowrap shadow-xs"
                >
                  Inspect Gap
                </button>
              ) : null}
            </div>
          </div>

          {/* Secondary Candidates List */}
          {candidates.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                Next Highest Sensitivity Candidates ({candidates.length - 1}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {candidates.slice(1, 4).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.targetConflict && onResolveConflict) {
                        onResolveConflict(item.targetConflict);
                      } else if (item.targetRequirement) {
                        onSelectRequirement(item.targetRequirement);
                      }
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md text-left transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-0.5">
                        <span className="font-bold text-slate-700 uppercase">{item.priority}</span>
                        <span>·</span>
                        <span className="truncate">{item.currentStatus}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate block">
                        {item.title}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span>+{item.potentialDelta}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center bg-slate-50 rounded text-xs text-slate-500">
          All decision requirements are fully supported. No sensitivity variance remaining.
        </div>
      )}
    </div>
  );
};
