/**
 * DARKSPOT Design System — Button Component
 * Clean, accessible button adhering to Linear/Stripe aesthetic restraint.
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const actualLoading = isLoading || loading;
    const actualLeftIcon = leftIcon || icon;
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none shrink-0 whitespace-nowrap';

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs active:bg-slate-950',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 active:bg-slate-300',
      outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs active:bg-slate-100',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs active:bg-rose-800',
      success: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs active:bg-emerald-900',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'py-1 px-2 text-[11px] gap-1',
      sm: 'py-1.5 px-3 text-xs gap-1.5',
      md: 'py-2 px-3.5 text-xs font-semibold gap-2',
      lg: 'py-2.5 px-5 text-sm font-semibold gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || actualLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {actualLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          actualLeftIcon && <span className="shrink-0">{actualLeftIcon}</span>
        )}
        <span>{children}</span>
        {!actualLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
