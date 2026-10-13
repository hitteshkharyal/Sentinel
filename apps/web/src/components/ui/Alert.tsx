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
    info: 'bg-blue-50/80 border-blue-200 text-blue-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    danger: 'bg-rose-50/80 border-rose-200 text-rose-900',
  };

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icon || defaultIcons[variant]}</div>
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold leading-tight mb-1">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
