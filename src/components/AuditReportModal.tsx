/**
 * DARKSPOT — Executive Decision Completeness Audit Dossier
 * Comprehensive exportable report for investment committees, academic boards, and executives.
 */

import React, { useState } from 'react';
import { Investigation } from '../types/intelligence.ts';
import { X, Printer, Copy, Check, ShieldCheck, AlertCircle, FileText } from 'lucide-react';

interface AuditReportModalProps {
  investigation: Investigation;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  investigation,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const reportText = `DARKSPOT DECISION COMPLETENESS AUDIT DOSSIER
======================================================
Decision Question: ${investigation.decisionQuestion}
Date of Analysis: ${new Date(investigation.updatedAt).toLocaleDateString()}
Readiness Verdict: ${investigation.readiness.status}
Completeness Score: ${investigation.readiness.completenessScore}% / 100%

EXECUTIVE SUMMARY
-----------------
${investigation.readiness.summary}

VERIFIED PRE-CONDITIONS
-----------------------
${investigation.readiness.preConditions.map((p, i) => `${i + 1}. ${p}`).join('\n')}

UNRESOLVED RISKS & DISCREPANCIES
--------------------------------
${investigation.readiness.unresolvedRisks.map((r, i) => `[!] ${r}`).join('\n')}

REQUIREMENTS BREAKDOWN
----------------------
${investigation.requirements.map(r => `* [${r.priority}] ${r.title} — Status: ${r.status}\n  Reason: ${r.statusReason}`).join('\n')}

VERIFICATION ACTIONS
--------------------
${investigation.verificationPlan.map(a => `[${a.completed ? 'X' : ' '}] ${a.priority}: ${a.whatNeedsVerification} (Consult: ${a.suggestedAuthority})`).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">
              Executive Decision Completeness Dossier
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 font-sans print:p-0">
          {/* Cover Strip */}
          <div className="border-b-2 border-slate-950 pb-6">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span>DARKSPOT EPSTEMIC AUDIT REF #{investigation.id.toUpperCase()}</span>
              <span>GENERATED: {new Date(investigation.updatedAt).toUTCString()}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {investigation.decisionQuestion}
            </h1>
            {investigation.context && (
              <p className="text-xs text-slate-600 mt-2 italic">
                Context: {investigation.context}
              </p>
            )}
          </div>

          {/* Verdict Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Decision Readiness Verdict
              </span>
              <div className="text-xl font-black text-slate-900">
                {investigation.readiness.status.replace(/_/g, ' ')}
              </div>
              <span className="text-xs text-slate-500">
                Objective classification based on evidence weight
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Evidence Completeness
              </span>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
                {investigation.readiness.completenessScore}% / 100%
              </div>
              <span className="text-xs text-slate-500">
                Defensible mathematical requirement points
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Corroborated / Unresolved
              </span>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">
                {investigation.requirements.filter(r => r.status === 'SUPPORTED').length} / {investigation.requirements.length}
              </div>
              <span className="text-xs text-slate-500">
                {investigation.contradictions.filter(c => !c.resolved).length} active contradictions
              </span>
            </div>
          </div>

          {/* Executive Synthesis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Executive Readiness Synthesis
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-200">
              {investigation.readiness.summary}
            </p>
          </div>

          {/* Pre-Conditions Checklist */}
          {investigation.readiness.preConditions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Mandatory Pre-Conditions Before Signing / Committing
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                {investigation.readiness.preConditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-900 shrink-0 font-mono">[{i + 1}]</span>
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forensic Requirements Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Forensic Requirements Breakdown
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded divide-y divide-slate-100">
              <thead className="bg-slate-50 font-mono text-[10px] uppercase text-slate-600">
                <tr>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Requirement</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Evidence Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investigation.requirements.map(req => (
                  <tr key={req.id}>
                    <td className="p-2.5 font-mono text-[10px] font-bold text-slate-700">
                      [{req.priority}]
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">
                      {req.title}
                    </td>
                    <td className="p-2.5 font-medium text-slate-700">
                      {req.status}
                    </td>
                    <td className="p-2.5 text-slate-600 text-[11px]">
                      {req.statusReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ingested Evidence Registry */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Ingested Sources & Provenance Registry ({investigation.sources.length})
            </h3>
            <div className="space-y-2 text-xs">
              {investigation.sources.map(src => (
                <div key={src.id} className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500 mb-1">
                    <span>{src.publisher} ({src.domain})</span>
                    <span>Date: {src.publicationDate || 'Undated'}</span>
                  </div>
                  <div className="font-semibold text-slate-900">{src.title}</div>
                  <div className="text-[11px] text-slate-600 mt-1 italic">
                    Snippet: "{src.extractedPassage.slice(0, 240)}..."
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signoff block for print view */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500 font-mono">
            <div>
              <p>Lead Decision Investigator:</p>
              <div className="h-10 border-b border-slate-300 mt-4" />
              <p className="mt-1">Date: ________________________</p>
            </div>
            <div>
              <p>Executive / Legal Sign-off:</p>
              <div className="h-10 border-b border-slate-300 mt-4" />
              <p className="mt-1">Status: ________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
