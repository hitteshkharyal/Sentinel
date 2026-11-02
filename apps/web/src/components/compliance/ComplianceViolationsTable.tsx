// ─────────────────────────────────────────────
// SENTINEL Web — Compliance Violations Table Component (Day 15)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { ComplianceViolation, ViolationSeverity } from '@sentinel/types';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Wrench,
  CheckCircle2,
  Building,
  Filter,
} from 'lucide-react';

interface ComplianceViolationsTableProps {
  violations: ComplianceViolation[];
  onRemediate: (violationId: string, action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS') => Promise<boolean>;
}

export const ComplianceViolationsTable: React.FC<ComplianceViolationsTableProps> = ({
  violations,
  onRemediate,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [actingId, setActingId] = useState<string | null>(null);

  const getSeverityBadge = (severity: ViolationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertOctagon className="w-2.5 h-2.5" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
            <Info className="w-2.5 h-2.5" /> MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            <Info className="w-2.5 h-2.5" /> LOW
          </span>
        );
    }
  };

  const filteredViolations = violations.filter((v) => {
    if (filterSeverity === 'ALL') return true;
    return v.severity === filterSeverity;
  });

  const handleAction = async (violationId: string, action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS') => {
    setActingId(violationId);
    try {
      await onRemediate(violationId, action);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Active Regulatory Violations & Hazards</h3>
          <p className="text-xs text-slate-500">Autonomous detections requiring physical or policy remediation</p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      {filteredViolations.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Zero Active Violations Detected</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            All rooms, environmental sensors, and autonomous policies comply with active regulatory frameworks.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredViolations.map((v) => (
            <div key={v.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge(v.severity)}
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {v.framework}
                  </span>
                  {v.roomName && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Building className="w-3 h-3" />
                      {v.roomName}
                    </span>
                  )}
                  {v.status === 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      RESOLVED
                    </span>
                  )}
                  {v.status === 'SUPPRESSED' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      SUPPRESSED
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">{v.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>

                {/* Values comparison */}
                {(v.detectedValue !== undefined || v.requiredValue !== undefined) && (
                  <div className="flex items-center gap-4 text-xs font-mono pt-1">
                    {v.detectedValue !== undefined && (
                      <span className="text-rose-600 font-semibold">
                        Observed: <span className="bg-rose-50 px-1.5 py-0.5 rounded">{v.detectedValue}</span>
                      </span>
                    )}
                    {v.requiredValue !== undefined && (
                      <span className="text-slate-500">
                        Target Band: <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{v.requiredValue}</span>
                      </span>
                    )}
                  </div>
                )}

                {v.remediationAction && (
                  <p className="text-[11px] text-sentinel-700 font-medium flex items-center gap-1 pt-1">
                    <Wrench className="w-3 h-3 shrink-0" />
                    Recommended Fix: {v.remediationAction}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                {v.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleAction(v.id, 'AUTO_FIX')}
                      disabled={actingId === v.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sentinel-600 text-white hover:bg-sentinel-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {actingId === v.id ? 'Fixing...' : 'Auto-Remediate'}
                    </button>
                    <button
                      onClick={() => handleAction(v.id, 'SUPPRESS')}
                      disabled={actingId === v.id}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Suppress
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
