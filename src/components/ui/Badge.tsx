/**
 * DARKSPOT Design System — Badge & Status Indicators
 * Zero-Pill compliant: unboxed clean text or subtle minimal borders.
 */

import React from 'react';
import { GapStatus, RequirementPriority } from '../../types/intelligence.ts';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  HelpCircle,
  FileQuestion,
  ShieldCheck,
} from 'lucide-react';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const variantStyles = {
    default: 'text-slate-800 bg-slate-100/80 border border-slate-200/80',
    success: 'text-emerald-800 bg-emerald-50 border border-emerald-200/80',
    warning: 'text-amber-800 bg-amber-50 border border-amber-200/80',
    danger: 'text-rose-800 bg-rose-50 border border-rose-200/80',
    neutral: 'text-slate-600 bg-slate-50 border border-slate-200',
    outline: 'text-slate-700 bg-white border border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const DecisionStatusBadge: React.FC<{ status: GapStatus; showIcon?: boolean; className?: string }> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  switch (status) {
    case 'SUPPORTED':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 ${className}`}>
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
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 ${className}`}>
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

export const DecisionPriorityBadge: React.FC<{ priority: RequirementPriority }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 font-mono">
          [Critical]
        </span>
      );
    case 'HIGH':
      return (
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 font-mono">
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
