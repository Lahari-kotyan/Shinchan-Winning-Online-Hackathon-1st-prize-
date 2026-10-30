/**
 * DARKSPOT — Decision Readiness Banner & Defensible Completeness Score
 * Displays transparent mathematical score breakdown and qualitative risk synthesis.
 */

import React, { useState } from 'react';
import { DecisionReadiness, DecisionRequirement, ContradictionFinding } from '../types/intelligence.ts';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ReadinessBannerProps {
  readiness: DecisionReadiness;
  requirements: DecisionRequirement[];
  contradictions: ContradictionFinding[];
}

export const ReadinessBanner: React.FC<ReadinessBannerProps> = ({
  readiness,
  requirements,
  contradictions,
}) => {
  const [showFormula, setShowFormula] = useState(false);

  const isNotReady = readiness.status === 'NOT_READY';
  const isCaution = readiness.status === 'PROCEED_WITH_CAUTION';
  const isReady = readiness.status === 'DECISION_READY';

  const badgeConfig = isNotReady
    ? {
        label: 'DECISION NOT READY',
        bg: 'bg-rose-50',
        text: 'text-rose-900',
        border: 'border-rose-200',
        accentBar: 'bg-rose-600',
        icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        subtext: 'Critical requirements have zero evidence or suffer from direct contradictions across sources.',
      }
    : isCaution
    ? {
        label: 'PROCEED WITH CAUTION',
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-200',
        accentBar: 'bg-amber-600',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        subtext: 'Foundational requirements are supported, but peripheral terms or secondary risks remain unverified.',
      }
    : {
        label: 'DECISION READY',
        bg: 'bg-emerald-50',
        text: 'text-emerald-900',
        border: 'border-emerald-200',
        accentBar: 'bg-emerald-600',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        subtext: 'All mandatory and high-priority requirements are verified with current, corroborating evidence.',
      };

  return (
    <div className={`border ${badgeConfig.border} ${badgeConfig.bg} rounded-lg p-5 mb-8 shadow-xs transition-all`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left: Status & Qualitative Synthesis */}
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            {badgeConfig.icon}
            <span className={`text-xs font-bold tracking-wider uppercase font-mono ${badgeConfig.text}`}>
              {badgeConfig.label}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-600">
              {badgeConfig.subtext}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed mt-2">
            {readiness.summary}
          </p>

          {/* Quick Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/60 text-xs">
            <div>
              <span className="font-semibold text-slate-900 block mb-1">
                Verified & Corroborated:
              </span>
              {readiness.supportedAspects.length > 0 ? (
                <ul className="space-y-1 text-slate-700">
                  {readiness.supportedAspects.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500 italic">No requirements yet fully corroborated.</span>
              )}
            </div>

            <div>
              <span className="font-semibold text-rose-900 block mb-1">
                Material Disqualifiers & Active Risks:
              </span>
              {readiness.materialGaps.length > 0 ? (
                <ul className="space-y-1 text-slate-700">
                  {readiness.materialGaps.slice(0, 3).map((gap, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">!</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500 italic">No catastrophic dealbreakers detected.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Defensible Evidence Completeness Score */}
        <div className="bg-white/90 border border-slate-200 rounded-md p-4 w-full md:w-64 shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Evidence Completeness</span>
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5 text-[11px]"
                title="View defensible calculation methodology"
              >
                <Info className="w-3 h-3" />
                <span>Formula</span>
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                {readiness.completenessScore}%
              </span>
              <span className="text-xs text-slate-500">
                / 100% verified
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  readiness.completenessScore >= 80
                    ? 'bg-emerald-600'
                    : readiness.completenessScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
                style={{ width: `${Math.max(readiness.completenessScore, 3)}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Requirements: {requirements.length}</span>
            <span>Conflicts: {contradictions.length}</span>
          </div>
        </div>
      </div>

      {/* Explanatory Formula Drawer */}
      {showFormula && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 bg-white/70 p-3 rounded">
          <p className="font-semibold text-slate-800 mb-1">
            Defensible Completeness Calculation Methodology:
          </p>
          <p className="leading-relaxed">
            Unlike arbitrary confidence scores, DARKSPOT weights each requirement by priority:
            <strong> Critical (4x)</strong>, <strong>High (3x)</strong>, <strong>Medium (2x)</strong>, <strong>Low (1x)</strong>.
            Points are awarded strictly on verified evidence status:
            <em> Supported = 100%</em>, <em>Partially Supported = 45%</em>, <em>Outdated = 20%</em>, <em>Insufficient = 15%</em>, and <em>Conflicting / Not Found = 0%</em>.
            Any active Critical contradiction or absent Critical requirement automatically triggers <strong>DECISION NOT READY</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
