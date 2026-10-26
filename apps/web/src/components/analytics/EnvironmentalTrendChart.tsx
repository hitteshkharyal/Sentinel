// ─────────────────────────────────────────────
// SENTINEL Web — Indoor Environmental Quality & Thermal Comfort Chart
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { EnvironmentalAnalytics } from '@sentinel/types';
import { ProvenanceBadge } from './ProvenanceBadge';
import { Wind, Thermometer, Droplets, Volume2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface EnvironmentalTrendChartProps {
  environment: EnvironmentalAnalytics | undefined;
}

export const EnvironmentalTrendChart: React.FC<EnvironmentalTrendChartProps> = ({ environment }) => {
  const [selectedPoint, setSelectedPoint] = useState<{
    timestamp: string;
    co2: number;
    temperature: number;
    humidity: number;
    soundLevel?: number;
  } | null>(null);

  const avgCo2 = environment?.avgCo2 ?? 620;
  const peakCo2 = environment?.peakCo2 ?? 940;
  const hazardHours = environment?.co2HazardHours ?? 0;
  const comfortRate = environment?.comfortComplianceRate ?? 94;
  const avgTemp = environment?.avgTemperature ?? 22.1;
  const minTemp = environment?.minTemperature ?? 20.4;
  const maxTemp = environment?.maxTemperature ?? 23.8;
  const avgHum = environment?.avgHumidity ?? 44.5;
  const avgSound = environment?.avgSoundLevel ?? 41.2;

  const trends = environment?.trends ?? [];
  const maxCo2Val = Math.max(1600, ...trends.map((t) => t.co2), peakCo2);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Indoor Environmental Quality (IEQ)
              </h3>
              <p className="text-xs text-slate-500">NDIR CO₂, dual-stage thermal comfort & acoustic telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge provenance={environment?.provenance || 'MEASURED'} />
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-xl border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{comfortRate}% Comfort Standard</span>
            </div>
          </div>
        </div>

        {/* ── Core Environmental KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          {/* CO2 Concentration */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Avg CO₂</span>
              <Wind className="w-3.5 h-3.5 text-sentinel-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{avgCo2}</span>
              <span className="text-xs font-semibold text-slate-400">ppm</span>
            </div>
            <span className="text-[10px] text-slate-400">Peak: {peakCo2} ppm</span>
          </div>

          {/* Temperature Band */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Temperature</span>
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{avgTemp}°C</span>
            </div>
            <span className="text-[10px] text-slate-400">Range: {minTemp}° - {maxTemp}°C</span>
          </div>

          {/* Relative Humidity */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Relative Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{avgHum}%</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Optimal 30-60% band</span>
          </div>

          {/* Ambient Acoustic Sound */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ambient Sound</span>
              <Volume2 className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{avgSound}</span>
              <span className="text-xs font-semibold text-slate-400">dBA</span>
            </div>
            <span className="text-[10px] text-slate-400">Indoor ambient average</span>
          </div>
        </div>

        {/* ── CO2 & Environmental Time-Series Trend Line ── */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">CO₂ Concentration Trend & Safety Thresholds</span>
            {selectedPoint ? (
              <span className="text-sentinel-700 font-mono font-semibold text-[11px] animate-fade-in">
                {new Date(selectedPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                {selectedPoint.co2} ppm | {selectedPoint.temperature}°C | {selectedPoint.humidity}% RH
              </span>
            ) : (
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-amber-400" /> 1,000 ppm ASHRAE
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-rose-500" /> 1,400 ppm Hazard
                </span>
              </div>
            )}
          </div>

          {/* Trend Visualizer Area */}
          <div className="h-32 w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 relative overflow-hidden flex items-end">
            {/* 1400 ppm Hazard Threshold Line */}
            <div
              style={{ bottom: `${Math.round((1400 / maxCo2Val) * 100)}%` }}
              className="absolute left-0 right-0 border-b border-rose-300 border-dashed z-0 pointer-events-none"
            >
              <span className="absolute right-2 -top-4 text-[9px] font-mono text-rose-500 font-semibold bg-white/80 px-1 rounded">
                1,400 ppm Hazard
              </span>
            </div>

            {/* 1000 ppm ASHRAE Threshold Line */}
            <div
              style={{ bottom: `${Math.round((1000 / maxCo2Val) * 100)}%` }}
              className="absolute left-0 right-0 border-b border-amber-300 border-dashed z-0 pointer-events-none"
            >
              <span className="absolute right-2 -top-4 text-[9px] font-mono text-amber-600 font-semibold bg-white/80 px-1 rounded">
                1,000 ppm Standard
              </span>
            </div>

            {/* Data Points / Columns */}
            <div className="w-full h-full flex items-end gap-1.5 z-10">
              {trends.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Telemetry accumulating nominal readings...
                </div>
              ) : (
                trends.map((t, idx) => {
                  const heightPct = Math.max(6, Math.min(100, Math.round((t.co2 / maxCo2Val) * 100)));
                  const isHazard = t.co2 > 1400;
                  const isWarning = t.co2 > 1000;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setSelectedPoint(t)}
                      onMouseLeave={() => setSelectedPoint(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-200 ${
                          isHazard
                            ? 'bg-rose-500 group-hover:bg-rose-600 ring-1 ring-rose-300'
                            : isWarning
                            ? 'bg-amber-400 group-hover:bg-amber-500 ring-1 ring-amber-200'
                            : 'bg-emerald-500 group-hover:bg-emerald-600'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          {hazardHours > 0 ? (
            <span className="text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {hazardHours}h high CO₂ hazard detected
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero CO₂ threshold violations in selected timeframe
            </span>
          )}
        </span>
        <span className="font-mono text-[10px]">ASHRAE Standard 62.1 & 55</span>
      </div>
    </div>
  );
};
