/**
 * DARKSPOT Design System — Input Component
 */

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
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

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full text-xs text-slate-900 bg-white border rounded-md py-2 px-3 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              errorMessage
                ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500'
                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900'
            } ${leftIcon ? 'pl-8' : ''} ${rightIcon ? 'pr-8' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-2.5 text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {errorMessage ? (
          <p className="text-[11px] text-rose-600 font-medium">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
