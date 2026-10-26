// ─────────────────────────────────────────────
// SENTINEL Web — Spatial Occupancy & Utilization Trend Chart
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { OccupancyAnalytics } from '@sentinel/types';
import { ProvenanceBadge } from './ProvenanceBadge';
import { Users, Clock, Flame, BarChart2 } from 'lucide-react';

interface OccupancyTrendChartProps {
  occupancy: OccupancyAnalytics | undefined;
}

export const OccupancyTrendChart: React.FC<OccupancyTrendChartProps> = ({ occupancy }) => {
  const [hoveredHour, setHoveredHour] = useState<{
    hour: string;
    avg: number;
    peak: number;
  } | null>(null);

  const utilizationRate = occupancy?.utilizationRate ?? 0;
  const peakHour = occupancy?.peakOccupancyHour ?? '14:00';
  const peakCount = occupancy?.peakOccupantCount ?? 0;
  const avgOccupants = occupancy?.avgOccupants ?? 0;
  const totalOccupiedHours = occupancy?.totalOccupiedHours ?? 0;

  const distribution = occupancy?.occupancyDistribution ?? {
    EMPTY: 0,
    OCCUPIED: 0,
    STATIONARY_OCCUPANCY: 0,
    ACTIVE_OCCUPANCY: 0,
    HIGH_DENSITY: 0,
  };

  const trend = occupancy?.hourlyTrend ?? [];
  const maxTrendValue = Math.max(
    1,
    ...trend.map((t) => Math.max(t.avgOccupancy, t.peakOccupancy))
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sentinel-50 text-sentinel-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Spatial Occupancy & Utilization
              </h3>
              <p className="text-xs text-slate-500">60GHz mmWave radar target density & micro-motion</p>
            </div>
          </div>

          <ProvenanceBadge provenance={occupancy?.provenance || 'ESTIMATED'} />
        </div>

        {/* ── Key Metrics Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Utilization Rate</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {utilizationRate}%
            </span>
            <span className="text-[10px] text-slate-400">Total room-hours</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Peak Occupancy</span>
            <span className="text-xl font-black text-sentinel-700 mt-0.5 block flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-500" />
              {peakCount} <span className="text-xs font-normal text-slate-500">at {peakHour}</span>
            </span>
            <span className="text-[10px] text-slate-400">Max concurrent load</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Avg Density</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {avgOccupants}
            </span>
            <span className="text-[10px] text-slate-400">Persons per active zone</span>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <span className="text-[11px] text-slate-500 font-medium block">Occupied Hours</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {totalOccupiedHours}h
            </span>
            <span className="text-[10px] text-slate-400">Cumulative presence</span>
          </div>
        </div>

        {/* ── 24-Hour Occupancy Load Histogram ── */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sentinel-600" />
              24-Hour Hourly Occupancy Profile
            </span>
            {hoveredHour ? (
              <span className="text-sentinel-700 font-mono font-semibold animate-fade-in text-[11px]">
                {hoveredHour.hour} → Avg: {hoveredHour.avg} | Peak: {hoveredHour.peak} occupants
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Hover bars for hourly details</span>
            )}
          </div>

          {/* Bar Chart Container */}
          <div className="h-32 w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-end gap-1 relative overflow-hidden">
            {trend.map((point, idx) => {
              const heightPct = Math.max(4, Math.round((point.avgOccupancy / maxTrendValue) * 100));
              const isBusinessHour = idx >= 8 && idx <= 18;

              return (
                <div
                  key={idx}
                  onMouseEnter={() =>
                    setHoveredHour({
                      hour: point.hour,
                      avg: point.avgOccupancy,
                      peak: point.peakOccupancy,
                    })
                  }
                  onMouseLeave={() => setHoveredHour(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Visual Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isBusinessHour
                        ? 'bg-sentinel-500 hover:bg-sentinel-600 group-hover:ring-2 group-hover:ring-sentinel-300'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Hour Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* ── Spatial State Distribution Breakdown ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <span className="text-xs font-bold text-slate-700 block">Room State Breakdown</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Empty</span>
              <span className="font-bold text-slate-700 text-sm mt-0.5">{distribution.EMPTY}</span>
            </div>
            <div className="p-2 rounded-xl border border-sentinel-200 bg-sentinel-50/40 flex flex-col justify-between">
              <span className="text-[10px] text-sentinel-600 font-medium">Occupied</span>
              <span className="font-bold text-sentinel-800 text-sm mt-0.5">{distribution.OCCUPIED}</span>
            </div>
            <div className="p-2 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between">
              <span className="text-[10px] text-amber-700 font-medium">Stationary</span>
              <span className="font-bold text-amber-800 text-sm mt-0.5">
                {distribution.STATIONARY_OCCUPANCY}
              </span>
            </div>
            <div className="p-2 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
              <span className="text-[10px] text-blue-700 font-medium">Active</span>
              <span className="font-bold text-blue-800 text-sm mt-0.5">
                {distribution.ACTIVE_OCCUPANCY}
              </span>
            </div>
            <div className="p-2 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
              <span className="text-[10px] text-rose-700 font-medium">High Density</span>
              <span className="font-bold text-rose-800 text-sm mt-0.5">{distribution.HIGH_DENSITY}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Aggregated across all registered building zones
        </span>
        <span className="font-mono text-[10px] text-emerald-600 font-semibold">100% Privacy-Preserved</span>
      </div>
    </div>
  );
};
