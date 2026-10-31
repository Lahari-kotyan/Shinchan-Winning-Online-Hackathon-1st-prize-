/**
 * DARKSPOT — Decision Completeness Intelligence Platform
 * Master Application Shell
 */

import React, { useState, useEffect } from 'react';
import {
  Investigation,
  DecisionRequirement,
  NewInvestigationPayload,
  ContradictionFinding,
  EvidenceSource,
  ExtractedClaim,
  VerificationAction,
} from './types/intelligence.ts';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { EvidenceView } from './components/EvidenceView.tsx';
import { GapsView } from './components/GapsView.tsx';
import { PlannerView } from './components/PlannerView.tsx';
import { EvidenceGraph } from './components/EvidenceGraph.tsx';
import { RequirementDrawer } from './components/RequirementDrawer.tsx';
import { SourceViewer } from './components/SourceViewer.tsx';
import { DraftEmailModal } from './components/DraftEmailModal.tsx';
import { NewInvestigationModal } from './components/NewInvestigationModal.tsx';
import { AddEvidenceModal } from './components/AddEvidenceModal.tsx';
import { ResolveConflictModal } from './components/ResolveConflictModal.tsx';
import { AuditReportModal } from './components/AuditReportModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(() => {
    return localStorage.getItem('darkspot_active_inv') || null;
  });
  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('darkspot_current_tab');
    if (saved && ['landing', 'overview', 'evidence', 'gaps', 'planner', 'graph'].includes(saved)) {
      return saved as ActiveTab;
    }
    return 'landing';
  });
  const [selectedRequirement, setSelectedRequirement] = useState<DecisionRequirement | null>(null);
  const [viewerSource, setViewerSource] = useState<EvidenceSource | null>(null);
  const [viewerClaim, setViewerClaim] = useState<ExtractedClaim | null>(null);
  const [actionToDraft, setActionToDraft] = useState<VerificationAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialQuestion, setModalInitialQuestion] = useState<string>('');
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [conflictToResolve, setConflictToResolve] = useState<ContradictionFinding | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [currentProgressStage, setCurrentProgressStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (activeInvestigationId) {
      localStorage.setItem('darkspot_active_inv', activeInvestigationId);
    }
  }, [activeInvestigationId]);

  useEffect(() => {
    localStorage.setItem('darkspot_current_tab', currentTab);
  }, [currentTab]);

  // Fetch all investigations on initial mount
  const fetchInvestigations = async (selectId?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/investigations');
      if (!res.ok) {
        throw new Error(`Failed to load investigations (${res.status})`);
      }
      const data: Investigation[] = await res.json();
      setInvestigations(data);

      const targetId = selectId || activeInvestigationId;
      if (targetId && data.some(d => d.id === targetId)) {
        setActiveInvestigationId(targetId);
      } else if (data.length > 0) {
        setActiveInvestigationId(data[0].id);
      }
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error fetching investigations:', err);
      setErrorMessage(`Could not connect to DARKSPOT backend: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const activeInvestigation = investigations.find(i => i.id === activeInvestigationId) || null;

  // Toggle action completion status
  const handleToggleAction = async (actionId: string) => {
    if (!activeInvestigation) return;

    try {
      const res = await fetch(
        `/api/investigations/${activeInvestigation.id}/actions/${actionId}/toggle`,
        { method: 'PATCH' }
      );
      if (!res.ok) throw new Error('Failed to update action');
      const updatedInv: Investigation = await res.json();

      setInvestigations(prev =>
        prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv))
      );
    } catch (err) {
      console.error('Error toggling action:', err);
    }
  };

  // Submit new investigation pipeline
  const handleStartInvestigation = async (payload: NewInvestigationPayload) => {
    try {
      setIsSubmitting(true);
      setCurrentProgressStage('Decomposing decision into necessary information requirements...');

      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      const completed: Investigation = await res.json();
      setInvestigations(prev => [completed, ...prev]);
      setActiveInvestigationId(completed.id);
      setCurrentTab('overview');
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Investigation Pipeline Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
      setCurrentProgressStage('');
    }
  };

  // Ingest supplemental evidence into active investigation
  const handleAddEvidence = async (payload: { url?: string; title?: string; content?: string; publisher?: string }) => {
    if (!activeInvestigation) return;

    try {
      setIsAddingEvidence(true);
      const res = await fetch(`/api/investigations/${activeInvestigation.id}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to ingest evidence');
      }

      const updatedInv: Investigation = await res.json();
      setInvestigations(prev =>
        prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv))
      );
      setIsAddEvidenceModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Ingestion Error: ${msg}`);
    } finally {
      setIsAddingEvidence(false);
    }
  };

  // Resolve contradiction finding
  const handleResolveConflict = async (conflictId: string, resolutionNotes: string) => {
    if (!activeInvestigation) return;

    try {
      setIsResolvingConflict(true);
      const res = await fetch(
        `/api/investigations/${activeInvestigation.id}/conflicts/${conflictId}/resolve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolutionNotes }),
        }
      );

      if (!res.ok) throw new Error('Failed to resolve contradiction');
      const updatedInv: Investigation = await res.json();

      setInvestigations(prev =>
        prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv))
      );
      setConflictToResolve(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Resolution Error: ${msg}`);
    } finally {
      setIsResolvingConflict(false);
    }
  };

  // Run pipeline on draft or failed investigation
  const handleRunInvestigation = async (id: string) => {
    try {
      setIsSubmitting(true);
      setCurrentProgressStage('Stage 1/6: Decomposing decision into necessary information requirements...');

      const res = await fetch(`/api/investigations/${id}/run`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to execute investigation pipeline');
      }

      const updatedInv: Investigation = await res.json();
      setInvestigations(prev =>
        prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Pipeline Execution Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
      setCurrentProgressStage('');
    }
  };

  // Delete an individual evidence source
  const handleDeleteSource = async (sourceId: string) => {
    if (!activeInvestigation) return;
    try {
      const res = await fetch(
        `/api/investigations/${activeInvestigation.id}/sources/${sourceId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove source');
      const updatedInv: Investigation = await res.json();
      setInvestigations(prev =>
        prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv))
      );
    } catch (err) {
      console.error('Error deleting source:', err);
    }
  };

  // Custom query entry from Landing or Navbar
  const handleStartCustom = (question?: string) => {
    setModalInitialQuestion(question || '');
    setIsModalOpen(true);
  };

  // Inspect verbatim provenance drawer
  const handleOpenProvenance = (source: EvidenceSource, claim?: ExtractedClaim) => {
    setViewerSource(source);
    setViewerClaim(claim || null);
  };

  // Direct claim provenance inspection across views
  const handleInspectClaimProvenance = (claimId: string, sourceId: string) => {
    if (!activeInvestigation) return;
    const source = activeInvestigation.sources.find(s => s.id === sourceId) || null;
    const claim = activeInvestigation.claims.find(c => c.id === claimId) || null;
    if (source) {
      setViewerSource(source);
      setViewerClaim(claim);
    }
  };

  // Open active investigation workspace
  const handleOpenWorkspace = () => {
    if (investigations.length > 0 && !activeInvestigationId) {
      setActiveInvestigationId(investigations[0].id);
    }
    setCurrentTab('overview');
  };

  // Launch a pre-calibrated sample scenario
  const handleLaunchSample = (sampleId: string) => {
    const found = investigations.find(i => i.id === sampleId);
    if (found) {
      setActiveInvestigationId(found.id);
      setCurrentTab('overview');
    }
  };

  // Restore defaults
  const handleResetSamples = async () => {
    try {
      await fetch('/api/investigations/reset-samples', { method: 'POST' });
      await fetchInvestigations();
    } catch (err) {
      console.error('Failed to reset samples:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        investigations={investigations}
        selectedInvestigationId={activeInvestigationId}
        onSelectInvestigation={id => {
          setActiveInvestigationId(id);
          setSelectedRequirement(null);
        }}
        onOpenNewModal={() => handleStartCustom('')}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onResetSamples={handleResetSamples}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading Initial State (only shown when not on landing page) */}
        {isLoading && currentTab !== 'landing' && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
            <p className="text-xs font-mono text-slate-500">
              Initializing DARKSPOT Intelligence Engine...
            </p>
          </div>
        )}

        {/* Backend Connectivity Error */}
        {errorMessage && !isLoading && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchInvestigations()}
              className="px-3 py-1 bg-white border border-rose-200 rounded hover:bg-rose-100 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ROUTE 1: Master Landing Page */}
        {currentTab === 'landing' && (
          <LandingPage
            onStartCustom={handleStartCustom}
            onLaunchDemo={handleLaunchSample}
            onOpenWorkspace={handleOpenWorkspace}
            hasActiveInvestigation={Boolean(activeInvestigation)}
          />
        )}

        {/* ROUTE 2: Active Investigation Workspace Views */}
        {currentTab !== 'landing' && !isLoading && activeInvestigation && (
          <>
            {currentTab === 'overview' && (
              <OverviewView
                investigation={activeInvestigation}
                onSelectRequirement={setSelectedRequirement}
                onNavigateToTab={setCurrentTab}
                onOpenAddEvidenceModal={() => setIsAddEvidenceModalOpen(true)}
                onRunInvestigation={handleRunInvestigation}
                onDeleteSource={handleDeleteSource}
                onResolveConflict={setConflictToResolve}
                isRunningPipeline={isSubmitting}
              />
            )}

            {currentTab === 'evidence' && (
              <EvidenceView
                investigation={activeInvestigation}
                onSelectRequirement={setSelectedRequirement}
                onOpenAddEvidenceModal={() => setIsAddEvidenceModalOpen(true)}
                onInspectProvenance={handleOpenProvenance}
              />
            )}

            {currentTab === 'gaps' && (
              <GapsView
                investigation={activeInvestigation}
                onSelectRequirement={setSelectedRequirement}
                onNavigateToPlanner={() => setCurrentTab('planner')}
                onOpenResolveConflictModal={setConflictToResolve}
                onInspectClaimProvenance={handleInspectClaimProvenance}
              />
            )}

            {currentTab === 'planner' && (
              <PlannerView
                investigation={activeInvestigation}
                onToggleAction={handleToggleAction}
                onDraftEmail={setActionToDraft}
              />
            )}

            {currentTab === 'graph' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Evidence Relationship Topology
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualizes causal and epistemic links: Decision → Requirements → Claims → Sources → Conflicts → Actions. Click any node to inspect details.
                  </p>
                </div>
                <EvidenceGraph
                  investigation={activeInvestigation}
                  onSelectRequirement={setSelectedRequirement}
                />
              </div>
            )}
          </>
        )}

        {/* ROUTE 3: Empty Workspace State (if user navigates to workspace without active investigation) */}
        {currentTab !== 'landing' && !isLoading && !activeInvestigation && (
          <div className="py-24 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold text-slate-900">No Active Decision Investigation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select one of the pre-calibrated sample decisions or launch a new investigation to start discovering hidden information gaps.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartCustom('')}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
              >
                New Investigation
              </button>
              <button
                onClick={() => setCurrentTab('landing')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50"
              >
                Return to Landing
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Requirement Detail Drawer */}
      <RequirementDrawer
        requirement={selectedRequirement}
        sources={activeInvestigation?.sources || []}
        claims={activeInvestigation?.claims || []}
        contradictions={activeInvestigation?.contradictions || []}
        actions={activeInvestigation?.verificationPlan || []}
        onClose={() => setSelectedRequirement(null)}
        onToggleAction={handleToggleAction}
      />

      {/* New Investigation Launcher Modal */}
      <NewInvestigationModal
        isOpen={isModalOpen}
        initialQuestion={modalInitialQuestion}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialQuestion('');
        }}
        onSubmit={handleStartInvestigation}
        onLoadPrebuiltSample={handleLaunchSample}
        isLoading={isSubmitting}
        currentProgressStage={currentProgressStage}
      />

      {/* Add Supplemental Evidence Modal */}
      <AddEvidenceModal
        isOpen={isAddEvidenceModalOpen}
        onClose={() => setIsAddEvidenceModalOpen(false)}
        onAddSource={handleAddEvidence}
        isLoading={isAddingEvidence}
      />

      {/* Resolve Contradiction Modal */}
      <ResolveConflictModal
        conflict={conflictToResolve}
        isOpen={Boolean(conflictToResolve)}
        onClose={() => setConflictToResolve(null)}
        onResolve={handleResolveConflict}
        isLoading={isResolvingConflict}
      />

      {/* Executive Decision Completeness Dossier Modal */}
      {activeInvestigation && (
        <AuditReportModal
          investigation={activeInvestigation}
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* Interactive Verbatim Provenance Drawer */}
      <SourceViewer
        isOpen={Boolean(viewerSource)}
        onClose={() => {
          setViewerSource(null);
          setViewerClaim(null);
        }}
        source={viewerSource}
        activeClaim={viewerClaim}
        allClaims={activeInvestigation?.claims || []}
        onSelectClaim={setViewerClaim}
      />

      {/* 1-Click Verification Email Drafter Modal */}
      <DraftEmailModal
        isOpen={Boolean(actionToDraft)}
        onClose={() => setActionToDraft(null)}
        action={actionToDraft}
        decisionQuestion={activeInvestigation?.decisionQuestion || ''}
        sources={activeInvestigation?.sources || []}
        conflicts={activeInvestigation?.contradictions || []}
      />

      {/* Subtle, Professional Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-mono">DARKSPOT</span>
            <span>—</span>
            <span>Decision Completeness Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Shinchan Online Hackathon 2026</span>
            <span>·</span>
            <span>Epistemic Evidence Rigor</span>
            <span>·</span>
            <button
              onClick={handleResetSamples}
              className="hover:text-slate-900 underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reset Demos</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
