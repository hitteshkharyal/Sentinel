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
    default: 'bg-[var(--theme-badge-bg)] text-[var(--theme-text)] border-[var(--theme-border)] font-bold',
    primary: 'bg-[var(--theme-badge-bg)] text-[var(--theme-primary)] border-[var(--theme-badge-border)] font-bold',
    info: 'bg-[var(--theme-badge-bg)] text-[var(--theme-primary)] border-[var(--theme-badge-border)] font-bold',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/35 font-bold',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/35 font-bold',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/35 font-bold',
    neutral: 'bg-[var(--theme-surface-card)] text-[var(--theme-text-muted)] border-[var(--theme-border)] font-bold',
  };

  const dotColors = {
    default: 'bg-[var(--theme-text-muted)]',
    primary: 'bg-[var(--theme-primary)]',
    info: 'bg-[var(--theme-primary)]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-[var(--theme-text-dim)]',
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
