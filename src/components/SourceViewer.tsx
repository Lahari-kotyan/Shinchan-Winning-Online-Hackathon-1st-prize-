/**
 * DARKSPOT — Interactive Provenance & Verbatim Source Viewer
 * Forensic drawer rendering complete source passages with verified quote highlight offsets.
 */

import React, { useEffect, useRef, useState } from 'react';
import { EvidenceSource, ExtractedClaim } from '../types/intelligence.ts';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

interface SourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  source: EvidenceSource | null;
  activeClaim?: ExtractedClaim | null;
  allClaims?: ExtractedClaim[];
  onSelectClaim?: (claim: ExtractedClaim) => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  isOpen,
  onClose,
  source,
  activeClaim,
  allClaims = [],
  onSelectClaim,
}) => {
  const [copied, setCopied] = useState(false);
  const markRef = useRef<HTMLElement | null>(null);

  // Auto-scroll to highlight on open or claim switch
  useEffect(() => {
    if (isOpen && markRef.current) {
      setTimeout(() => {
        markRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [isOpen, activeClaim]);

  if (!isOpen || !source) return null;

  const rawText = source.extractedPassage || '';
  const sourceClaims = allClaims.filter(c => c.sourceId === source.id);

  // Determine offsets
  let start = activeClaim?.startOffset ?? -1;
  let end = activeClaim?.endOffset ?? -1;

  // Fallback offset matching if quote exists in rawText but offset wasn't precomputed
  if ((start < 0 || end < 0) && activeClaim?.verbatimQuote) {
    const idx = rawText.indexOf(activeClaim.verbatimQuote);
    if (idx !== -1) {
      start = idx;
      end = idx + activeClaim.verbatimQuote.length;
    }
  }

  const isVerified = (start >= 0 && end > start) || activeClaim?.verificationStatus === 'VERIFIED_IN_SOURCE';

  const handleCopyCitation = () => {
    if (!source) return;
    const quoteText = activeClaim ? `"${activeClaim.verbatimQuote}"` : '';
    const citation = `${quoteText} — Source: ${source.title} (${source.publisher}, ${source.publicationDate || 'n.d.'}). ${source.url || ''} [Retrieved: ${source.retrievalDate}]`;
    navigator.clipboard.writeText(citation.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {source.sourceType.replace('_', ' ')}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-600">{source.publisher}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono text-slate-500">{source.publicationDate || 'Undated'}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {source.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Metadata Banner */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Authority</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{source.authorityScore}/100</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Freshness</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{source.freshnessScore}/100</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Domain</span>
            <span className="font-mono text-slate-800 truncate block text-xs">{source.domain}</span>
          </div>
          <div className="flex items-center justify-end">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
              >
                <span>Live URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic font-mono">Uploaded PDF</span>
            )}
          </div>
        </div>

        {/* Active Claim Provenance Header */}
        {activeClaim && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Active Extracted Claim
              </span>

              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  VERIFIED VERBATIM [{start}..{end}]
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  UNVERIFIED QUOTE
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-slate-900">
              {activeClaim.claimText}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <span className="text-slate-500 italic truncate">
                "{activeClaim.verbatimQuote}"
              </span>
              <button
                onClick={handleCopyCitation}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded transition-colors shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied Citation' : 'Copy Citation'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Claims In This Source Selector */}
        {sourceClaims.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-mono text-slate-600 uppercase font-semibold shrink-0">
              All claims ({sourceClaims.length}):
            </span>
            {sourceClaims.map(c => {
              const isActive = activeClaim?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectClaim && onSelectClaim(c)}
                  className={`text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {c.id}
                </button>
              );
            })}
          </div>
        )}

        {/* Full Verbatim Text Passage */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-2">
              Full Verbatim Document Text ({rawText.length.toLocaleString()} characters)
            </span>

            {rawText ? (
              <div className="bg-slate-950 text-slate-100 p-5 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap selection:bg-amber-400 selection:text-slate-950">
                {start >= 0 && end > start ? (
                  <>
                    <span>{rawText.slice(0, start)}</span>
                    <mark
                      ref={markRef}
                      className="bg-amber-400 text-slate-950 px-1 py-0.5 rounded font-bold ring-2 ring-amber-300 animate-pulse"
                      title={`Verified Quote: Offset ${start} to ${end}`}
                    >
                      {rawText.slice(start, end)}
                    </mark>
                    <span>{rawText.slice(end)}</span>
                  </>
                ) : (
                  <span>{rawText}</span>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                No raw passage text was captured for this source.
              </div>
            )}
          </div>

          {source.reliabilityNotes && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-800 font-medium">Reliability Assessment:</strong>
              <p>{source.reliabilityNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Source ID: {source.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Provenance Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
