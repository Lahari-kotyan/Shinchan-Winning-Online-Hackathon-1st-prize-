/**
 * DARKSPOT — Interactive Evidence Relationship Graph
 * Visualizes the complete causal & epistemic topology:
 * Decision -> Requirements -> Claims -> Sources -> Contradictions -> Verification Actions
 * Powered by @xyflow/react
 */

import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { Investigation, DecisionRequirement } from '../types/intelligence.ts';
import { Filter, Layers, ZoomIn } from 'lucide-react';

interface EvidenceGraphProps {
  investigation: Investigation;
  onSelectRequirement: (req: DecisionRequirement) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  investigation,
  onSelectRequirement,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'requirements' | 'conflicts' | 'actions'>('all');

  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // Layered X-coordinates for zero-collision topological visualization
    const ROOT_X = 50;
    const REQ_X = 380;
    const CLAIMS_X = 760;
    const CONFLICTS_X = 1140;
    const ACTIONS_X = 1520;

    // Calculate dynamic vertical height per requirement based on its child elements
    let currentY = 60;
    const reqPositions: { reqId: string; y: number }[] = [];

    investigation.requirements.forEach(req => {
      const reqClaims = investigation.claims.filter(c => c.requirementId === req.id);
      const reqActions = investigation.verificationPlan.filter(a => a.requirementId === req.id);
      const reqConflicts = investigation.contradictions.filter(c => c.requirementId === req.id);
      const maxChildren = Math.max(reqClaims.length, reqActions.length, reqConflicts.length, 1);
      const slotHeight = Math.max(160, maxChildren * 90);

      reqPositions.push({ reqId: req.id, y: currentY });
      currentY += slotHeight + 40;
    });

    const totalHeight = currentY;
    const rootY = Math.max(120, totalHeight / 2 - 50);

    // Node 1: Root Decision Node
    const rootId = 'node-root-decision';
    rawNodes.push({
      id: rootId,
      type: 'default',
      position: { x: ROOT_X, y: rootY },
      data: {
        label: (
          <div className="p-3 text-left w-64 bg-slate-950 text-white rounded shadow-md border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
              DECISION FOCUS
            </span>
            <p className="text-xs font-bold leading-snug line-clamp-3">
              {investigation.decisionQuestion}
            </p>
          </div>
        ),
      },
    });

