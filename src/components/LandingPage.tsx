/**
 * DARKSPOT — Landing Page
 * Phase 2: Complete, production-grade landing experience communicating product positioning,
 * the epistemic information-gap problem, an interactive decision preview, and real workspace navigation.
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  Clock,
  Sparkles,
  GitBranch,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  Server,
  Briefcase,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Button, Input, Badge } from './ui/index.ts';

interface LandingPageProps {
  onStartCustom: (question: string) => void;
  onLaunchDemo: (scenarioId: string) => void;
  onOpenWorkspace: () => void;
  hasActiveInvestigation: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCustom,
  onLaunchDemo,
  onOpenWorkspace,
  hasActiveInvestigation,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'traditional' | 'darkspot' | 'verification'>('darkspot');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuestion.trim()) {
      onStartCustom(inputQuestion.trim());
    }
  };

  return (
    <div className="space-y-24 py-6 max-w-6xl mx-auto">
      {/* SECTION 1: HERO & DECISION INPUT */}
      <section className="text-center space-y-6 pt-4">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 font-mono tracking-wider uppercase bg-slate-50 px-3.5 py-1.5 rounded border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
          <span>Shinchan Online Hackathon 2026</span>
          <span className="text-slate-300">·</span>
          <span>Decision Completeness Intelligence</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] text-balance max-w-4xl mx-auto">
          Know what's missing <br />
          <span className="text-slate-500 font-extrabold">before you decide.</span>
        </h1>

        {/* Value Proposition Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Most research tools summarize what they find. DARKSPOT identifies what has{' '}
          <strong className="text-slate-900 font-semibold">not been found</strong>, what{' '}
          <strong className="text-rose-700 font-semibold">conflicts</strong>, what is{' '}
          <strong className="text-amber-700 font-semibold">outdated</strong>, and generates a prioritized verification plan before you commit.
        </p>

        {/* Decision Input Bar */}
        <form onSubmit={handleQuickSubmit} className="max-w-2xl mx-auto mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white border-2 border-slate-900 rounded-lg shadow-sm">
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                placeholder="Enter your decision question (e.g. Should I apply for this scholarship?)..."
                className="w-full text-xs sm:text-sm text-slate-900 pl-9 pr-3 py-2 bg-transparent focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              size="md"
              variant="primary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              Start Investigation
            </Button>
          </div>
        </form>

        {/* Quick Launch Pre-calibrated Demo Scenarios */}
        <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2">
          <span className="font-medium text-slate-600">Quick-launch verified case studies:</span>
          <button
            onClick={() => onLaunchDemo('sample-fellowship-2026')}
            className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2 decoration-slate-300 hover:decoration-slate-900 transition-all"
          >
            STEM Fellowship
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onLaunchDemo('sample-db-migration')}
            className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2 decoration-slate-300 hover:decoration-slate-900 transition-all"
          >
            Cloudflare D1 Migration
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onLaunchDemo('sample-series-a-terms')}
            className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2 decoration-slate-300 hover:decoration-slate-900 transition-all"
          >
            Series A Term Sheet
          </button>

          {hasActiveInvestigation && (
            <>
              <span className="text-slate-300">|</span>
              <button
                onClick={onOpenWorkspace}
                className="font-bold text-slate-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Return to Active Workspace</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE DECISION INVESTIGATION PREVIEW */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Interactive Investigation Preview
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            See the Difference on a High-Stakes Decision
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Example Query: <em>"Should I apply for the Global Excellence STEM Fellowship?"</em>
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActivePreviewTab('traditional')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activePreviewTab === 'traditional'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              What Standard AI Summarizes
            </button>
            <button
              onClick={() => setActivePreviewTab('darkspot')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activePreviewTab === 'darkspot'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              What DARKSPOT Uncovers (Gaps & Conflicts)
            </button>
            <button
              onClick={() => setActivePreviewTab('verification')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activePreviewTab === 'verification'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Actionable Verification Plan
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
          {activePreviewTab === 'traditional' && (
            <div className="p-6 sm:p-8 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
                <span className="font-bold text-slate-700">CONVENTIONAL AI ASSISTANT OUTPUT</span>
                <span>STATUS: "CONFIDENT SUMMARY"</span>
              </div>
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 text-sm">
                  "Yes, you should apply! The Global Excellence STEM Fellowship is a prestigious award offering up to $65,000 annually."
                </p>
                <ul className="space-y-2 list-disc pl-5 text-slate-600">
                  <li>Eligibility: PhD students with strong academic track records.</li>
                  <li>Application Deadline: November 15.</li>
                  <li>Benefits: Comprehensive monthly stipend, faculty mentorship, and international research tenure.</li>
                </ul>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                  <strong>The Catastrophic Flaw:</strong> This conventional summary completely missed a 15-day deadline discrepancy in the 2025 handbook, failed to notice that the household income limit is unpublished, and assumed the GRE requirement was straightforward!
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === 'darkspot' && (
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-3">
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  DECISION NOT READY (48% Evidence Completeness)
                </span>
                <span className="text-slate-400">DARKSPOT EPISTEMIC ANALYSIS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Conflict 1 */}
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold text-rose-900">[CRITICAL CONFLICT]</span>
                    <span className="text-rose-700">DATE DISCREPANCY</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Application Cutoff Timestamp</h4>
                  <div className="space-y-1 text-slate-700">
                    <p>• <strong>2025 Handbook:</strong> October 31 at 17:00 UTC (hard automated cutoff).</p>
                    <p>• <strong>2026 Announcement:</strong> November 15 at 23:59 EST.</p>
                  </div>
                  <p className="text-[11px] text-rose-900 pt-1 border-t border-rose-200">
                    <strong>Risk:</strong> Submitting on Nov 1 risks irreversible portal rejection if the server cron job was not updated.
                  </p>
                </div>

                {/* Conflict 2 */}
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold text-rose-900">[CRITICAL CONFLICT]</span>
                    <span className="text-rose-700">DIRECT CONTRADICTION</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Testing Prerequisites (GRE)</h4>
                  <div className="space-y-1 text-slate-700">
                    <p>• <strong>2025 Handbook:</strong> GRE Quant &ge; 165 strictly mandatory.</p>
                    <p>• <strong>2026 Announcement:</strong> GRE requirement permanently eliminated.</p>
                  </div>
                  <p className="text-[11px] text-rose-900 pt-1 border-t border-rose-200">
                    <strong>Risk:</strong> If the online portal form still validates GRE scores, submission will fail on deadline night.
                  </p>
                </div>

                {/* Missing Requirement */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold text-slate-700">[MISSING IN SOURCES]</span>
                    <span className="text-slate-500">BLIND SPOT</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Household Income Ceiling Dollar Amount</h4>
                  <p className="text-slate-600">
                    FAQ mentions candidates "must not exceed statutory household income thresholds", but <em>no collected source specifies the actual dollar limit</em>.
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <em>"Not found in sources does not mean does not exist in reality."</em>
                  </p>
                </div>

                {/* Supported Item */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-bold text-emerald-800">[SUPPORTED]</span>
                    <span className="text-emerald-700">CORROBORATED</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Renewal Standards & TA Limits</h4>
                  <p className="text-slate-700">
                    Multi-year renewal mandates 3.7 GPA and annual thesis committee endorsement. Outside work capped at 10 hours/week.
                  </p>
                  <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                    Verified across official FAQ Section 4.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onLaunchDemo('sample-fellowship-2026')}
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  Explore Full Investigation in Workspace
                </Button>
              </div>
            </div>
          )}

          {activePreviewTab === 'verification' && (
            <div className="p-6 sm:p-8 space-y-4 text-xs">
              <div className="flex items-center justify-between font-mono border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900">PRIORITIZED VERIFICATION ACTION PLAN</span>
                <span className="text-slate-500">4 MANDATORY ACTIONS</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white border border-rose-200 rounded-md space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-rose-700 font-bold">[CRITICAL #1]</span>
                    <span>AUTHORITY: ADMISSIONS OPERATIONS</span>
                  </div>
                  <h5 className="font-bold text-slate-900">
                    Obtain binding confirmation of the definitive server portal cutoff timestamp
                  </h5>
                  <p className="text-slate-600">
                    Required proof: Official email from admissions@globalstem.org or live portal countdown timer screenshot.
                  </p>
                </div>

                <div className="p-3 bg-white border border-rose-200 rounded-md space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-rose-700 font-bold">[CRITICAL #2]</span>
                    <span>AUTHORITY: TECHNICAL SUPPORT DESK</span>
                  </div>
                  <h5 className="font-bold text-slate-900">
                    Confirm whether the live submission portal bypasses GRE upload validation
                  </h5>
                  <p className="text-slate-600">
                    Required proof: Direct test login to online portal to verify GRE score field is marked optional.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-amber-700 font-bold">[HIGH #3]</span>
                    <span>AUTHORITY: OFFICE OF FINANCIAL AID</span>
                  </div>
                  <h5 className="font-bold text-slate-900">
                    Determine exact statutory numeric threshold for household income ceiling
                  </h5>
                  <p className="text-slate-600">
                    Required proof: Official policy memorandum detailing 2026 statutory financial limit schedule.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onLaunchDemo('sample-fellowship-2026')}
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  Open in Verification Planner
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: THE CORE PROBLEM & MATRIX */}
      <section className="space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            The Fundamental Flaw of Summarization
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Why Traditional AI Research Leads to Catastrophic Decisions
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            A summary only knows what is in the prompt. Real-world decisions fail because of what is missing.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left: Conventional AI */}
            <div className="p-8 bg-slate-50/50 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Traditional AI Assistants
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Passive Synthesis & Surface Extraction
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold text-sm leading-none">✕</span>
                  <span><strong>Assumes completeness:</strong> Treats retrieved excerpts as the full universe of governing facts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold text-sm leading-none">✕</span>
                  <span><strong>Smooths over contradictions:</strong> Averages conflicting numbers and glosses over deadline discrepancies.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold text-sm leading-none">✕</span>
                  <span><strong>Silent on omissions:</strong> Never alerts you if a dealbreaker regulatory condition is absent.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold text-sm leading-none">✕</span>
                  <span><strong>Fabricated confidence:</strong> Issues hallucinated 95% certainty without a defensible mathematical formula.</span>
                </li>
              </ul>
            </div>

            {/* Right: DARKSPOT */}
            <div className="p-8 bg-white space-y-5 border-t-2 md:border-t-0 md:border-l-2 border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  DARKSPOT Decision Intelligence
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Forensic Completeness & Gap Verification
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm leading-none">✓</span>
                  <span><strong>Deconstructs first:</strong> Identifies mandatory requirements <em>before</em> reading sources to establish what must exist.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold text-sm leading-none">✓</span>
                  <span><strong>Flags direct conflicts:</strong> Pits conflicting claims against each other side-by-side with risk impact analysis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-600 font-bold text-sm leading-none">✓</span>
                  <span><strong>Explicit gap detection:</strong> Reminds users that <em>not found in sources does not equal non-existent</em>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-900 font-bold text-sm leading-none">✓</span>
                  <span><strong>Defensible readiness:</strong> Calculates weighted requirement points and enforces mandatory pre-conditions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW DARKSPOT WORKS (6-STAGE PIPELINE) */}
      <section className="space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Technical Architecture
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            The 6-Stage Epistemic Intelligence Pipeline
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Every investigation executes through a modular, scientifically validated reasoning process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 01</span>
              <span>DECOMPOSE</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Decision Decomposition</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deconstructs ambiguous goals into necessary gatekeeping criteria, financial bounds, and contractual milestones.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 02</span>
              <span>EXTRACT</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Traceable Claim Extraction</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingests PDFs, URLs, and notes, extracting claims strictly tied to verbatim quotations with timestamped provenance.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 03</span>
              <span>CROSS-EXAMINE</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Contradiction Detection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-examines statements across sources, detecting date discrepancies, numerical variances, and policy clashes.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 04</span>
              <span>CLASSIFY</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Information Gap Classification</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rigorously categorizes into Supported, Partially Supported, Conflicting, Outdated, Insufficient, or Not Found.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 05</span>
              <span>ACTION PLAN</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Verification Action Planner</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assigns concrete authorities (registrars, legal counsel, engineers) and explicit proof standards to close gaps.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">STAGE 06</span>
              <span>SYNTHESIZE</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Defensible Readiness Score</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates mathematically defensible evidence weights and issues an objective Not Ready / Caution / Ready verdict.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: REAL-WORLD CASE STUDIES */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Pre-Calibrated Demonstrations
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Explore Realistic Multi-Source Investigation Scenarios
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Test how DARKSPOT handles high-stakes decisions with conflicting dates, missing SLAs, and toxic term sheet clauses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Scenario 1 */}
          <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col justify-between hover:border-slate-400 transition-all shadow-2xs group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  2 CONFLICTS · 1 MISSING CAP
                </span>
                <span className="text-slate-400">FELLOWSHIP</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700">
                Should I apply for the Global Excellence STEM Fellowship?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exposes direct contradiction between the official 2025 Handbook and 2026 Announcement (GRE testing waiver and 15-day deadline discrepancy).
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLaunchDemo('sample-fellowship-2026')}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Launch Live Demo
              </Button>
            </div>
          </div>

          {/* Scenario 2 */}
          <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col justify-between hover:border-slate-400 transition-all shadow-2xs group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  MISSING PITR SLA
                </span>
                <span className="text-slate-400">DATABASE</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700">
                Should our SaaS startup migrate from AWS RDS to Cloudflare D1?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identifies a critical enterprise blindspot: zero Point-in-Time Recovery SLA for databases &gt;10GB and unconstrained foreign key defaults.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLaunchDemo('sample-db-migration')}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Launch Live Demo
              </Button>
            </div>
          </div>

          {/* Scenario 3 */}
          <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col justify-between hover:border-slate-400 transition-all shadow-2xs group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  DOUBLE-DIP LIQUIDATION
                </span>
                <span className="text-slate-400">FINANCING</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700">
                Should we sign the Series A Term Sheet from Horizon Ventures?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Catches a severe discrepancy between the summary term sheet (1x Non-Participating) and legal Annex B (1x Participating without ceiling).
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLaunchDemo('sample-series-a-terms')}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Launch Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: CALL TO ACTION BANNER */}
      <section className="p-8 sm:p-12 border-2 border-slate-900 bg-slate-950 text-white rounded-xl text-center space-y-6 shadow-md">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to evaluate your decision?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Input your decision question, upload documents, or paste reference URLs. DARKSPOT will construct your decision completeness profile in seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={() => onStartCustom('')}
            className="bg-white text-slate-950 hover:bg-slate-100 border-white text-xs sm:text-sm font-bold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start New Investigation
          </Button>

          {hasActiveInvestigation && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onOpenWorkspace}
              className="bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm"
            >
              Open Active Workspace
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
