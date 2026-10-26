// ─────────────────────────────────────────────
// SENTINEL Web — Occupancy Prediction & Pre-Cooling Advisory Card
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Users, Clock, Zap, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProvenanceBadge } from '../analytics/ProvenanceBadge';
import type { OccupancyPrediction, PredictionForecastPoint } from '@sentinel/types';

interface OccupancyForecastCardProps {
  prediction?: OccupancyPrediction;
}

export const OccupancyForecastCard: React.FC<OccupancyForecastCardProps> = ({ prediction }) => {
  const [hoveredPoint, setHoveredPoint] = useState<PredictionForecastPoint | null>(null);

  if (!prediction) {
    return (
      <Card className="p-6 text-center text-slate-500 border-slate-800">
        Loading Occupancy predictive models...
      </Card>
    );
  }

  const {
    currentOccupancy,
    forecast,
    predictedPeakHour,
    predictedPeakHeadcount,
    recommendedPreCoolingTime,
    confidence,
    modelVersion,
  } = prediction;

  // SVG Chart Dimensions
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 25, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yMax = Math.max(5, Math.ceil(predictedPeakHeadcount + 2));
  const yMin = 0;

  const getX = (index: number) => {
    if (forecast.length <= 1) return padding.left;
    return padding.left + (index / (forecast.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + chartHeight - (clamped / yMax) * chartHeight;
  };

  const linePoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.predictedValue)}`).join(' ');

  // Confidence band
  const upperPoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.confidenceUpper)}`);
  const lowerPoints = forecast
    .slice()
    .reverse()
    .map((p, idx) => `${getX(forecast.length - 1 - idx)},${getY(p.confidenceLower)}`);
  const confidencePolygon = [...upperPoints, ...lowerPoints].join(' ');

  return (
    <Card className="p-5 border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">Occupancy Load & Headcount Forecast</h3>
                <ProvenanceBadge
                  provenance="PREDICTED"
                  tooltipText="Harmonic circadian blending of radar/PIR fusion history and diurnal curves."
                />
              </div>
              <p className="text-xs text-slate-400">Model: {modelVersion} • Confidence: {confidence}%</p>
            </div>
          </div>

          {recommendedPreCoolingTime && (
            <Badge variant="primary" className="text-xs gap-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Pre-Cool Advisory: {recommendedPreCoolingTime}
            </Badge>
          )}
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Current Headcount</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{currentOccupancy}</span>
              <span className="text-xs text-slate-500">occupants</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Predicted Peak Load</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-indigo-400">{predictedPeakHeadcount}</span>
              <span className="text-xs text-slate-500">occupants</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Anticipated Peak Hour</span>
            <div className="flex items-center gap-1.5 mt-1 text-slate-100 font-bold text-base">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{predictedPeakHour}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Optimal Pre-Cooling</span>
            <div className="mt-1">
              {recommendedPreCoolingTime ? (
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> {recommendedPreCoolingTime}
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-medium">Nominal (No Surge)</span>
              )}
            </div>
          </div>
        </div>

        {/* SVG Occupancy Curve */}
        <div className="relative bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
          <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
              Predicted Occupancy Trajectory with Confidence Corridor
            </span>
            <span className="text-slate-500">Horizon: {forecast.length} Hours</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Grid Lines */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#334155" strokeOpacity="0.6" />

            {/* Confidence Polygon */}
            <polygon points={confidencePolygon} fill="#6366f1" fillOpacity="0.14" />

            {/* Upper and Lower dashed lines */}
            <polyline points={upperPoints.join(' ')} fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
            <polyline points={lowerPoints.slice().reverse().join(' ')} fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />

            {/* Center Predicted Value Line */}
            <polyline points={linePoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Interactive Data Points */}
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
                    fill={isHovered ? '#ffffff' : '#6366f1'}
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
              {yMax}
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end">
              {Math.round(yMax / 2)}
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight + 2} fill="#64748b" fontSize="9" textAnchor="end">
              0
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
              <div className="text-indigo-400 font-bold text-sm mt-0.5">
                {hoveredPoint.predictedValue} Occupants
              </div>
              <div className="text-slate-500 text-[10px]">
                Confidence: {hoveredPoint.confidence}% • Range: [{hoveredPoint.confidenceLower} - {hoveredPoint.confidenceUpper}]
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Pre-cooling advisory automatically conditions spaces 30-45m ahead of recurring occupancy surge
        </span>
        <span className="font-mono text-[11px] text-slate-500">{modelVersion}</span>
      </div>
    </Card>
  );
};
