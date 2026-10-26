import React, { forwardRef } from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      onClear,
      className = '',
      id,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full font-mono">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-cyan-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            disabled={disabled}
            className={`w-full rounded-xl border bg-[#030712]/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all duration-150 outline-none
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || onClear ? 'pr-10' : ''}
              ${
                error
                  ? 'border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-cyan-500/25 hover:border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
              }
              ${disabled ? 'bg-[#02050c] text-slate-600 cursor-not-allowed border-cyan-500/10' : ''}
              ${className}
            `}
            {...props}
          />
          {onClear && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3.5 text-slate-400 hover:text-cyan-400 focus:outline-none"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {rightIcon && !onClear && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 mt-1 font-mono">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-400 mt-1 font-mono font-light">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
