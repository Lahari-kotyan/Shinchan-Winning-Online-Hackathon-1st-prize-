/**
 * DARKSPOT — New Investigation Launcher & Workspace Builder
 * Allows configuring decision scope, collecting multi-source evidence (URLs, PDFs, pasted text),
 * reviewing before execution, saving as draft, or launching live AI pipelines.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NewInvestigationPayload, InvestigationDocumentInput } from '../types/intelligence.ts';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Shield,
  Layers,
  Save,
} from 'lucide-react';
import { Button, Input, Textarea, Badge } from './ui/index.ts';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewInvestigationPayload) => Promise<void>;
  onLoadPrebuiltSample: (sampleId: string) => void;
  isLoading: boolean;
  currentProgressStage?: string;
  initialQuestion?: string;
}

type WizardStep = 'scope' | 'sources' | 'review';

interface UploadedPdfItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileBase64: string;
  title: string;
  extractedText: string;
}

interface PastedDocItem {
  id: string;
  title: string;
  publisher: string;
  content: string;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onLoadPrebuiltSample,
  isLoading,
  currentProgressStage,
  initialQuestion = '',
}) => {
  // Wizard state
  const [activeTab, setActiveTab] = useState<'wizard' | 'templates'>('wizard');
  const [currentStep, setCurrentStep] = useState<WizardStep>('scope');

  // Step 1: Scope
  const [question, setQuestion] = useState(initialQuestion);
  const [context, setContext] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Step 2: Sources
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdfItem[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pastedDocs, setPastedDocs] = useState<PastedDocItem[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docPublisher, setDocPublisher] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docError, setDocError] = useState<string | null>(null);

  const [rawNotes, setRawNotes] = useState('');
  const [sourceSubTab, setSourceSubTab] = useState<'urls' | 'pdfs' | 'text'>('urls');

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  if (!isOpen) return null;

  // --- Step 1 Validation & Navigation ---
  const handleProceedToSources = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      setQuestionError('A decision question is required to formulate requirements.');
      return;
    }
    if (question.trim().length < 5) {
      setQuestionError('Please formulate a specific decision question (min 5 characters).');
      return;
    }
    setQuestionError(null);
    setCurrentStep('sources');
  };

  // --- Step 2 Source Handlers ---
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setUrlError('URL must start with http:// or https://');
        return;
      }
      if (sourceUrls.includes(trimmed)) {
        setUrlError('This URL has already been added to the corpus.');
        return;
      }
      setSourceUrls([...sourceUrls, trimmed]);
      setUrlInput('');
      setUrlError(null);
    } catch {
      setUrlError('Please enter a valid, well-formed web URL.');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setSourceUrls(sourceUrls.filter((_, i) => i !== index));
  };

  // PDF Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setPdfError(null);

    // Validation: Type check
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setPdfError(`Invalid file format. Only PDF documents are supported (received "${file.name}").`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validation: Size check (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPdfError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read file via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;

      // Extract basic ASCII text snippets for quick preview
      const previewText = `PDF Document "${file.name}" (${Math.round(file.size / 1024)} KB) uploaded for primary source verification.`;

      const newPdf: UploadedPdfItem = {
        id: `pdf-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileBase64: base64Data,
        title: file.name.replace(/\.pdf$/i, ''),
        extractedText: previewText,
      };

      setUploadedPdfs(prev => [...prev, newPdf]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setPdfError('Failed to read the selected PDF file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePdf = (id: string) => {
    setUploadedPdfs(uploadedPdfs.filter(p => p.id !== id));
  };

  // Pasted Text Handler
  const handleAddPastedDoc = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!docContent.trim()) {
      setDocError('Please paste the relevant text excerpt.');
      return;
    }
    const newDoc: PastedDocItem = {
      id: `pasted-${Date.now()}`,
      title: docTitle.trim() || `Document Excerpt ${pastedDocs.length + 1}`,
      publisher: docPublisher.trim() || 'Internal Source',
      content: docContent.trim(),
    };
    setPastedDocs([...pastedDocs, newDoc]);
    setDocTitle('');
    setDocPublisher('');
    setDocContent('');
    setDocError(null);
  };

  const handleRemovePastedDoc = (id: string) => {
    setPastedDocs(pastedDocs.filter(d => d.id !== id));
  };

  // --- Step 3 Submission & Draft Saving ---
  const buildPayload = (saveAsDraft: boolean): NewInvestigationPayload => {
    const documents: InvestigationDocumentInput[] = [
      ...uploadedPdfs.map(pdf => ({
        title: pdf.title,
        content: pdf.extractedText,
        publisher: 'Uploaded PDF Document',
        fileName: pdf.fileName,
        fileSize: pdf.fileSize,
        mimeType: 'application/pdf',
        fileBase64: pdf.fileBase64,
      })),
      ...pastedDocs.map(doc => ({
        title: doc.title,
        content: doc.content,
        publisher: doc.publisher,
      })),
    ];

    return {
      decisionQuestion: question.trim(),
      context: context.trim(),
      sourceUrls,
      documents,
      rawNotes: rawNotes.trim(),
      saveAsDraft,
    };
  };

  const handleInitiatePipeline = async () => {
    const payload = buildPayload(false);
    await onSubmit(payload);
  };

  const handleSaveDraft = async () => {
    const payload = buildPayload(true);
    await onSubmit(payload);
  };

  const totalSourcesCount = sourceUrls.length + uploadedPdfs.length + pastedDocs.length + (rawNotes.trim() ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                New Decision Investigation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulate decision scope, collect evidentiary sources, and review before execution.
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading Overlay with Real Pipeline Stage Updates */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-5">
            <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Executing Decision Completeness Engine
              </h3>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-700 max-w-lg mx-auto">
                {currentProgressStage || 'Deconstructing requirements and evaluating cross-source evidence...'}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-md">
              Extracting claims, cross-examining citations, and calculating defensible completeness score...
            </p>
          </div>
        ) : (
          <div>
            {/* Top Tab Mode Switcher: Custom vs Demo */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('wizard')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'wizard'
                    ? 'border-slate-900 text-slate-900 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50'
                }`}
              >
                Configure Custom Investigation
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'border-slate-900 text-slate-900 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 bg-slate-50/50'
                }`}
              >
                ⚡ Pre-Calibrated Demo Scenarios
              </button>
            </div>

            {activeTab === 'templates' ? (
              /* TAB: Pre-calibrated Demo Scenarios */
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 mb-2">
                  Launch one of three pre-calibrated research scenarios with grounded contradictions, outdated dates, and missing statutory criteria:
                </p>

                <div
                  onClick={() => {
                    onLoadPrebuiltSample('sample-fellowship-2026');
                    onClose();
                  }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-400 cursor-pointer transition-all bg-slate-50/40 hover:bg-slate-50 group"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      2 ACTIVE CONFLICTS · 1 MISSING CAP
                    </span>
                    <span className="text-slate-400 group-hover:text-slate-900 font-medium">Launch Demo ↗</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    "Should I apply for the Global Excellence STEM Fellowship?"
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Direct contradiction between 2025 Handbook and 2026 Announcement (GRE requirement & 15-day deadline discrepancy) and an undefined household income cap.
                  </p>
                </div>

                <div
                  onClick={() => {
                    onLoadPrebuiltSample('sample-db-migration');
                    onClose();
                  }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-400 cursor-pointer transition-all bg-slate-50/40 hover:bg-slate-50 group"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      MISSING PITR SLA · FOREIGN KEY CAVEAT
                    </span>
                    <span className="text-slate-400 group-hover:text-slate-900 font-medium">Launch Demo ↗</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    "Should our SaaS startup migrate from AWS RDS to Cloudflare D1?"
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Enterprise disaster recovery PITR SLA missing from official documentation and unconstrained foreign key cascading defaults.
                  </p>
                </div>

                <div
                  onClick={() => {
                    onLoadPrebuiltSample('sample-series-a-terms');
                    onClose();
                  }}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-400 cursor-pointer transition-all bg-slate-50/40 hover:bg-slate-50 group"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      PARTICIPATING PREFERRED · OPTION POOL DILUTION
                    </span>
                    <span className="text-slate-400 group-hover:text-slate-900 font-medium">Launch Demo ↗</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    "Should our founding team sign the Series A Term Sheet from Horizon Ventures?"
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Discrepancy between 1x Non-Participating vs 2x Participating uncapped preferred liquidation and unmodeled pre-money option pool expansion.
                  </p>
                </div>
              </div>
            ) : (
              /* TAB: Custom Investigation 3-Step Wizard */
              <div>
                {/* Wizard Step Progress Tracker */}
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setCurrentStep('scope')}
                      className={`flex items-center gap-2 cursor-pointer ${
                        currentStep === 'scope'
                          ? 'font-bold text-slate-900'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        currentStep === 'scope' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200 text-slate-700'
                      }`}>
                        1
                      </span>
                      <span>Decision Scope</span>
                    </button>

                    <button
                      onClick={() => {
                        if (question.trim().length >= 5) setCurrentStep('sources');
                      }}
                      disabled={question.trim().length < 5}
                      className={`flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                        currentStep === 'sources'
                          ? 'font-bold text-slate-900'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        currentStep === 'sources' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200 text-slate-700'
                      }`}>
                        2
                      </span>
                      <span>Source Ingestion</span>
                      {totalSourcesCount > 0 && (
                        <span className="text-[10px] bg-slate-900 text-white font-mono px-1 rounded">
                          {totalSourcesCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (question.trim().length >= 5) setCurrentStep('review');
                      }}
                      disabled={question.trim().length < 5}
                      className={`flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                        currentStep === 'review'
                          ? 'font-bold text-slate-900'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        currentStep === 'review' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200 text-slate-700'
                      }`}>
                        3
                      </span>
                      <span>Review & Launch</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    Step {currentStep === 'scope' ? '1' : currentStep === 'sources' ? '2' : '3'} of 3
                  </span>
                </div>

                {/* STEP 1: DECISION SCOPE */}
                {currentStep === 'scope' && (
                  <form onSubmit={handleProceedToSources} className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                        Decision Question <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={question}
                        onChange={e => {
                          setQuestion(e.target.value);
                          if (questionError) setQuestionError(null);
                        }}
                        placeholder="e.g. Should I accept this Series A term sheet? or Should we migrate our database to Cloudflare D1?"
                        className={`w-full text-sm text-slate-900 border rounded-md p-3 focus:outline-none focus:ring-1 ${
                          questionError
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-slate-300 focus:ring-slate-900'
                        }`}
                      />
                      {questionError ? (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{questionError}</span>
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Formulate as a clear decision dilemma. DARKSPOT will deconstruct this into critical evidentiary prerequisites.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                        Operational Context & Constraints (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="e.g. We have 6 months of runway; our team is 4 engineers; critical deadline is end of month; primary concern is regulatory liability."
                        className="w-full text-xs text-slate-900 border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Provide constraints such as budget, timeline, team capacity, or non-negotiable clauses.
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Continue to Source Ingestion</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: SOURCE COLLECTION */}
                {currentStep === 'sources' && (
                  <div className="p-6 space-y-5">
                    {/* Source Subtabs */}
                    <div className="flex border-b border-slate-200 gap-4 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setSourceSubTab('urls')}
                        className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                          sourceSubTab === 'urls'
                            ? 'border-slate-900 text-slate-900 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Reference URLs ({sourceUrls.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceSubTab('pdfs')}
                        className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                          sourceSubTab === 'pdfs'
                            ? 'border-slate-900 text-slate-900 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upload PDF Documents ({uploadedPdfs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceSubTab('text')}
                        className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                          sourceSubTab === 'text'
                            ? 'border-slate-900 text-slate-900 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Pasted Excerpts & Notes ({pastedDocs.length + (rawNotes.trim() ? 1 : 0)})
                      </button>
                    </div>

                    {/* SUBTAB 1: URLs */}
                    {sourceSubTab === 'urls' && (
                      <div className="space-y-4">
                        <form onSubmit={handleAddUrl} className="flex gap-2">
                          <div className="relative flex-1">
                            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="url"
                              value={urlInput}
                              onChange={e => {
                                setUrlInput(e.target.value);
                                if (urlError) setUrlError(null);
                              }}
                              placeholder="https://official-guidelines.org/terms-2026.html"
                              className="w-full text-xs text-slate-900 pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shrink-0 cursor-pointer"
                          >
                            + Add URL
                          </button>
                        </form>

                        {urlError && (
                          <p className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{urlError}</span>
                          </p>
                        )}

                        {sourceUrls.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {sourceUrls.map((url, i) => {
                              let domain = url;
                              try {
                                domain = new URL(url).hostname;
                              } catch {
                                // keep raw
                              }
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1 rounded shrink-0">
                                      {domain}
                                    </span>
                                    <span className="truncate text-slate-700 text-[11px]">{url}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUrl(i)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded"
                                    title="Remove URL"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400">
                            No web URLs added yet. Add official policy pages, terms, or press releases.
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 2: PDF Upload */}
                    {sourceSubTab === 'pdfs' && (
                      <div className="space-y-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-lg p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
                        >
                          <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-800">
                            Click to upload PDF document
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Standard PDF documents up to 10MB (handbooks, bylaws, term sheets, agreements).
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>

                        {pdfError && (
                          <p className="text-xs text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{pdfError}</span>
                          </p>
                        )}

                        {uploadedPdfs.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {uploadedPdfs.map(pdf => (
                              <div
                                key={pdf.id}
                                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">
                                      {pdf.fileName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {(pdf.fileSize / 1024).toFixed(1)} KB · Application/PDF
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePdf(pdf.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded"
                                  title="Remove PDF"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400">
                            No PDF documents uploaded yet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 3: Pasted Text Excerpts & Notes */}
                    {sourceSubTab === 'text' && (
                      <div className="space-y-4">
                        <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50 space-y-2.5">
                          <span className="text-xs font-bold text-slate-900 block">
                            Add Document Text Excerpt
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={docTitle}
                              onChange={e => setDocTitle(e.target.value)}
                              placeholder="Title (e.g. Clause 4.2 Non-Compete Excerpt)"
                              className="text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                            />
                            <input
                              type="text"
                              value={docPublisher}
                              onChange={e => setDocPublisher(e.target.value)}
                              placeholder="Publisher / Origin (e.g. Legal Counsel Draft)"
                              className="text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={docContent}
                            onChange={e => {
                              setDocContent(e.target.value);
                              if (docError) setDocError(null);
                            }}
                            placeholder="Paste text excerpt from contract, email, offer letter, or meeting minutes..."
                            className="w-full text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-[11px] bg-white"
                          />
                          {docError && (
                            <p className="text-xs text-rose-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{docError}</span>
                            </p>
                          )}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleAddPastedDoc}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
                            >
                              + Save Excerpt
                            </button>
                          </div>
                        </div>

                        {pastedDocs.length > 0 && (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {pastedDocs.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 truncate">
                                    {doc.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {doc.publisher} · {doc.content.length} characters
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePastedDoc(doc.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Additional Contextual Notes
                          </label>
                          <textarea
                            rows={2}
                            value={rawNotes}
                            onChange={e => setRawNotes(e.target.value)}
                            placeholder="Optional preliminary facts or assumptions you want cross-verified..."
                            className="w-full text-xs text-slate-900 border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2 Bottom Navigation */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('scope')}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Scope</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep('review')}
                          className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Review & Launch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & LAUNCH */}
                {currentStep === 'review' && (
                  <div className="p-6 space-y-5">
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                          Target Decision Dilemma
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {question}
                        </h3>
                        {context && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            "{context}"
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="text-xs text-slate-500 block font-medium">Reference URLs</span>
                          <span className="text-lg font-bold font-mono text-slate-900">{sourceUrls.length}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="text-xs text-slate-500 block font-medium">Uploaded PDFs</span>
                          <span className="text-lg font-bold font-mono text-slate-900">{uploadedPdfs.length}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="text-xs text-slate-500 block font-medium">Text Documents</span>
                          <span className="text-lg font-bold font-mono text-slate-900">
                            {pastedDocs.length + (rawNotes.trim() ? 1 : 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {totalSourcesCount === 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Notice: No external evidentiary sources have been provided. DARKSPOT will deconstruct the decision requirements and identify necessary information that remains completely <strong>NOT_FOUND</strong>.
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 space-y-1 bg-white p-3 border border-slate-200 rounded">
                      <span className="font-semibold text-slate-900 block">Execution Pipeline Scope:</span>
                      <p>1. Deconstruct decision question into mutually exclusive, collectively exhaustive requirements.</p>
                      <p>2. Ingest corpus, extract verifiable claims, and tag sources.</p>
                      <p>3. Detect direct contradictions and outdated temporal rules.</p>
                      <p>4. Calculate Decision Completeness Score and prioritized action steps.</p>
                    </div>

                    {/* Step 3 Action Buttons */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('sources')}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sources</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                          title="Save investigation as draft without running AI pipeline"
                        >
                          <Save className="w-3.5 h-3.5 text-slate-500" />
                          <span>Save as Draft</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleInitiatePipeline}
                          className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Initiate Deep Investigation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
