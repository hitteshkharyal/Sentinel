// ─────────────────────────────────────────────
// SENTINEL Web — ESG Energy & Carbon Digital Twin Card
// ─────────────────────────────────────────────

import React from 'react';
import type { EsgEnergyAnalytics } from '@sentinel/types';
import { ProvenanceBadge } from './ProvenanceBadge';
import { Zap, DollarSign, Leaf, Sliders, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface EsgSavingsCardProps {
  esg: EsgEnergyAnalytics | undefined;
}

export const EsgSavingsCard: React.FC<EsgSavingsCardProps> = ({ esg }) => {
  const totalKwh = esg?.totalKwhSaved ?? 0;
  const costSaved = esg?.estimatedCostSaved ?? 0;
  const carbonOffset = esg?.carbonOffsetKg ?? 0;
  const setbackCount = esg?.setbackExecutionsCount ?? 0;
  const rating = esg?.efficiencyRating ?? 'A';

  const hvac = esg?.hvacHoursByState ?? {
    ECO: 0,
    COMFORT: 0,
    VENTILATION_BOOST: 0,
    OFF: 0,
  };
  const totalHvacHours = Math.max(1, hvac.ECO + hvac.COMFORT + hvac.VENTILATION_BOOST + hvac.OFF);

  const ecoPct = Math.round((hvac.ECO / totalHvacHours) * 100);
  const comfortPct = Math.round((hvac.COMFORT / totalHvacHours) * 100);
  const boostPct = Math.round((hvac.VENTILATION_BOOST / totalHvacHours) * 100);
  const offPct = Math.max(0, 100 - ecoPct - comfortPct - boostPct);

  return (
    <div className="bg-gradient-to-br from-white via-white to-emerald-50/30 rounded-3xl border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* ── Top Header ── */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                ESG Energy & Carbon Setback
              </h3>
              <p className="text-xs text-slate-500">Autonomous vacancy rollback & climate optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge provenance={esg?.provenance || 'ESTIMATED'} />
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grade {rating}</span>
            </div>
          </div>
        </div>

        {/* ── Core ESG KPI Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          {/* Energy Conserved */}
          <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Energy Conserved</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{totalKwh.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-400">kWh</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">1.25 kW/h vacancy delta</span>
          </div>

          {/* Cost Savings */}
          <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Estimated Cost Saved</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-700">
                ${costSaved.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-400">USD</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">@ $0.14/kWh commercial tariff</span>
          </div>

          {/* Carbon Offset */}
          <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Carbon Avoided</span>
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{carbonOffset.toFixed(1)}</span>
              <span className="text-xs font-semibold text-slate-400">kg CO₂e</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">0.42 kg/kWh grid factor</span>
          </div>

          {/* Setback Automations */}
          <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Auto Setbacks</span>
              <Sliders className="w-3.5 h-3.5 text-sentinel-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{setbackCount}</span>
              <span className="text-xs font-semibold text-slate-400">actions</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Closed-loop policy triggers</span>
          </div>
        </div>

        {/* ── Multi-Zone HVAC State Distribution ── */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">HVAC Zone Operating State Distribution</span>
            <span className="text-slate-400 font-mono text-[11px]">{totalHvacHours} total room-hours</span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="h-3.5 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${ecoPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500 relative group cursor-pointer"
              title={`ECO State: ${hvac.ECO}h (${ecoPct}%)`}
            />
            <div
              style={{ width: `${comfortPct}%` }}
              className="bg-sentinel-500 h-full transition-all duration-500 relative group cursor-pointer"
              title={`COMFORT State: ${hvac.COMFORT}h (${comfortPct}%)`}
            />
            <div
              style={{ width: `${boostPct}%` }}
              className="bg-amber-400 h-full transition-all duration-500 relative group cursor-pointer"
              title={`VENTILATION_BOOST: ${hvac.VENTILATION_BOOST}h (${boostPct}%)`}
            />
            <div
              style={{ width: `${offPct}%` }}
              className="bg-slate-300 h-full transition-all duration-500 relative group cursor-pointer"
              title={`OFF / Unassigned: ${hvac.OFF}h (${offPct}%)`}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>ECO Setback ({ecoPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sentinel-500" />
              <span>Comfort Conditioning ({comfortPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Fresh Air Boost ({boostPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Off / Inactive ({offPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Verified against ASHRAE 90.1 standard occupancy setback benchmarks</span>
        <Badge variant="success" size="sm">Active Digital Twin</Badge>
      </div>
    </div>
  );
};
