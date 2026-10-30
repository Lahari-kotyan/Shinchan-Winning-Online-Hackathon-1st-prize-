/**
 * DARKSPOT — Workspace View: Information Gap & Contradiction Explorer
 * Forensic breakdown of missing requirements, direct contradictions, outdated claims,
 * and partial evidence.
 */

import React, { useState } from 'react';
import { Investigation, DecisionRequirement, ContradictionFinding } from '../types/intelligence.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import {
  AlertCircle,
  FileQuestion,
  Clock,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface GapsViewProps {
  investigation: Investigation;
  onSelectRequirement: (req: DecisionRequirement) => void;
  onNavigateToPlanner: () => void;
  onOpenResolveConflictModal?: (conflict: ContradictionFinding) => void;
}

export const GapsView: React.FC<GapsViewProps> = ({
  investigation,
  onSelectRequirement,
  onNavigateToPlanner,
  onOpenResolveConflictModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'conflicts' | 'missing' | 'outdated' | 'partial'>('conflicts');

  const conflictingReqs = investigation.requirements.filter(r => r.status === 'CONFLICTING');
  const missingReqs = investigation.requirements.filter(r => r.status === 'NOT_FOUND');
  const outdatedReqs = investigation.requirements.filter(r => r.status === 'OUTDATED');
  const partialReqs = investigation.requirements.filter(
    r => r.status === 'PARTIALLY_SUPPORTED' || r.status === 'INSUFFICIENT_EVIDENCE'
  );

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Information Gap & Contradiction Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          DARKSPOT's core innovation: Discovering what is missing, what conflicts, and what is outdated before you commit.
        </p>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-fit">
        <button
          onClick={() => setActiveSubTab('conflicts')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'conflicts'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Contradictions & Conflicts ({investigation.contradictions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('missing')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'missing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Missing Evidence ({missingReqs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('outdated')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'outdated'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Outdated Claims ({outdatedReqs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('partial')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === 'partial'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Partial / Insufficient ({partialReqs.length})
        </button>
      </div>

      {/* SubTab 1: Contradictions & Conflicts */}
      {activeSubTab === 'conflicts' && (
        <div className="space-y-6">
          <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-4 text-xs text-rose-950">
            <strong>Cross-Source Disagreement Protocol:</strong> A disagreement between sources is a signal to investigate, not automatic proof that one source is wrong. We normalize context before comparing statements.
          </div>

          {investigation.contradictions.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
              No direct contradictions detected among collected claims.
            </div>
          ) : (
            <div className="space-y-6">
              {investigation.contradictions.map(conflict => {
                const parentReq = investigation.requirements.find(r => r.id === conflict.requirementId);

                return (
                  <div
                    key={conflict.id}
                    className="border border-rose-200 bg-white rounded-lg p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-800 uppercase bg-rose-100 px-2 py-0.5 rounded">
                          {conflict.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm font-bold text-slate-900">
                          {conflict.requirementTitle}
                        </span>
                      </div>
                      {parentReq && (
                        <PriorityBadge priority={parentReq.priority} />
                      )}
                    </div>

                    {/* Side-by-Side Incompatible Claim Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Claim A */}
                      <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-800 truncate">{conflict.claimA.sourceTitle}</span>
                          <span>{conflict.claimA.date || 'Undated'}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {conflict.claimA.statement}
                        </p>
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          "{conflict.claimA.quote}"
                        </p>
                      </div>

                      {/* Claim B */}
                      <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-800 truncate">{conflict.claimB.sourceTitle}</span>
                          <span>{conflict.claimB.date || 'Undated'}</span>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {conflict.claimB.statement}
                        </p>
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          "{conflict.claimB.quote}"
                        </p>
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <div className="p-3 bg-rose-50/80 rounded border border-rose-200 text-xs text-rose-950 space-y-1">
                      <strong className="block text-[11px] uppercase tracking-wider text-rose-900">
                        Decision Impact Analysis:
                      </strong>
                      <p className="leading-relaxed">
                        {conflict.impactAnalysis}
                      </p>
                    </div>

                    {/* Resolution Status or Action */}
                    {conflict.resolved ? (
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                        <span className="font-bold text-emerald-700 uppercase font-mono text-[10px] shrink-0 mt-0.5">
                          ✓ RESOLVED:
                        </span>
                        <span>{conflict.resolutionNotes}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                        <div className="text-slate-700">
                          <strong className="text-slate-900">Recommended Resolution:</strong> {conflict.suggestedResolution}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onOpenResolveConflictModal && (
                            <button
                              onClick={() => onOpenResolveConflictModal(conflict)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              Resolve Discrepancy
                            </button>
                          )}
                          <button
                            onClick={onNavigateToPlanner}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            View Action
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Missing Requirements */}
      {activeSubTab === 'missing' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">
              Crucial Epistemic Principle:
            </p>
            <p>
              "Not found in collected sources" does NOT mean "does not exist in reality."
              It signifies an unexamined blind spot that poses risk until deliberately sought out and verified.
            </p>
          </div>

          {missingReqs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
              Every identified decision requirement has at least partial evidence collected.
            </div>
          ) : (
            <div className="space-y-3">
              {missingReqs.map(req => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequirement(req)}
                  className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer text-xs space-y-2 shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={req.priority} />
                      <span className="text-slate-300">·</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <span className="text-slate-400 group-hover:text-slate-900 inline-flex items-center gap-1 font-medium text-[11px]">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700">
                    {req.title}
                  </h3>

                  <p className="text-slate-600">
                    {req.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                    <span className="text-rose-900">
                      <strong>Why It Matters:</strong> {req.whyItMatters}
                    </span>
                    <span className="text-slate-500 font-mono">
                      <strong>Evidence Standard:</strong> {req.evidenceNeeded}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Outdated Claims */}
      {activeSubTab === 'outdated' && (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-lg text-xs text-orange-950">
            <strong>Freshness Notice:</strong> An older source is not automatically incorrect, but policies, stipends, legal thresholds, and APIs evolve. Outdated evidence warrants cross-checking against current-year releases.
          </div>

          {outdatedReqs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
              No evidence marked as outdated for current decision requirements.
            </div>
          ) : (
            <div className="space-y-3">
              {outdatedReqs.map(req => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequirement(req)}
                  className="p-4 bg-white border border-orange-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={req.priority} />
                      <span className="text-slate-300">·</span>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {req.title}
                  </h3>

                  <p className="text-slate-700">
                    {req.statusReason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 4: Partial / Insufficient Evidence */}
      {activeSubTab === 'partial' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-950">
            <strong>Ambiguity & Secondary Evidence:</strong> These requirements have passing mentions or partial coverage, but lack explicit operational boundaries or corroborating sources.
          </div>

          {partialReqs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
              No partially supported requirements identified.
            </div>
          ) : (
            <div className="space-y-3">
              {partialReqs.map(req => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequirement(req)}
                  className="p-4 bg-white border border-amber-200 rounded-lg hover:border-amber-300 transition-colors cursor-pointer text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={req.priority} />
                      <span className="text-slate-300">·</span>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {req.title}
                  </h3>

                  <p className="text-slate-700">
                    {req.statusReason}
                  </p>

                  {req.unresolvedGaps.length > 0 && (
                    <div className="pt-2 border-t border-amber-100 text-[11px] text-amber-900">
                      <strong>Remaining Questions:</strong> {req.unresolvedGaps.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
