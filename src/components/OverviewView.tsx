/**
 * DARKSPOT — Workspace View: Decision Intelligence Overview & Command Center
 * Central research workspace: investigation title, status lifecycle banner,
 * readiness synthesis, metric KPIs, source collection panel, requirements matrix,
 * and chronological research activity history.
 */

import React, { useState } from 'react';
import {
  Investigation,
  DecisionRequirement,
  EvidenceSource,
  ContradictionFinding,
} from '../types/intelligence.ts';
import { ReadinessBanner } from './ReadinessBanner.tsx';
import { SensitivityPanel } from './SensitivityPanel.tsx';
import { StatusBadge, PriorityBadge, InvestigationLifecycleBadge } from './StatusBadge.tsx';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  History,
  AlertCircle,
  Loader2,
  FileUp,
} from 'lucide-react';
import { Button } from './ui/index.ts';

interface OverviewViewProps {
  investigation: Investigation;
  onSelectRequirement: (req: DecisionRequirement) => void;
  onNavigateToTab: (tab: 'evidence' | 'gaps' | 'planner' | 'graph') => void;
  onOpenAddEvidenceModal?: () => void;
  onRunInvestigation?: (id: string) => Promise<void>;
  onDeleteSource?: (sourceId: string) => Promise<void>;
  onResolveConflict?: (conflict: ContradictionFinding) => void;
  isRunningPipeline?: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  investigation,
  onSelectRequirement,
  onNavigateToTab,
  onOpenAddEvidenceModal,
  onRunInvestigation,
  onDeleteSource,
  onResolveConflict,
  isRunningPipeline = false,
}) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  const totalReqs = investigation.requirements.length;
  const supportedCount = investigation.requirements.filter(r => r.status === 'SUPPORTED' || r.status === 'USER_ASSERTED').length;
  const conflictingCount = investigation.contradictions.filter(c => !c.resolved).length;
  const missingCount = investigation.requirements.filter(r => r.status === 'NOT_FOUND').length;
  const openActionsCount = investigation.verificationPlan.filter(a => !a.completed).length;

  const isDraft = investigation.status === 'DRAFT';
  const isFailed = investigation.status === 'FAILED';
  const isProcessing = investigation.status === 'PROCESSING' || isRunningPipeline;
  const isPartiallyCompleted = investigation.status === 'PARTIALLY_COMPLETED';

  const handleDeleteSource = async (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    if (!onDeleteSource) return;
    if (window.confirm('Remove this evidence source from the investigation corpus?')) {
      try {
        setDeletingSourceId(sourceId);
        await onDeleteSource(sourceId);
      } finally {
        setDeletingSourceId(null);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Investigation Metadata Strip */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <InvestigationLifecycleBadge status={investigation.status} />

            {investigation.isSample && (
              <span className="text-[11px] font-mono font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                ⚡ CALIBRATED HACKATHON DEMO DATASET
              </span>
            )}

            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {investigation.id}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Updated: {new Date(investigation.updatedAt || investigation.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            {isDraft && onRunInvestigation && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRunInvestigation(investigation.id)}
                loading={isProcessing}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Execute Analysis
              </Button>
            )}

            {isFailed && onRunInvestigation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunInvestigation(investigation.id)}
                loading={isProcessing}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Retry Pipeline
              </Button>
            )}

            {onOpenAddEvidenceModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAddEvidenceModal}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Evidence
              </Button>
            )}
          </div>
        </div>

        {/* Primary Decision Dilemma Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {investigation.decisionQuestion}
        </h1>

        {investigation.context && (
          <p className="text-sm text-slate-600 mt-2 max-w-4xl leading-relaxed">
            {investigation.context}
          </p>
        )}
      </div>

      {/* 2. DRAFT OR PROCESSING STATUS CALLOUT BANNER */}
      {isDraft && (
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Investigation Saved in Draft Mode
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {investigation.sources.length} evidence source(s) configured. Click "Execute Deep Analysis" to decompose requirements, extract verifiable claims, and audit blind spots.
              </p>
            </div>
          </div>
          {onRunInvestigation && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRunInvestigation(investigation.id)}
              loading={isProcessing}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Execute Deep Analysis
            </Button>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-700 animate-spin shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-indigo-900">
              Pipeline Processing Active
            </h3>
            <p className="text-xs text-indigo-700 font-mono mt-0.5">
              {investigation.progressStage || 'Cross-referencing evidence corpus across requirements...'}
            </p>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Analysis Pipeline Halted
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {investigation.errorMessage || 'An error occurred during evidence synthesis.'}
              </p>
            </div>
          </div>
          {onRunInvestigation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunInvestigation(investigation.id)}
              loading={isProcessing}
            >
              Retry Pipeline
            </Button>
          )}
        </div>
      )}

      {isPartiallyCompleted && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {investigation.errorMessage || 'Notice: Some external reference sources could not be retrieved. Analysis reflects verified corpus.'}
          </span>
        </div>
      )}

      {/* 3. Decision Readiness Synthesis Banner (unless in draft without analysis) */}
      {!isDraft && (
        <ReadinessBanner
          readiness={investigation.readiness}
          requirements={investigation.requirements}
          contradictions={investigation.contradictions}
        />
      )}

      {/* 4. 4-Metric High-Density KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Decision Requirements</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalReqs}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isDraft ? 'Pending decomposition' : `${supportedCount} verified · ${totalReqs - supportedCount} unresolved`}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('gaps')}
          className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Direct Contradictions</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-1">
            {conflictingCount}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            {conflictingCount > 0 ? 'Requires explicit reconciliation' : 'Zero conflicting claims'}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('evidence')}
          className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Evidence Sources</span>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {investigation.sources.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {investigation.claims.length} claims extracted
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('planner')}
          className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Actionable Next Steps</span>
            <CheckCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {openActionsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Prioritized verification tasks
          </div>
        </div>
      </div>

      {/* 4.5. Sensitivity Analysis: "What Flips This Verdict?" Simulator */}
      {!isDraft && (
        <SensitivityPanel
          investigation={investigation}
          onSelectRequirement={onSelectRequirement}
          onResolveConflict={onResolveConflict}
        />
      )}

      {/* 5. Source Collection Panel */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Source Collection Corpus ({investigation.sources.length})
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official documents, web URLs, and primary disclosures supporting this decision.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAddEvidenceModal && (
              <button
                onClick={onOpenAddEvidenceModal}
                className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Source</span>
              </button>
            )}
            <button
              onClick={() => onNavigateToTab('evidence')}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer ml-1"
            >
              <span>Explore Evidence</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {investigation.sources.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {investigation.sources.map(src => {
              const typeLabel = src.sourceType.replace(/_/g, ' ');
              return (
                <div
                  key={src.id}
                  className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                        {typeLabel}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {src.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Publisher: <strong className="text-slate-700">{src.publisher}</strong></span>
                      <span>·</span>
                      <span className="font-mono">{src.domain}</span>
                      {src.publicationDate && (
                        <>
                          <span>·</span>
                          <span>Pub: {src.publicationDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span title="Defensible authority rating">
                        Auth: <strong className="text-slate-900">{src.authorityScore}%</strong>
                      </span>
                      <span title="Information freshness score">
                        Fresh: <strong className="text-slate-900">{src.freshnessScore}%</strong>
                      </span>
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Open external source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {onDeleteSource && (
                      <button
                        onClick={e => handleDeleteSource(e, src.id)}
                        disabled={deletingSourceId === src.id}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer disabled:opacity-50"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No sources configured for this investigation yet. Click "Add Source" to provide URLs or documents.
          </div>
        )}
      </div>

      {/* 6. Decision Requirements Matrix */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Information Requirements Matrix ({investigation.requirements.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any requirement row to inspect verbatim evidence passages and underlying sources.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('graph')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Relationship Topology</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {investigation.requirements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/40 uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-2.5 px-4 font-semibold">Priority</th>
                  <th className="py-2.5 px-4 font-semibold">Requirement & Scope</th>
                  <th className="py-2.5 px-4 font-semibold">Evidence Status</th>
                  <th className="py-2.5 px-4 font-semibold">Grounded Evidence Status Note</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investigation.requirements.map(req => {
                  return (
                    <tr
                      key={req.id}
                      onClick={() => onSelectRequirement(req)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 shrink-0 whitespace-nowrap">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 text-sm group-hover:text-slate-700">
                          {req.title}
                        </div>
                        <p className="text-slate-500 line-clamp-1 mt-0.5 text-[11px]">
                          {req.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 max-w-md text-slate-700 text-xs leading-relaxed">
                        {req.statusReason}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-slate-400 group-hover:text-slate-900 inline-flex items-center gap-1 font-medium">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            {isDraft
              ? 'Requirements will be synthesized when you click "Execute Deep Analysis".'
              : 'No requirements recorded.'}
          </div>
        )}
      </div>

      {/* 7. Pre-Conditions & Unresolved Risks Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Mandatory Pre-Conditions Before Committing
            </h3>
          </div>
          {investigation.readiness.preConditions.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700">
              {investigation.readiness.preConditions.map((cond, i) => (
                <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-slate-900 font-bold shrink-0 font-mono">[{i + 1}]</span>
                  <span className="leading-relaxed">{cond}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              All prerequisites satisfied. Proceed in accordance with standard operating procedures.
            </p>
          )}
        </div>

        <div className="border border-rose-200 rounded-lg p-5 bg-rose-50/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Unresolved Vulnerabilities & Evidence Blindspots
            </h3>
          </div>
          {investigation.readiness.unresolvedRisks.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-700">
              {investigation.readiness.unresolvedRisks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded border border-rose-100">
                  <span className="text-rose-600 font-bold shrink-0">!</span>
                  <span className="leading-relaxed">{risk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No critical risks remaining.
            </p>
          )}
        </div>
      </div>

      {/* 8. Research Activity & Processing Log Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          onClick={() => setShowActivityLog(!showActivityLog)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50/80 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Research Activity & Pipeline Execution Log</span>
            <span className="text-[11px] font-mono text-slate-400">
              ({investigation.activityLog?.length || 6} events recorded)
            </span>
          </div>
          <span className="text-slate-400">{showActivityLog ? 'Hide ↑' : 'Show Details ↓'}</span>
        </button>

        {showActivityLog && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/40 space-y-3 font-mono text-xs">
            {investigation.activityLog && investigation.activityLog.length > 0 ? (
              investigation.activityLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 text-slate-700">
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : log.status === 'WARNING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : log.status === 'ERROR'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {log.stage}
                  </span>
                  <span className="text-slate-800 leading-relaxed font-sans text-xs">
                    {log.description}
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2 text-slate-600 font-sans text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Decision decomposition completed: synthesized {investigation.requirements.length} information requirements.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ingested {investigation.sources.length} sources and extracted {investigation.claims.length} traceable claims.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Contradiction radar scanned corpus: {investigation.contradictions.length} discrepancies discovered.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Readiness assessment calculated: {investigation.readiness.completenessScore}% completeness index.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
