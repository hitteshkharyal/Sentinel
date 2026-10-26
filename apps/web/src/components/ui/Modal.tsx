import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthStyles[maxWidth]} max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-[#060e1d]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 z-10 overflow-hidden transform animate-slide-up text-slate-100 my-auto`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between gap-4 bg-[#030712]/60">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-400 mt-0.5 font-light truncate">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-slate-300 hover:text-white rounded-xl p-2 hover:bg-cyan-950/50 transition-colors focus:outline-none cursor-pointer border border-transparent hover:border-cyan-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
            )}
          </div>
        )}

        {/* Body Content with Native Scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-[#030712]/80 border-t border-cyan-500/20 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
