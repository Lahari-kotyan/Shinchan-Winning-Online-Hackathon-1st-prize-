/**
 * DARKSPOT Design System — EmptyState Component
 */

import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FileQuestion className="w-8 h-8 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/40 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="p-3 bg-white rounded-full border border-slate-200 shadow-2xs">
        {icon}
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
