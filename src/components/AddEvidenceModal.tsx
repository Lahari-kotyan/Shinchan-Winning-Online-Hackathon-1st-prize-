/**
 * DARKSPOT — Ingest Supplemental Evidence Modal
 * Allows adding new URLs or text documents directly into the active investigation.
 * Triggers real-time incremental claim extraction and completeness re-calculation.
 */

import React, { useState } from 'react';
import { X, Globe, FileText, Loader2, Plus, Sparkles } from 'lucide-react';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (payload: { url?: string; title?: string; content?: string; publisher?: string }) => Promise<void>;
  isLoading: boolean;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  onClose,
  onAddSource,
  isLoading,
}) => {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'text' && !content.trim()) return;

    if (mode === 'url') {
      await onAddSource({ url: url.trim() });
    } else {
      await onAddSource({
        title: title.trim() || 'Uploaded Evidence Document',
        publisher: publisher.trim() || 'User Upload',
        content: content.trim(),
      });
    }

    setUrl('');
    setTitle('');
    setPublisher('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Ingest Supplemental Evidence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              DARKSPOT will extract new claims and re-evaluate active conflicts.
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-7 h-7 text-slate-900 animate-spin" />
            <p className="text-xs font-semibold text-slate-900">
              Extracting claims and re-evaluating completeness...
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Verifying new evidence against existing decision requirements.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Mode Switcher */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 ${
                  mode === 'url'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web URL / Reference</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 ${
                  mode === 'text'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text / Document</span>
              </button>
            </div>

            {mode === 'url' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Source URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/updated-policy-handbook"
                  className="w-full text-xs text-slate-900 border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-500 block">
                  DARKSPOT will fetch the live page, filter HTML, and extract traceable claims.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Official 2026 Addendum"
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Publisher / Origin
                    </label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={e => setPublisher(e.target.value)}
                      placeholder="e.g. Dean of Admissions"
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Document Excerpt / Text Content <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Paste relevant policy text, email confirmation, or contractual terms..."
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
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
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Ingest & Re-evaluate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
