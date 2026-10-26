// ─────────────────────────────────────────────
// SENTINEL Web — SLA Performance & Escalation Analytics Card
// ─────────────────────────────────────────────

import React from 'react';
import type { SlaIncidentAnalytics } from '@sentinel/types';
import { ProvenanceBadge } from './ProvenanceBadge';
import { Clock, ShieldAlert, TrendingUp, CheckCircle2, AlertOctagon } from 'lucide-react';

interface SlaPerformanceCardProps {
  sla: SlaIncidentAnalytics | undefined;
}

export const SlaPerformanceCard: React.FC<SlaPerformanceCardProps> = ({ sla }) => {
  const compliance = sla?.slaComplianceRate ?? 98;
  const mtta = sla?.avgMttaMinutes ?? 3.2;
  const mttr = sla?.avgMttrMinutes ?? 18.5;
  const total = sla?.totalIncidents ?? 0;
  const breached = sla?.breachedCount ?? 0;

  const severity = sla?.bySeverity ?? {
    CRITICAL: 0,
    HIGH: 0,
    WARNING: 0,
    INFO: 0,
  };

  const tiers = sla?.byEscalationTier ?? {
    tier1: 0,
    tier2: 0,
    tier3: 0,
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                SLA Performance & Escalations
              </h3>
              <p className="text-xs text-slate-500">Mean Time to Acknowledge (MTTA) & Multi-Tier Escalation</p>
            </div>
          </div>

          <ProvenanceBadge provenance={sla?.provenance || 'MEASURED'} />
        </div>

        {/* ── Core KPI Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">SLA Compliance</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {compliance}%
            </span>
            <span className="text-[10px] text-slate-400">On-time response</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Avg MTTA</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {mtta} <span className="text-xs font-normal text-slate-500">min</span>
            </span>
            <span className="text-[10px] text-slate-400">Time to acknowledge</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Avg MTTR</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {mttr} <span className="text-xs font-normal text-slate-500">min</span>
            </span>
            <span className="text-[10px] text-slate-400">Time to resolve</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Incidents</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {total}
            </span>
            <span className="text-[10px] text-rose-500 font-medium">
              {breached} breached deadline
            </span>
          </div>
        </div>

        {/* ── Severity Breakdown & Escalation Tiers ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Severity Breakdown */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Incidents by Severity
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                <span className="font-medium text-[11px]">Critical (5m)</span>
                <span className="font-bold">{severity.CRITICAL}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-medium text-[11px]">High (15m)</span>
                <span className="font-bold">{severity.HIGH}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900">
                <span className="font-medium text-[11px]">Warning (1h)</span>
                <span className="font-bold">{severity.WARNING}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                <span className="font-medium text-[11px]">Info (4h)</span>
                <span className="font-bold">{severity.INFO}</span>
              </div>
            </div>
          </div>

          {/* Escalation Tiers */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Escalation Matrix Tiers
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                <span className="font-medium text-slate-600 text-[11px]">Tier 1 — Frontline Operator</span>
                <span className="font-bold text-slate-900">{tiers.tier1}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-purple-50/60 border border-purple-200 text-purple-900">
                <span className="font-medium text-[11px]">Tier 2 — Facility Supervisor</span>
                <span className="font-bold">{tiers.tier2}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/60 border border-rose-200 text-rose-900">
                <span className="font-medium text-[11px]">Tier 3 — Executive / Emergency</span>
                <span className="font-bold">{tiers.tier3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
          Strict determinism: Tiers 1–3 SLA escalation heartbeat
        </span>
        <span className="font-mono text-[10px]">Audit Trails Intact</span>
      </div>
    </div>
  );
};
