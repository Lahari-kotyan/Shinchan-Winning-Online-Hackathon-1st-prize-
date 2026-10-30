/**
 * DARKSPOT — Landing Hero & Product Vision
 * Establishes the category of Decision Completeness Intelligence and invites immediate action.
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
} from 'lucide-react';

interface LandingHeroProps {
  onStartCustom: (question: string) => void;
  onLaunchDemo: (scenarioId: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartCustom,
  onLaunchDemo,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuestion.trim()) {
      onStartCustom(inputQuestion.trim());
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Top Value Proposition Header */}
      <div className="max-w-4xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 font-mono tracking-wider uppercase bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200">
          <span>Shinchan Online Hackathon 2026</span>
          <span className="text-slate-400">·</span>
          <span>Decision Completeness Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] text-balance">
          Know what's missing <br />
          <span className="text-slate-500">before you decide.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Most research tools summarize what they find. DARKSPOT identifies what has{' '}
          <strong className="text-slate-900 font-semibold">not been found</strong>, what{' '}
          <strong className="text-rose-700 font-semibold">conflicts</strong>, what is{' '}
          <strong className="text-amber-700 font-semibold">outdated</strong>, and generates a prioritized verification plan before you commit.
        </p>

        {/* Prominent Decision Input Bar */}
        <form onSubmit={handleQuickSubmit} className="max-w-2xl mx-auto mt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white border-2 border-slate-900 rounded-lg shadow-sm">
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder="Enter your decision question (e.g. Should I accept this Series A term sheet?)..."
              className="flex-1 w-full text-sm text-slate-900 px-3 py-2 bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Investigate Decision</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Launch Pre-calibrated Demo Scenarios */}
        <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2">
          <span>Or test pre-calibrated demo scenarios:</span>
          <button
            onClick={() => onLaunchDemo('sample-fellowship-2026')}
            className="font-medium text-slate-900 underline hover:text-slate-700"
          >
            STEM Fellowship Conflict
          </button>
          <span>·</span>
          <button
            onClick={() => onLaunchDemo('sample-db-migration')}
            className="font-medium text-slate-900 underline hover:text-slate-700"
          >
            Cloudflare D1 Migration Risk
          </button>
          <span>·</span>
          <button
            onClick={() => onLaunchDemo('sample-series-a-terms')}
            className="font-medium text-slate-900 underline hover:text-slate-700"
          >
            Series A Term Sheet Conflict
          </button>
        </div>
      </div>

      {/* Comparison: Traditional AI vs DARKSPOT Decision Completeness */}
      <div className="max-w-5xl mx-auto border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Column 1: Traditional AI */}
          <div className="p-8 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              <span>Generic AI Research Tools</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Summarizes Available Content
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">✕</span>
                <span>Assumes whatever it found is the full universe of facts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">✕</span>
                <span>Smooths over conflicting dates and deadlines instead of highlighting them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">✕</span>
                <span>Fails to warn when critical statutory preconditions are missing entirely.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">✕</span>
                <span>Fabricates arbitrary 95% confidence scores without mathematical basis.</span>
              </li>
            </ul>
          </div>

          {/* Column 2: DARKSPOT */}
          <div className="p-8 bg-white space-y-4 border-t-2 md:border-t-0 md:border-l-2 border-slate-900">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              <span>DARKSPOT Platform</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Discovers Gaps & Verifies Completeness
            </h3>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Decomposes decisions into falsifiable requirements before reading sources.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">✓</span>
                <span>Flags direct contradictions (e.g. 15-day deadline gap, testing rule changes).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">✓</span>
                <span>Explicitly flags what was NOT found (reminding: absent ≠ non-existent).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-900 font-bold">✓</span>
                <span>Calculates transparent, defensible readiness and prioritized next steps.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6-Stage Intelligence Architecture */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            How DARKSPOT Evaluates Decision Completeness
          </h2>
          <p className="text-xs text-slate-500">
            A modular 6-stage epistemic engine grounded in empirical traceability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 01</div>
            <h4 className="text-sm font-bold text-slate-900">Decision Decomposition</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deconstructs ambiguous goals into necessary gatekeeping criteria, financial bounds, and contractual milestones.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 02</div>
            <h4 className="text-sm font-bold text-slate-900">Traceable Claim Extraction</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingests PDFs, URLs, and notes, extracting claims strictly tied to verbatim quotations with timestamped provenance.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 03</div>
            <h4 className="text-sm font-bold text-slate-900">Contradiction Detection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-examines statements across sources, detecting date discrepancies, numerical variances, and policy clashes.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 04</div>
            <h4 className="text-sm font-bold text-slate-900">Information Gap Classification</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rigorously categorizes into Supported, Partially Supported, Conflicting, Outdated, Insufficient, or Not Found.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 05</div>
            <h4 className="text-sm font-bold text-slate-900">Verification Action Planner</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assigns concrete authorities (registrars, legal counsel, engineers) and explicit proof standards to close gaps.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">STAGE 06</div>
            <h4 className="text-sm font-bold text-slate-900">Defensible Readiness Score</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates mathematically defensible evidence weights and issues an objective Not Ready / Caution / Ready verdict.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
