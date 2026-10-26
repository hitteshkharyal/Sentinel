// ─────────────────────────────────────────────
// SENTINEL Web — Day 12 Analytics & ESG Digital Twin Console
// ─────────────────────────────────────────────

import React from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { TimeframeSelector } from '../components/analytics/TimeframeSelector';
import { EsgSavingsCard } from '../components/analytics/EsgSavingsCard';
import { OccupancyTrendChart } from '../components/analytics/OccupancyTrendChart';
import { EnvironmentalTrendChart } from '../components/analytics/EnvironmentalTrendChart';
import { SlaPerformanceCard } from '../components/analytics/SlaPerformanceCard';
import { DeviceHealthMatrix } from '../components/analytics/DeviceHealthMatrix';
import { Badge } from '../components/ui/Badge';
import { Sparkles, Info, ShieldCheck, Activity, Cpu } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { overview, isLoading, error } = useAnalytics();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" dot>
              {isLoading ? 'Updating Digital Twin...' : 'ESG Digital Twin Active'}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Day 12 Implementation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Spatial Analytics & ESG Digital Twin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sense → Understand → Decide → Act → Quantify Real-World Impact.
          </p>
        </div>

        {/* Epistemological Legend Pill */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-2xs text-xs">
          <span className="text-slate-400 font-medium px-1.5 text-[11px]">Provenance:</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            <Activity className="w-2.5 h-2.5" /> MEASURED
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sentinel-700 bg-sentinel-50 px-2 py-0.5 rounded-lg border border-sentinel-200">
            <Cpu className="w-2.5 h-2.5" /> ESTIMATED
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
            <Sparkles className="w-2.5 h-2.5" /> PREDICTED
          </span>
        </div>
      </div>

      {/* ── 2. Timeframe & Spatial Filter Toolbar ── */}
      <TimeframeSelector />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 3. ESG Energy & Carbon Digital Twin (Hero Component) ── */}
      <EsgSavingsCard esg={overview?.esg} />

      {/* ── 4. Spatial Analytics & Environmental Quality Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OccupancyTrendChart occupancy={overview?.occupancy} />
        <EnvironmentalTrendChart environment={overview?.environment} />
      </div>

      {/* ── 5. SLA Response & Device Fleet Reliability Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SlaPerformanceCard sla={overview?.sla} />
        <DeviceHealthMatrix devices={overview?.devices} />
      </div>

      {/* ── 6. Epistemological Architecture Footer ── */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sentinel-600 shrink-0" />
          <span>
            Strict Epistemological Boundary: Physical measurements are strictly distinguished from derived spatial twin estimations.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Generated: {overview ? new Date(overview.generatedAt).toLocaleTimeString() : 'Live'}
        </span>
      </div>
    </div>
  );
};
