/**
 * DARKSPOT — Top Navigation Bar
 * Follows strict 3-zone contract:
 * [Wordmark brand] — [Single-line nav links] — [Primary action button & switcher]
 */

import React from 'react';
import { Plus, ShieldAlert, Sparkles, Database, FileText } from 'lucide-react';
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
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('landing')}
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
              <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                Decision Completeness
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Concise Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'evidence'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Evidence Explorer
          </button>
          <button
            onClick={() => onSelectTab('gaps')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'gaps'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Information Gaps
          </button>
          <button
            onClick={() => onSelectTab('planner')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'planner'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Verification Plan
          </button>
          <button
            onClick={() => onSelectTab('graph')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'graph'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Relationship Graph
          </button>
        </nav>

        {/* Zone 3: Investigation Selector & Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {investigations.length > 0 && (
            <select
              value={selectedInvestigationId || ''}
              onChange={e => {
                onSelectInvestigation(e.target.value);
                if (currentTab === 'landing') onSelectTab('overview');
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 max-w-[200px] truncate focus:outline-none focus:ring-1 focus:ring-slate-900"
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs whitespace-nowrap"
              title="View & Export Decision Completeness Dossier"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Dossier</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>
    </header>
  );
};
