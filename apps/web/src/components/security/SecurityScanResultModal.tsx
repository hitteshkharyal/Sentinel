// ─────────────────────────────────────────────
// SENTINEL Web — Zero-Trust Security Scan Findings Modal (Day 16)
// ─────────────────────────────────────────────

import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileBadge,
} from 'lucide-react';
import type { SecurityAuditScanResult } from '@sentinel/types';

export interface SecurityScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: SecurityAuditScanResult | null;
}

export const SecurityScanResultModal: React.FC<SecurityScanResultModalProps> = ({
  isOpen,
  onClose,
  scanResult,
}) => {
  if (!isOpen || !scanResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-glass border border-surface-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border/40 bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">
                  Zero-Trust Boundary Audit Report
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Grade {scanResult.postureGrade}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Audited at {new Date(scanResult.scannedAt).toLocaleTimeString()} across 7 statutory
                security invariants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score KPI Bar */}
        <div className="px-6 py-4 bg-surface/20 border-b border-surface-border/30 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-black text-emerald-400">{scanResult.overallScore}%</div>
            <div className="text-[10px] uppercase font-semibold text-text-muted">Overall Score</div>
          </div>
          <div>
            <div className="text-xl font-black text-emerald-400">{scanResult.passedCount}</div>
            <div className="text-[10px] uppercase font-semibold text-text-muted">Passed Checks</div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">{scanResult.warnCount}</div>
            <div className="text-[10px] uppercase font-semibold text-text-muted">Warnings</div>
          </div>
          <div>
            <div className="text-xl font-black text-red-400">{scanResult.failCount}</div>
            <div className="text-[10px] uppercase font-semibold text-text-muted">Failures</div>
          </div>
        </div>

        {/* Check items list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {scanResult.checks.map((check) => {
            const isPass = check.status === 'PASS';
            const isWarn = check.status === 'WARN';

            return (
              <div
                key={check.id}
                className={`p-4 rounded-xl border transition-all ${isPass
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : isWarn
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-text-primary text-sm">{check.name}</span>
                      <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-surface text-text-muted border border-surface-border/40">
                        {check.category}
                      </span>
                      <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                        {check.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${isPass ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-red-400'
                      }`}
                  >
                    {check.score}/100
                  </span>
                </div>

                {check.recommendation && (
                  <div className="mt-2.5 pt-2.5 border-t border-surface-border/30 flex items-start gap-2 text-[11px] text-amber-300/90">
                    <FileBadge className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Recommendation:</strong> {check.recommendation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border/40 bg-surface/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-surface border border-surface-border text-text-primary hover:bg-surface/80 text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

