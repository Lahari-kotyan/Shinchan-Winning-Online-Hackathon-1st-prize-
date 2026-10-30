/**
 * DARKSPOT — Workspace View: Evidence Explorer & Claim Traceability
 * Enables forensic inspection of sources, extracted claims, and verbatim quotations.
 */

import React, { useState } from 'react';
import { Investigation, DecisionRequirement } from '../types/intelligence.ts';
import { PriorityBadge, StatusBadge } from './StatusBadge.tsx';
import {
  Search,
  ExternalLink,
  Quote,
  Shield,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';

interface EvidenceViewProps {
  investigation: Investigation;
  onSelectRequirement: (req: DecisionRequirement) => void;
  onOpenAddEvidenceModal?: () => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  investigation,
  onSelectRequirement,
  onOpenAddEvidenceModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const reqMap = new Map(investigation.requirements.map(r => [r.id, r]));
  const sourceMap = new Map(investigation.sources.map(s => [s.id, s]));

  const filteredClaims = investigation.claims.filter(claim => {
    const matchesSource = selectedSourceFilter === 'all' || claim.sourceId === selectedSourceFilter;
    const req = reqMap.get(claim.requirementId);
    const matchesSearch =
      !searchQuery ||
      claim.claimText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.verbatimQuote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req?.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Title & Summary */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Evidence Explorer & Claim Traceability
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Every finding in DARKSPOT is strictly traceable to empirical source passages. Inspect underlying documents and quotations below.
        </p>
      </div>

      {/* Ingested Sources Section */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Ingested Sources ({investigation.sources.length})
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Authority, retrieval date, and raw passage metadata
            </p>
          </div>

          {onOpenAddEvidenceModal && (
            <button
              onClick={onOpenAddEvidenceModal}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Evidence</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {investigation.sources.map(source => {
            const isExpanded = expandedSourceId === source.id;
            const sourceClaims = investigation.claims.filter(c => c.sourceId === source.id);

            return (
              <div key={source.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                        {source.sourceType.replace('_', ' ')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600 font-medium">{source.publisher}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        Pub: {source.publicationDate || 'Undated'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {source.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                      <span>Authority Score: <strong className="text-slate-800 font-mono">{source.authorityScore}/100</strong></span>
                      <span>·</span>
                      <span>Freshness: <strong className="text-slate-800 font-mono">{source.freshnessScore}/100</strong></span>
                      <span>·</span>
                      <span>Claims Extracted: <strong className="text-slate-800 font-mono">{sourceClaims.length}</strong></span>
                      {source.url && (
                        <>
                          <span>·</span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-900 hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedSourceId(isExpanded ? null : source.id)}
                    className="self-start md:self-center px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1 shrink-0"
                  >
                    <span>{isExpanded ? 'Hide Raw Passage' : 'Inspect Raw Passage'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Passage Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-mono text-slate-600 mb-1">
                      Reliability Notes: {source.reliabilityNotes}
                    </p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                      {source.extractedPassage}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Claims Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Extracted Discrete Claims ({filteredClaims.length})
            </h2>
            <p className="text-xs text-slate-500">
              Cross-linked to requirements and verified supporting quotations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Source */}
            <select
              value={selectedSourceFilter}
              onChange={e => setSelectedSourceFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Sources ({investigation.sources.length})</option>
              {investigation.sources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search claims or quotes..."
                className="text-xs text-slate-800 bg-white border border-slate-200 rounded-md py-1.5 pl-8 pr-3 w-56 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Claims Cards Grid */}
        <div className="space-y-3">
          {filteredClaims.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
              No claims match your current filters.
            </div>
          ) : (
            filteredClaims.map(claim => {
              const req = reqMap.get(claim.requirementId);
              const source = sourceMap.get(claim.sourceId);
              const hasConflict = claim.contradictsClaimIds && claim.contradictsClaimIds.length > 0;

              return (
                <div
                  key={claim.id}
                  className={`p-4 bg-white border rounded-lg transition-all shadow-xs ${
                    hasConflict ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                        [{claim.id}]
                      </span>
                      {hasConflict && (
                        <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          ⚡ CONFLICT DETECTED
                        </span>
                      )}
                      <span className="text-slate-300">·</span>
                      {req && (
                        <button
                          onClick={() => onSelectRequirement(req)}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          Requirement: {req.title}
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 shrink-0">
                      Date: {claim.publicationDate || 'Unknown'} · Confidence: {claim.confidence}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {claim.claimText}
                  </p>

                  {/* Verbatim Quotation Proof */}
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700 italic">
                    <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>"{claim.verbatimQuote}"</span>
                  </div>

                  {/* Source Attribution */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div>
                      <span>Source: <strong>{source?.title || 'Unknown Source'}</strong></span>
                      <span className="mx-2">·</span>
                      <span>Publisher: {source?.publisher}</span>
                    </div>

                    {source?.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>Verify at Origin</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
