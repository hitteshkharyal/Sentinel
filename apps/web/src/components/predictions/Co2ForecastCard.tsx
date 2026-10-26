// ─────────────────────────────────────────────
// SENTINEL Web — CO2 Forecast & Accumulation Model Card
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Wind, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProvenanceBadge } from '../analytics/ProvenanceBadge';
import type { Co2Prediction, PredictionForecastPoint } from '@sentinel/types';

interface Co2ForecastCardProps {
  prediction?: Co2Prediction;
}

export const Co2ForecastCard: React.FC<Co2ForecastCardProps> = ({ prediction }) => {
  const [hoveredPoint, setHoveredPoint] = useState<PredictionForecastPoint | null>(null);

  if (!prediction) {
    return (
      <Card className="p-6 text-center text-slate-500 border-slate-800">
        Loading CO₂ predictive models...
      </Card>
    );
  }

  const {
    currentValue,
    forecast,
    predictedPeak,
    predictedPeakTime,
    hazardRisk,
    timeToHazardThresholdMinutes,
    confidence,
    modelVersion,
  } = prediction;

  const riskBadgeVariant =
    hazardRisk === 'CRITICAL'
      ? 'danger'
      : hazardRisk === 'HIGH'
      ? 'danger'
      : hazardRisk === 'MODERATE'
      ? 'warning'
      : 'success';

  // SVG Chart Dimensions
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 25, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yMin = 350;
  const yMax = Math.max(1600, predictedPeak + 150);

  const getX = (index: number) => {
    if (forecast.length <= 1) return padding.left;
    return padding.left + (index / (forecast.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + chartHeight - ((clamped - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Build forecast line path
  const linePoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.predictedValue)}`).join(' ');

  // Build confidence band polygon (upper forward, lower backwards)
  const upperPoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.confidenceUpper)}`);
  const lowerPoints = forecast
    .slice()
    .reverse()
    .map((p, idx) => `${getX(forecast.length - 1 - idx)},${getY(p.confidenceLower)}`);
  const confidencePolygon = [...upperPoints, ...lowerPoints].join(' ');

  const y1000 = getY(1000);
  const y1400 = getY(1400);

  const peakDateFormatted = new Date(predictedPeakTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="p-5 border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">CO₂ Accumulation & Dispersion Forecast</h3>
                <ProvenanceBadge provenance="PREDICTED" tooltipText="Derived from mass-balance ventilation model & circadian load." />
              </div>
              <p className="text-xs text-slate-400">Model: {modelVersion} • Confidence: {confidence}%</p>
            </div>
          </div>

          <Badge variant={riskBadgeVariant} className="text-xs gap-1">
            {hazardRisk === 'CRITICAL' || hazardRisk === 'HIGH' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Risk: {hazardRisk}
          </Badge>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Current Reading</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{currentValue}</span>
              <span className="text-xs text-slate-500">ppm</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Predicted Peak</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${predictedPeak >= 1400 ? 'text-rose-400' : predictedPeak >= 1000 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {predictedPeak}
              </span>
              <span className="text-xs text-slate-500">ppm</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Peak Anticipated At</span>
            <div className="flex items-center gap-1.5 mt-1 text-slate-100 font-bold text-base">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>{peakDateFormatted}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Hazard Threshold</span>
            <div className="mt-1">
              {timeToHazardThresholdMinutes ? (
                <span className="text-sm font-semibold text-rose-400">
                  Breach in ~{timeToHazardThresholdMinutes} min
                </span>
              ) : (
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> No Hazard ({`<1,400 ppm`})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SVG Forecast Graph */}
        <div className="relative bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
          <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              Predicted Trajectory with 95% Confidence Band
            </span>
            <span className="text-slate-500">Horizon: {forecast.length} Hours</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Grid Lines */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#334155" strokeOpacity="0.6" />

            {/* Threshold line 1,000 ppm warning */}
            {y1000 >= padding.top && y1000 <= padding.top + chartHeight && (
              <g>
                <line x1={padding.left} y1={y1000} x2={width - padding.right} y2={y1000} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.75" />
                <text x={width - padding.right - 4} y={y1000 - 4} fill="#f59e0b" fontSize="9" textAnchor="end" fontWeight="600">
                  1,000 ppm Standard
                </text>
              </g>
            )}

            {/* Threshold line 1,400 ppm hazard */}
            {y1400 >= padding.top && y1400 <= padding.top + chartHeight && (
              <g>
                <line x1={padding.left} y1={y1400} x2={width - padding.right} y2={y1400} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.85" />
                <text x={width - padding.right - 4} y={y1400 - 4} fill="#f43f5e" fontSize="9" textAnchor="end" fontWeight="700">
                  1,400 ppm Hazard
                </text>
              </g>
            )}

            {/* Confidence Band Polygon */}
            <polygon points={confidencePolygon} fill="#10b981" fillOpacity="0.12" />

            {/* Upper and Lower Boundary Dashed Lines */}
            <polyline points={upperPoints.join(' ')} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
            <polyline points={lowerPoints.slice().reverse().join(' ')} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />

            {/* Center Predicted Value Line */}
            <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

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
                    fill={isHovered ? '#ffffff' : '#10b981'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                  />
                  {/* Invisible hit area */}
                  <rect x={cx - 10} y={padding.top} width="20" height={chartHeight} fill="transparent" className="cursor-pointer" />
                </g>
              );
            })}

            {/* Y Axis Labels */}
            <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end">
              {Math.round(yMax)}
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end">
              {Math.round((yMax + yMin) / 2)}
            </text>
            <text x={padding.left - 6} y={padding.top + chartHeight + 2} fill="#64748b" fontSize="9" textAnchor="end">
              {yMin}
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
              <div className="text-emerald-400 font-bold text-sm mt-0.5">
                {hoveredPoint.predictedValue} ppm
              </div>
              <div className="text-slate-500 text-[10px]">
                95% CI: [{hoveredPoint.confidenceLower} - {hoveredPoint.confidenceUpper} ppm]
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Proactive ventilation setback override recommended if projected CO₂ {`>`} 1,100 ppm
        </span>
        <span className="font-mono text-[11px] text-slate-500">{modelVersion}</span>
      </div>
    </Card>
  );
};
