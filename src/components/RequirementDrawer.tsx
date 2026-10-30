/**
 * DARKSPOT — Requirement Detail Inspector
 * Slide-over drawer providing forensic inspection of a requirement,
 * verbatim cited claims, underlying sources, and active verification actions.
 */

import React from 'react';
import {
  DecisionRequirement,
  EvidenceSource,
  ExtractedClaim,
  ContradictionFinding,
  VerificationAction,
} from '../types/intelligence.ts';
import { StatusBadge, PriorityBadge } from './StatusBadge.tsx';
import { X, ExternalLink, Quote, AlertTriangle, ArrowRight, CheckSquare } from 'lucide-react';

interface RequirementDrawerProps {
  requirement: DecisionRequirement | null;
  sources: EvidenceSource[];
  claims: ExtractedClaim[];
  contradictions: ContradictionFinding[];
  actions: VerificationAction[];
  onClose: () => void;
  onToggleAction?: (actionId: string) => void;
}

export const RequirementDrawer: React.FC<RequirementDrawerProps> = ({
  requirement,
  sources,
  claims,
  contradictions,
  actions,
  onClose,
  onToggleAction,
}) => {
  if (!requirement) return null;

  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const reqClaims = claims.filter(c => c.requirementId === requirement.id);
  const reqConflicts = contradictions.filter(con => con.requirementId === requirement.id);
  const reqActions = actions.filter(a => a.requirementId === requirement.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <PriorityBadge priority={requirement.priority} />
              <span className="text-slate-400">·</span>
              <StatusBadge status={requirement.status} />
              <span className="text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500 uppercase">{requirement.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {requirement.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Scope & Stakes */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Requirement Scope
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/70">
                {requirement.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Why It Matters to the Decision
              </h3>
              <p className="text-sm text-rose-950 leading-relaxed bg-rose-50/50 p-3 rounded border border-rose-200/60">
                {requirement.whyItMatters}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Required Evidence Standard
              </h3>
              <p className="text-xs font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                {requirement.evidenceNeeded}
              </p>
            </div>
          </div>

          {/* Section 2: Active Contradictions if any */}
          {reqConflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Detected Contradiction & Conflict ({reqConflicts.length})</span>
              </h3>
              {reqConflicts.map(con => (
                <div key={con.id} className="p-4 bg-rose-50/70 border border-rose-200 rounded-md space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-900 font-mono">
                    Conflict Type: {con.type}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded border border-rose-200/80">
                      <span className="font-semibold text-slate-900 block truncate">{con.claimA.sourceTitle}</span>
                      <p className="text-slate-700 italic mt-1">"{con.claimA.quote}"</p>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-rose-200/80">
                      <span className="font-semibold text-slate-900 block truncate">{con.claimB.sourceTitle}</span>
                      <p className="text-slate-700 italic mt-1">"{con.claimB.quote}"</p>
                    </div>
                  </div>
                  <div className="text-xs text-rose-900 pt-2 border-t border-rose-200">
                    <strong>Decision Risk:</strong> {con.impactAnalysis}
                  </div>
                  <div className="text-xs text-slate-700 bg-white/80 p-2 rounded border border-rose-100">
                    <strong>Resolution Step:</strong> {con.suggestedResolution}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Extracted Claims Traceability */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Collected Claims ({reqClaims.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Traceable to original source
              </span>
            </div>

            {reqClaims.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded text-center text-xs text-slate-500">
                No claims collected in provided sources addressing this requirement.
                <br />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ("Not found in collected sources" does not mean "does not exist")
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {reqClaims.map(claim => {
                  const source = sourceMap.get(claim.sourceId);
                  return (
                    <div
                      key={claim.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-slate-900 text-sm">
                          {claim.claimText}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 uppercase">
                          {claim.id}
                        </span>
                      </div>

                      {/* Verbatim Citation */}
                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 italic">
                        <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>"{claim.verbatimQuote}"</span>
                      </div>

                      {/* Source Metadata Anchor */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-medium text-slate-700">
                          {source?.title || 'Unknown Source'}
                        </span>
                        <span>·</span>
                        <span>Publisher: {source?.publisher || 'Unknown'}</span>
                        <span>·</span>
                        <span>Date: {claim.publicationDate || source?.publicationDate || 'Unknown'}</span>
                        {source?.url && (
                          <>
                            <span>·</span>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-900 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Prioritized Verification Actions */}
          {reqActions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Prescribed Verification Actions ({reqActions.length})
              </h3>
              <div className="space-y-2">
                {reqActions.map(action => (
                  <div
                    key={action.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {onToggleAction && (
                          <input
                            type="checkbox"
                            checked={action.completed}
                            onChange={() => onToggleAction(action.id)}
                            className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                        )}
                        <span className={`font-semibold ${action.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {action.whatNeedsVerification}
                        </span>
                      </div>
                      <PriorityBadge priority={action.priority} />
                    </div>
                    <div className="text-slate-600 pl-6">
                      <strong>Consult:</strong> {action.suggestedAuthority}
                    </div>
                    <div className="text-slate-600 pl-6">
                      <strong>Required Proof:</strong> {action.concreteEvidenceRequired}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
