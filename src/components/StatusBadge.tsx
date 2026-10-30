/**
 * DARKSPOT — Typographic Status & Priority Indicators
 * Adheres strictly to Zero-Pill discipline: unboxed clean text or subtle minimal borders.
 * Never hue-only: always includes an icon and clear semantic text.
 */

import React from 'react';
import { GapStatus, RequirementPriority } from '../types/intelligence.ts';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, HelpCircle, FileQuestion } from 'lucide-react';

interface StatusBadgeProps {
  status: GapStatus;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, className = '' }) => {
  switch (status) {
    case 'SUPPORTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 ${className}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span>Supported</span>
        </span>
      );
    case 'PARTIALLY_SUPPORTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 ${className}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>Partially Supported</span>
        </span>
      );
    case 'CONFLICTING':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 ${className}`}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span>Conflicting Evidence</span>
        </span>
      );
    case 'OUTDATED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-orange-800 ${className}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
          <span>Outdated Sources</span>
        </span>
      );
    case 'INSUFFICIENT_EVIDENCE':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 ${className}`}>
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
          <span>Insufficient Evidence</span>
        </span>
      );
    case 'NOT_FOUND':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 ${className}`}>
          {showIcon && <FileQuestion className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span>Not Found in Sources</span>
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: RequirementPriority }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 font-mono">
          [Critical]
        </span>
      );
    case 'HIGH':
      return (
        <span className="text-xs font-medium uppercase tracking-wider text-amber-700 font-mono">
          [High]
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="text-xs font-medium uppercase tracking-wider text-slate-600 font-mono">
          [Medium]
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="text-xs font-normal uppercase tracking-wider text-slate-400 font-mono">
          [Low]
        </span>
      );
  }
};

export const InvestigationLifecycleBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}>
          <Clock className="w-3 h-3 text-slate-500" />
          <span>DRAFT SPECIFICATION</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <Clock className="w-3 h-3 text-blue-600" />
          <span>SUBMITTED</span>
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>PROCESSING PIPELINE</span>
        </span>
      );
    case 'PARTIALLY_COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>PARTIALLY COMPLETED</span>
        </span>
      );
    case 'COMPLETED':
    case 'COMPLETE':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>INVESTIGATION COMPLETED</span>
        </span>
      );
    case 'FAILED':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>ANALYSIS FAILED</span>
        </span>
      );
  }
};
