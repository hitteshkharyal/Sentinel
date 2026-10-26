import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-mono font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-xs sm:text-sm px-4 py-2 gap-2',
      lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
    };

    const variantStyles = {
      primary:
        'btn-chamfer btn-cyan-glow bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-600 font-bold border border-cyan-400 focus:ring-cyan-400',
      secondary:
        'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 active:bg-cyan-950 border border-cyan-500/30 focus:ring-cyan-500',
      outline:
        'bg-[#060e1d]/80 text-slate-200 hover:text-white hover:bg-[#0c1a33] border border-cyan-500/25 active:bg-[#071124] focus:ring-cyan-400',
      ghost:
        'bg-transparent text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 focus:ring-cyan-500',
      danger:
        'bg-rose-600/90 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm shadow-rose-600/30 focus:ring-rose-500 border border-rose-500/40',
      success:
        'bg-emerald-600/90 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm shadow-emerald-600/30 focus:ring-emerald-500 border border-emerald-500/40',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
