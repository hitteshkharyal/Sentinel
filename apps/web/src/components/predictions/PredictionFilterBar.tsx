// ─────────────────────────────────────────────
// SENTINEL Web — Prediction Filter Bar
// ─────────────────────────────────────────────

import React from 'react';
import { Clock, RefreshCw, SlidersHorizontal, BrainCircuit } from 'lucide-react';
import { usePrediction } from '../../context/PredictionContext';
import { Button } from '../ui/Button';
import type { ForecastHorizonHours } from '@sentinel/types';

export const PredictionFilterBar: React.FC = () => {
  const {
    horizonHours,
    setHorizonHours,
    inputWindow,
    setInputWindow,
    isLoading,
    refreshPredictions,
    overview,
  } = usePrediction();

  const horizons: { label: string; value: ForecastHorizonHours }[] = [
    { label: '6h Forecast', value: 6 },
    { label: '12h Forecast', value: 12 },
    { label: '24h Horizon', value: 24 },
    { label: '48h Extended', value: 48 },
  ];

  const windows = [
    { label: '24h History', value: '24h' },
    { label: '7d History', value: '7d' },
    { label: '30d History', value: '30d' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0 pl-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Forecast Horizon:
        </span>
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 shrink-0">
          {horizons.map((h) => {
            const active = horizonHours === h.value;
            return (
              <button
                key={h.value}
                onClick={() => setHorizonHours(h.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Training Window:</span>
          <select
            value={inputWindow}
            onChange={(e) => setInputWindow(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {windows.map((w) => (
              <option key={w.value} value={w.value} className="bg-slate-900 text-slate-200">
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {overview?.roomName && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Target: {overview.roomName}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshPredictions()}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs text-slate-300 border-slate-700 hover:border-slate-600"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="hidden sm:inline">Refresh Models</span>
        </Button>
      </div>
    </div>
  );
};
