/**
 * DARKSPOT — Resolve Contradiction Finding Modal
 * Enables investigators to document formal reconciliation of cross-source disagreements.
 */

import React, { useState } from 'react';
import { ContradictionFinding } from '../types/intelligence.ts';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ResolveConflictModalProps {
  conflict: ContradictionFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, resolutionNotes: string) => Promise<void>;
  isLoading: boolean;
}

export const ResolveConflictModal: React.FC<ResolveConflictModalProps> = ({
  conflict,
  isOpen,
  onClose,
  onResolve,
  isLoading,
}) => {
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedClaimSource, setSelectedClaimSource] = useState<'claimA' | 'claimB' | 'external'>('claimB');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !conflict) return null;

  const isValid = notes.trim().length >= 20 || sourceUrl.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setValidationError('Resolution requires a substantive explanation (minimum 20 characters) or a verified source URL.');
      return;
    }

    const fullResolution = `[Authority: ${
      selectedClaimSource === 'claimA'
        ? conflict.claimA.sourceTitle
        : selectedClaimSource === 'claimB'
        ? conflict.claimB.sourceTitle
        : 'External Authoritative Clarification'
    }] ${notes.trim()}${sourceUrl.trim() ? ` (Verification URL: ${sourceUrl.trim()})` : ''}`;

    await onResolve(conflict.id, fullResolution);
    setNotes('');
    setSourceUrl('');
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Document Contradiction Resolution
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded uppercase">
              {conflict.type.replace('_', ' ')}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              {conflict.requirementTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Select which claim governs this decision or provide external verification proof:
            </p>
          </div>

          {/* Claim Options */}
          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="preferredSource"
                checked={selectedClaimSource === 'claimB'}
                onChange={() => setSelectedClaimSource('claimB')}
                className="mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Adopt {conflict.claimB.sourceTitle} ({conflict.claimB.date || 'Newer'})
                </span>
                <span className="text-slate-600 italic">"{conflict.claimB.statement}"</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="preferredSource"
                checked={selectedClaimSource === 'claimA'}
                onChange={() => setSelectedClaimSource('claimA')}
                className="mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Adopt {conflict.claimA.sourceTitle} ({conflict.claimA.date || 'Prior'})
                </span>
                <span className="text-slate-600 italic">"{conflict.claimA.statement}"</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="preferredSource"
                checked={selectedClaimSource === 'external'}
                onChange={() => setSelectedClaimSource('external')}
                className="mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  External Independent Verification (Oral, Email, Legal Memo)
                </span>
                <span className="text-slate-500">
                  Document newly received confirmation from governing custodian.
                </span>
              </div>
            </label>
          </div>

          {/* Linked Verification URL */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Supporting Verification URL (Optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={e => {
                setSourceUrl(e.target.value);
                setValidationError(null);
              }}
              placeholder="https://official.domain.org/admissions/memo-march2026.pdf"
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Resolution Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Formal Resolution Documentation <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[11px] font-mono ${notes.trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {notes.trim().length}/20 chars min
              </span>
            </div>
            <textarea
              rows={3}
              required={!sourceUrl.trim()}
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. Email confirmation received from Program Director Dr. Aris (March 2, 2026) stating the portal validation will strictly follow the 2026 policy announcement."
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {validationError && (
              <p className="text-xs text-rose-600 mt-1">
                {validationError}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoading ? 'Updating...' : 'Save Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
