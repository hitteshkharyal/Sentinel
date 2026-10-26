import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  variant = 'info',
  title,
  onDismiss,
  icon,
  ...props
}) => {
  const variantStyles = {
    info: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200 backdrop-blur-md',
    success: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 backdrop-blur-md',
    warning: 'bg-amber-950/40 border-amber-500/30 text-amber-200 backdrop-blur-md',
    danger: 'bg-rose-950/40 border-rose-500/30 text-rose-200 backdrop-blur-md',
  };

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icon || defaultIcons[variant]}</div>
      <div className="flex-1 text-xs sm:text-sm font-mono">
        {title && <h5 className="font-bold leading-tight mb-1 text-white">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
