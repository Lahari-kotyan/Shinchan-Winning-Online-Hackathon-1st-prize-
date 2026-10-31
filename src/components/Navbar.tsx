/**
 * DARKSPOT — Top Navigation Bar
 * Follows strict 3-zone contract with live AI health indicator and responsive mobile drawer:
 * [Wordmark brand & Engine Badge] — [Single-line nav links] — [Investigation Switcher & Actions]
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  ShieldAlert,
  Sparkles,
  Database,
  FileText,
  Menu,
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Investigation } from '../types/intelligence.ts';

export type ActiveTab = 'landing' | 'overview' | 'evidence' | 'gaps' | 'planner' | 'graph';

interface NavbarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  investigations: Investigation[];
  selectedInvestigationId: string | null;
  onSelectInvestigation: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenAuditModal?: () => void;
  onResetSamples: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  investigations,
  selectedInvestigationId,
  onSelectInvestigation,
  onOpenNewModal,
  onOpenAuditModal,
  onResetSamples,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState<{
    loaded: boolean;
    geminiLive: boolean;
    engine: string;
    model: string;
  }>({
    loaded: false,
    geminiLive: false,
    engine: 'heuristic',
    model: 'gemini-3.8-flash',
  });

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiHealth({
          loaded: true,
          geminiLive: Boolean(data.geminiLive),
          engine: data.engine || 'heuristic',
          model: data.model || 'gemini-3.8-flash',
        });
      })
      .catch(() => {
        setAiHealth({
          loaded: true,
          geminiLive: false,
          engine: 'heuristic',
          model: 'gemini-3.8-flash',
        });
      });
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title & Honest AI Engine Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onSelectTab('landing');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to DARKSPOT Platform Overview"
          >
            <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
              DS
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                DARKSPOT
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                Decision Completeness
              </span>
            </div>
          </button>

          {/* Engine Honest Status Badge */}
          {aiHealth.loaded && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                aiHealth.geminiLive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                aiHealth.geminiLive
                  ? 'Live Gemini 3.8 active for real-time document reasoning and decomposition.'
                  : 'Operating in deterministic heuristic mode (Offline demo fallback).'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aiHealth.geminiLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{aiHealth.geminiLive ? 'Live Gemini 3.8' : 'OFFLINE DEMO MODE'}</span>
            </div>
          )}
        </div>

        {/* Zone 2: Concise Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('landing')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'landing'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Platform
          </button>
          <button
            onClick={() => onSelectTab('overview')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => onSelectTab('evidence')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'evidence'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Evidence Explorer
          </button>
          <button
            onClick={() => onSelectTab('gaps')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'gaps'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Information Gaps
          </button>
          <button
            onClick={() => onSelectTab('planner')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'planner'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Verification Plan
          </button>
          <button
            onClick={() => onSelectTab('graph')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'graph'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Relationship Graph
          </button>
        </nav>

        {/* Zone 3: Investigation Selector & Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {investigations.length > 0 && (
            <select
              value={selectedInvestigationId || ''}
              onChange={e => {
                onSelectInvestigation(e.target.value);
                if (currentTab === 'landing') onSelectTab('overview');
              }}
              className="hidden sm:block text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 max-w-[180px] truncate focus:outline-none focus:ring-1 focus:ring-slate-900"
              title="Select active investigation"
            >
              {investigations.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.isSample ? '⚡ ' : inv.status === 'DRAFT' ? '📝 [Draft] ' : ''}{inv.decisionQuestion}
                </option>
              ))}
            </select>
          )}

          {onOpenAuditModal && selectedInvestigationId && (
            <button
              onClick={onOpenAuditModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              title="View & Export Decision Completeness Dossier"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Dossier</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {investigations.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Active Investigation:
              </label>
              <select
                value={selectedInvestigationId || ''}
                onChange={e => {
                  onSelectInvestigation(e.target.value);
                  if (currentTab === 'landing') onSelectTab('overview');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2 focus:outline-none"
              >
                {investigations.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.isSample ? '⚡ ' : ''}{inv.decisionQuestion}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col space-y-1 pt-1 border-t border-slate-100">
            {(
              [
                ['landing', 'Platform Overview'],
                ['overview', 'Workspace Command Center'],
                ['evidence', 'Evidence Explorer'],
                ['gaps', 'Information Gaps'],
                ['planner', 'Verification Plan'],
                ['graph', 'Relationship Graph'],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                onClick={() => {
                  onSelectTab(tabKey);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                  currentTab === tabKey
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {onOpenAuditModal && selectedInvestigationId && (
            <button
              onClick={() => {
                onOpenAuditModal();
                setMobileMenuOpen(false);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-md"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Open Executive Audit Dossier</span>
            </button>
          )}

          {/* AI Status in Mobile Drawer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Engine Backend:</span>
            <span className={`font-bold ${aiHealth.geminiLive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {aiHealth.geminiLive ? 'Gemini 3.8 Flash' : 'Offline Deterministic Heuristic'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
