import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulsing?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  dot = false,
  pulsing = false,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-bold',
    md: 'text-xs px-2.5 py-1 gap-2 font-bold',
  };

  const variantStyles = {
    default: 'bg-[#060e1d] text-slate-300 border-cyan-500/20',
    primary: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    info: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
    neutral: 'bg-[#040814] text-slate-400 border-slate-800',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-cyan-400',
    info: 'bg-cyan-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wider uppercase font-mono ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulsing && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};
