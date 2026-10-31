/**
 * DARKSPOT — Verification Plan: 1-Click Verification Email & Inquiry Drafter
 * Automatically composes citation-bearing inquiries to named governing authorities.
 */

import React, { useState, useEffect } from 'react';
import {
  VerificationAction,
  EvidenceSource,
  ContradictionFinding,
} from '../types/intelligence.ts';
import {
  X,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface DraftEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: VerificationAction | null;
  decisionQuestion: string;
  sources?: EvidenceSource[];
  conflicts?: ContradictionFinding[];
}

export const DraftEmailModal: React.FC<DraftEmailModalProps> = ({
  isOpen,
  onClose,
  action,
  decisionQuestion,
  sources = [],
  conflicts = [],
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'FORMAL' | 'CONCISE' | 'EXECUTIVE'>('FORMAL');

  // Derive associated conflict if any
  const associatedConflict = conflicts.find(
    c => action && c.requirementId === action.requirementId && !c.resolved
  );

  const generateDraftText = (currentTone: 'FORMAL' | 'CONCISE' | 'EXECUTIVE') => {
    if (!action) return;

    const authorityName = action.suggestedAuthority || 'Governing Office / Point of Contact';
    
    // Suggested email guessing based on authority
    let suggestedEmail = '';
    const authLower = authorityName.toLowerCase();
    if (authLower.includes('scholarship') || authLower.includes('financial')) {
      suggestedEmail = 'scholarships@office.edu';
    } else if (authLower.includes('legal') || authLower.includes('counsel')) {
      suggestedEmail = 'legal@partner.com';
    } else if (authLower.includes('admissions')) {
      suggestedEmail = 'admissions@university.org';
    } else if (authLower.includes('investor') || authLower.includes('lead')) {
      suggestedEmail = 'partners@fund.vc';
    } else {
      suggestedEmail = `inquiries@${authorityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'authority'}.org`;
    }
    setRecipient(suggestedEmail);

    const subj = `Information Verification & Policy Clarification: ${action.requirementTitle}`;
    setSubject(subj);

    // Build citation reference block
    let citationBlock = '';
    if (associatedConflict) {
      citationBlock = `\nDuring our multi-source verification review, we identified the following material discrepancy:\n  • Source 1 (${associatedConflict.claimA.sourceTitle}): "${associatedConflict.claimA.quote}"\n  • Source 2 (${associatedConflict.claimB.sourceTitle}): "${associatedConflict.claimB.quote}"\n`;
    }

    let text = '';
    if (currentTone === 'FORMAL') {
      text = `Dear ${authorityName},

I am currently conducting a structured decision verification review regarding the following matter:
"${decisionQuestion}"

In evaluating the necessary requirements for "${action.requirementTitle}", our analysis identified an outstanding information gap:
${action.whatNeedsVerification}
${citationBlock}
Why this information is critical:
${action.whyItMatters}

To ensure complete accuracy and eliminate conflicting assumptions, could you kindly provide written clarification or the official governing documentation addressing:
→ ${action.concreteEvidenceRequired}

Thank you very much for your time and guidance.

Sincerely,
Decision Verification Lead
DARKSPOT Platform Intelligence Review`;
    } else if (currentTone === 'CONCISE') {
      text = `Hi ${authorityName},

Quick verification question regarding: "${decisionQuestion}"

Regarding "${action.requirementTitle}", could you clarify:
- ${action.whatNeedsVerification}
${associatedConflict ? `- Conflicting published data: "${associatedConflict.claimA.quote}" vs "${associatedConflict.claimB.quote}"\n` : ''}
Required confirmation:
- ${action.concreteEvidenceRequired}

Appreciate your confirmation on this policy.

Best regards,`;
    } else {
      text = `Attention: ${authorityName}

RE: Decision Audit & Governance Clarification — ${action.requirementTitle}

We are finalizing due diligence on: "${decisionQuestion}".

Current decision readiness is blocked pending verification of:
1. Specific Gap: ${action.whatNeedsVerification}
2. Concrete Evidence Required: ${action.concreteEvidenceRequired}
${associatedConflict ? `3. Cross-Source Variance: ${associatedConflict.claimA.sourceTitle} states "${associatedConflict.claimA.quote}", whereas ${associatedConflict.claimB.sourceTitle} states "${associatedConflict.claimB.quote}".\n` : ''}
Please confirm the binding official determination at your earliest convenience so this matter can be formally resolved.

Regards,
Executive Decision Review`;
    }

    setBody(text);
  };

  useEffect(() => {
    if (isOpen && action) {
      generateDraftText(tone);
    }
  }, [isOpen, action, tone]);

  if (!isOpen || !action) return null;

  const handleCopy = () => {
    const fullMessage = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                1-Click Verification Inquiry
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-700">{action.requirementTitle}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Draft Inquiring Letter / Verification Email
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Selector & Context Alert */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
              Formality Tone:
            </span>
            <div className="inline-flex rounded-md shadow-2xs border border-slate-200 p-0.5 bg-slate-100">
              {(['FORMAL', 'CONCISE', 'EXECUTIVE'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    tone === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {associatedConflict && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <AlertCircle className="w-3 h-3" />
              Includes citation of active conflict
            </span>
          )}
        </div>

        {/* Editor Form */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Recipient */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase font-bold text-slate-600">
              Recipient Email (Suggested Authority: {action.suggestedAuthority})
            </label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="authority@organization.org"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase font-bold text-slate-600">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase font-bold text-slate-600 flex items-center justify-between">
              <span>Inquiry Letter Body</span>
              <span className="text-slate-400 font-normal">Fully editable before sending</span>
            </label>
            <textarea
              rows={12}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-md p-3 leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-md shadow-2xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Full Draft' : 'Copy Draft'}</span>
            </button>

            <button
              onClick={handleOpenMailto}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Email App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
