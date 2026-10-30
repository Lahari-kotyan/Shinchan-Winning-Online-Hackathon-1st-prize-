/**
 * DARKSPOT Design System — Textarea Component
 */

import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isMonospace?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      isMonospace = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-800 tracking-tight"
          >
            {label}
            {props.required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`w-full text-xs text-slate-900 bg-white border rounded-md p-2.5 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
            isMonospace ? 'font-mono text-[11px]' : ''
          } ${
            errorMessage
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500'
              : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900'
          } ${className}`}
          {...props}
        />

        {errorMessage ? (
          <p className="text-[11px] text-rose-600 font-medium">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
