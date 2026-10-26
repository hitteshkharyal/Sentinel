// ─────────────────────────────────────────────
// SENTINEL Web — Thermal Decay & Setback Drift Card
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Thermometer, Flame, Snowflake, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProvenanceBadge } from '../analytics/ProvenanceBadge';
import type { TemperaturePrediction, PredictionForecastPoint } from '@sentinel/types';

interface ThermalDecayCardProps {
  prediction?: TemperaturePrediction;
}

export const ThermalDecayCard: React.FC<ThermalDecayCardProps> = ({ prediction }) => {
  const [hoveredPoint, setHoveredPoint] = useState<PredictionForecastPoint | null>(null);

  if (!prediction) {
    return (
      <Card className="p-6 text-center text-slate-500 border-slate-800">
        Loading Thermal Decay models...
      </Card>
    );
  }

  const {
    currentTemperature,
    forecast,
    hvacSetbackDecayRate,
    predictedThermalEquilibrium,
    confidence,
    modelVersion,
  } = prediction;

  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 25, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yMin = Math.min(18, currentTemperature - 2, predictedThermalEquilibrium - 2);
  const yMax = Math.max(28, currentTemperature + 2, predictedThermalEquilibrium + 2);

  const getX = (index: number) => {
    if (forecast.length <= 1) return padding.left;
    return padding.left + (index / (forecast.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + chartHeight - ((clamped - yMin) / (yMax - yMin)) * chartHeight;
  };

  const linePoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.predictedValue)}`).join(' ');

  const upperPoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.confidenceUpper)}`);
  const lowerPoints = forecast
    .slice()
    .reverse()
    .map((p, idx) => `${getX(forecast.length - 1 - idx)},${getY(p.confidenceLower)}`);
  const confidencePolygon = [...upperPoints, ...lowerPoints].join(' ');

  const yEq = getY(predictedThermalEquilibrium);

  return (
    <Card className="p-5 border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">Setback Thermal Decay & Equilibrium Drift</h3>
                <ProvenanceBadge
                  provenance="PREDICTED"
                  tooltipText="Newtonian thermal resistance decay model modeling zone envelope insulation."
                />
              </div>
              <p className="text-xs text-slate-400">Model: {modelVersion} • Confidence: {confidence}%</p>
            </div>
          </div>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Current Temperature</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{currentTemperature.toFixed(1)}</span>
              <span className="text-xs text-slate-500">°C</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Equilibrium Baseline</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-amber-400">{predictedThermalEquilibrium.toFixed(1)}</span>
              <span className="text-xs text-slate-500">°C</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Setback Decay Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">
                {hvacSetbackDecayRate > 0 ? `+${hvacSetbackDecayRate}` : hvacSetbackDecayRate}
              </span>
              <span className="text-xs text-slate-500">°C / hr</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Thermal Drift Mode</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-200">
              {hvacSetbackDecayRate > 0 ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Warm Drift (Summer)</span>
                </>
              ) : (
                <>
                  <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cool Drift (Winter)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SVG Thermal Curve */}
        <div className="relative bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
          <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              Thermal Decay Trajectory with Confidence Band
            </span>
            <span className="text-slate-500">Horizon: {forecast.length} Hours</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Grid */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#334155" strokeOpacity="0.6" />

            {/* Equilibrium line */}
            {yEq >= padding.top && yEq <= padding.top + chartHeight && (
              <g>
                <line x1={padding.left} y1={yEq} x2={width - padding.right} y2={yEq} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
                <text x={width - padding.right - 4} y={yEq - 4} fill="#fbbf24" fontSize="9" textAnchor="end" fontWeight="600">
                  {predictedThermalEquilibrium.toFixed(1)}°C Equilibrium
                </text>
              </g>
            )}

            {/* Confidence Polygon */}
            <polygon points={confidencePolygon} fill="#f59e0b" fillOpacity="0.12" />

            {/* Dashed boundary lines */}
            <polyline points={upperPoints.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
            <polyline points={lowerPoints.slice().reverse().join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />

            {/* Line */}
            <polyline points={linePoints} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points */}
            {forecast.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.predictedValue);
              const isHovered = hoveredPoint?.timestamp === p.timestamp;
              return (
                <g key={p.timestamp} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : idx % 3 === 0 ? 3 : 2}
                    fill={isHovered ? '#ffffff' : '#f59e0b'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                  />
                  <rect x={cx - 10} y={padding.top} width="20" height={chartHeight} fill="transparent" className="cursor-pointer" />
                </g>
              );
            })}

            {/* Y Axis Labels */}
            <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end">
              {yMax.toFixed(0)}°C
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end">
              {((yMax + yMin) / 2).toFixed(0)}°C
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight + 2} fill="#64748b" fontSize="9" textAnchor="end">
              {yMin.toFixed(0)}°C
            </text>

            {/* X Axis Time Labels */}
            {forecast.map((p, idx) => {
              if (idx % Math.ceil(forecast.length / 5) !== 0 && idx !== forecast.length - 1) return null;
              const dateStr = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <text key={p.timestamp} x={getX(idx)} y={height - 8} fill="#64748b" fontSize="9" textAnchor="middle">
                  {dateStr}
                </text>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-xs backdrop-blur-sm pointer-events-none">
              <div className="text-slate-400 font-medium">
                {new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-amber-400 font-bold text-sm mt-0.5">
                {hoveredPoint.predictedValue.toFixed(1)}°C
              </div>
              <div className="text-slate-500 text-[10px]">
                Confidence: {hoveredPoint.confidence}% • Range: [{hoveredPoint.confidenceLower.toFixed(1)} - {hoveredPoint.confidenceUpper.toFixed(1)}°C]
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          Predicts thermal recovery duration needed when exiting autonomous HVAC_ECO setback
        </span>
        <span className="font-mono text-[11px] text-slate-500">{modelVersion}</span>
      </div>
    </Card>
  );
};
