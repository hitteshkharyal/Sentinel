// ─────────────────────────────────────────────
// SENTINEL Web — Compliance Score Gauge Component (Day 15)
// ─────────────────────────────────────────────

import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw, Lock, Sparkles } from 'lucide-react';
import type { ComplianceStatus } from '@sentinel/types';

interface ComplianceScoreGaugeProps {
  score: number;
  status: ComplianceStatus;
  privacyLevel?: string;
  lastAuditedAt?: string;
  isAuditing?: boolean;
  onRunAudit: () => void;
}

export const ComplianceScoreGauge: React.FC<ComplianceScoreGaugeProps> = ({
  score,
  status,
  privacyLevel = 'ZERO_VIDEO',
  lastAuditedAt,
  isAuditing,
  onRunAudit,
}) => {
  // SVG circular gauge geometry
  const radius = 68;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusColor = (st: ComplianceStatus) => {
    switch (st) {
      case 'COMPLIANT':
        return {
          stroke: '#10b981', // emerald-500
          text: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          label: 'Fully Compliant',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        };
      case 'WARNING':
        return {
          stroke: '#f59e0b', // amber-500
          text: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          label: 'Action Required',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        };
      case 'NON_COMPLIANT':
      default:
        return {
          stroke: '#ef4444', // red-500
          text: 'text-rose-700',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          label: 'Non-Compliant',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
        };
    }
  };

  const statusMeta = getStatusColor(status);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sentinel-50 text-sentinel-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-sentinel-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Regulatory Health Index
            </h3>
            <p className="text-xs text-slate-500">Autonomous Governance & Statutory Compliance</p>
          </div>
        </div>

        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'Evaluating...' : 'Run Audit'}
        </button>
      </div>

      {/* Main Gauge Visual */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-6">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={statusMeta.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Score */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{score}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Status Callout & Privacy Badges */}
        <div className="space-y-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Current Stance</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              {statusMeta.icon}
              {statusMeta.label}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Privacy Guarantee</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Lock className="w-3 h-3 text-indigo-600" />
              {privacyLevel === 'ZERO_VIDEO' ? '100% Non-Optical (Zero Video)' : privacyLevel}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            Last Audited:{' '}
            <span className="font-mono text-slate-600 font-medium">
              {lastAuditedAt ? new Date(lastAuditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sentinel-600" />
          Autonomous continuous audits run hourly across all rooms and IoT devices.
        </span>
      </div>
    </div>
  );
};