    investigation.requirements.forEach((req, idx) => {
      const reqId = `node-req-${req.id}`;
      const reqY = reqPositions[idx].y;

      const isConflicting = req.status === 'CONFLICTING';
      const isMissing = req.status === 'NOT_FOUND';
      const isSupported = req.status === 'SUPPORTED';

      const borderClass = isConflicting
        ? 'border-rose-400 bg-rose-50/90 text-rose-950'
        : isMissing
        ? 'border-slate-300 bg-slate-50 text-slate-900'
        : isSupported
        ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
        : 'border-amber-300 bg-amber-50/90 text-amber-950';

      rawNodes.push({
        id: reqId,
        position: { x: REQ_X, y: reqY },
        data: {
          label: (
            <div
              onClick={() => onSelectRequirement(req)}
              className={`p-3 text-left w-64 rounded border ${borderClass} shadow-xs cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-bold">[{req.priority}]</span>
                <span className="uppercase">{req.status.replace('_', ' ')}</span>
              </div>
              <p className="text-xs font-semibold leading-tight line-clamp-2">
                {req.title}
              </p>
              <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>Claims: {req.claimIds.length}</span>
                <span className="underline text-slate-700">Inspect ↗</span>
              </div>
            </div>
          ),
        },
      });

      // Edge from Decision to Requirement
      rawEdges.push({
        id: `edge-root-to-${reqId}`,
        source: rootId,
        target: reqId,
        animated: isConflicting || isMissing,
        style: {
          stroke: isConflicting ? '#e11d48' : isMissing ? '#94a3b8' : '#0f172a',
          strokeWidth: isConflicting ? 2 : 1.5,
        },
        markerEnd: { type: MarkerType.ArrowClosed },
      });

      // Claims Column (Lane 3: CLAIMS_X)
      if (filterMode === 'all' || filterMode === 'requirements') {
        const reqClaims = investigation.claims.filter(c => c.requirementId === req.id);
        reqClaims.forEach((claim, cIdx) => {
          const claimId = `node-claim-${claim.id}`;
          const claimY = reqY + cIdx * 80;

          rawNodes.push({
            id: claimId,
            position: { x: CLAIMS_X, y: claimY },
            data: {
              label: (
                <div className="p-2 text-left w-60 bg-white border border-slate-200 rounded text-[11px] shadow-xs">
                  <span className="font-mono text-[9px] text-slate-400 block uppercase">
                    {claim.id} · {claim.publicationDate || 'Date N/A'}
                  </span>
                  <p className="text-slate-800 line-clamp-2 mt-0.5 font-medium">
                    "{claim.claimText}"
                  </p>
                </div>
              ),
            },
          });

          rawEdges.push({
            id: `edge-${reqId}-to-${claimId}`,
            source: reqId,
            target: claimId,
            style: { stroke: '#cbd5e1' },
          });
        });
      }

      // Actions Column (Lane 5: ACTIONS_X)
      if (filterMode === 'all' || filterMode === 'actions') {
        const reqActions = investigation.verificationPlan.filter(a => a.requirementId === req.id);
        reqActions.forEach((action, aIdx) => {
          const actId = `node-act-${action.id}`;
          const actY = reqY + aIdx * 85;

          rawNodes.push({
            id: actId,
            position: { x: ACTIONS_X, y: actY },
            data: {
              label: (
                <div className="p-2 text-left w-60 bg-slate-900 text-white rounded text-[11px] shadow-xs">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-0.5">
                    <span>ACTION [{action.priority}]</span>
                    {action.completed && <span className="text-emerald-400 font-bold">✓ DONE</span>}
                  </div>
                  <p className="font-medium line-clamp-2">
                    {action.whatNeedsVerification}
                  </p>
                </div>
              ),
            },
          });

          rawEdges.push({
            id: `edge-${reqId}-to-${actId}`,
            source: reqId,
            target: actId,
            style: { stroke: '#475569', strokeDasharray: '4,4' },
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      }
    });

    // Contradiction Nodes (Lane 4: CONFLICTS_X)
    if (filterMode === 'all' || filterMode === 'conflicts') {
      investigation.contradictions.forEach((con, conIdx) => {
        const conId = `node-conflict-${con.id}`;
        const parentReqIdx = investigation.requirements.findIndex(r => r.id === con.requirementId);
        const parentReq = investigation.requirements[parentReqIdx];
        const baseY = parentReqIdx >= 0 ? reqPositions[parentReqIdx].y : 60 + conIdx * 120;

        rawNodes.push({
          id: conId,
          position: { x: CONFLICTS_X, y: baseY + (conIdx % 2) * 50 },
          data: {
            label: (
              <div
                onClick={() => parentReq && onSelectRequirement(parentReq)}
                className="p-2.5 text-left w-64 bg-rose-600 text-white rounded shadow-md border border-rose-700 cursor-pointer hover:bg-rose-700 transition-colors"
                title="Click to inspect requirement details"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="uppercase tracking-wider font-bold">
                    ⚡ {con.type.replace('_', ' ')}
                  </span>
                  {con.resolved && <span className="bg-white/20 px-1 rounded text-[9px]">RESOLVED</span>}
                </div>
                <p className="text-[11px] mt-1 font-semibold leading-snug">
                  {con.requirementTitle}
                </p>
                {con.mathDelta && (
                  <p className="text-[10px] font-mono bg-rose-800/80 px-1.5 py-0.5 rounded mt-1 font-bold">
                    Δ {con.mathDelta}
                  </p>
                )}
                <span className="text-[9px] text-rose-200 mt-1 block underline">
                  Inspect conflict details ↗
                </span>
              </div>
            ),
          },
        });

        // Edge connecting from requirement to conflict node
        rawEdges.push({
          id: `edge-req-to-${conId}`,
          source: `node-req-${con.requirementId}`,
          target: conId,
          animated: true,
          style: { stroke: '#e11d48', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      });
    }

    return { nodes: rawNodes, edges: rawEdges };
  }, [investigation, filterMode, onSelectRequirement]);

  return (
    <div className="h-[700px] w-full bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs text-xs">
        <span className="text-slate-400 px-2 font-medium text-[11px] flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filterMode === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Complete Graph
        </button>
        <button
          onClick={() => setFilterMode('requirements')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filterMode === 'requirements'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Requirements & Claims
        </button>
        <button
          onClick={() => setFilterMode('conflicts')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filterMode === 'conflicts'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Conflicts Only
        </button>
        <button
          onClick={() => setFilterMode('actions')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            filterMode === 'actions'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Verification Actions
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded p-2 text-[11px] text-slate-500 shadow-xs flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 inline-block" /> Decision Focus
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Supported
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Partial / Outdated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Conflicting
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Not Found
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-white border border-slate-200 rounded"
        />
      </ReactFlow>
    </div>
  );
};
