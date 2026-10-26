// ─────────────────────────────────────────────
// SENTINEL Web — Predictions & Forward Intelligence Page
// Master Prompt Section 41 & Section 48 Day 13
// ─────────────────────────────────────────────

import React from 'react';
import { BrainCircuit, AlertCircle, RefreshCw } from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';
import { PredictionDisclaimerBanner } from '../components/predictions/PredictionDisclaimerBanner';
import { PredictionFilterBar } from '../components/predictions/PredictionFilterBar';
import { Co2ForecastCard } from '../components/predictions/Co2ForecastCard';
import { OccupancyForecastCard } from '../components/predictions/OccupancyForecastCard';
import { ThermalDecayCard } from '../components/predictions/ThermalDecayCard';
import { AnomalyDetectionMatrix } from '../components/predictions/AnomalyDetectionMatrix';
import { Button } from '../components/ui/Button';

export const PredictionsPage: React.FC = () => {
  const { overview, isLoading, error, refreshPredictions } = usePrediction();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/10">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Predictive Intelligence & Anomaly Layer
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Mass-balance CO₂ forecasting, circadian occupancy load modeling, setback thermal decay, and multi-sensor anomaly detection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Epistemological Integrity Banner (Section 41) */}
      <PredictionDisclaimerBanner />

      {/* Model Controls & Horizon Switcher */}
      <PredictionFilterBar />

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Failed to compute predictive models: {error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshPredictions()}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Predictive Cards Grid */}
      <div className="space-y-6">
        {/* Row 1: CO2 Accumulation & Dispersion Forecast */}
        <Co2ForecastCard prediction={overview?.co2} />

        {/* Row 2: Occupancy Headcount Forecast & Thermal Decay Drift */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OccupancyForecastCard prediction={overview?.occupancy} />
          <ThermalDecayCard prediction={overview?.temperature} />
        </div>

        {/* Row 3: Multi-Sensor Anomaly Detection Matrix */}
        <AnomalyDetectionMatrix anomalies={overview?.anomalies} />
      </div>

      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/90 text-white shadow-xl backdrop-blur-sm text-xs font-semibold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Synthesizing Machine Learning Projections...</span>
        </div>
      )}
    </div>
  );
};

export default PredictionsPage;
