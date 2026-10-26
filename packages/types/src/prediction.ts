// ─────────────────────────────────────────────
// @sentinel/types — Prediction Layer & Statistical Anomaly Detection
// Master Prompt Section 41 & Section 48 Day 13
// ─────────────────────────────────────────────

import type { MetricProvenance } from './analytics.js';

export type ForecastHorizonHours = 1 | 6 | 12 | 24 | 48 | 72;

export interface PredictionForecastPoint {
  timestamp: string; // ISO date string of forecasted moment
  predictedValue: number;
  confidenceLower: number; // lower confidence bound (e.g. 95% CI)
  confidenceUpper: number; // upper confidence bound (e.g. 95% CI)
  confidence: number; // percentage (0 - 100)
  provenance: MetricProvenance; // Always 'PREDICTED'
}

export type HazardRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Co2Prediction {
  provenance: MetricProvenance; // 'PREDICTED'
  currentValue: number;
  forecast: PredictionForecastPoint[];
  predictedPeak: number;
  predictedPeakTime: string;
  hazardRisk: HazardRiskLevel;
  timeToHazardThresholdMinutes: number | null; // minutes until > 1400 ppm, or null if safe
  confidence: number; // Overall forecast confidence %
  modelVersion: string; // e.g. "sentinel-co2-forecast-v1.0"
  inputWindow: string; // e.g. "24h"
  timestamp: string; // Prediction generation timestamp
}

export interface OccupancyPrediction {
  provenance: MetricProvenance; // 'PREDICTED'
  currentOccupancy: number;
  forecast: PredictionForecastPoint[];
  predictedPeakHour: string; // e.g. "14:00"
  predictedPeakHeadcount: number;
  recommendedPreCoolingTime: string | null; // e.g. "12:45" (15-30m prior to predicted surge)
  confidence: number;
  modelVersion: string;
  inputWindow: string;
  timestamp: string;
}

export interface TemperaturePrediction {
  provenance: MetricProvenance; // 'PREDICTED'
  currentTemperature: number;
  forecast: PredictionForecastPoint[];
  hvacSetbackDecayRate: number; // °C per hour
  predictedThermalEquilibrium: number; // Expected room temp under steady setback
  confidence: number;
  modelVersion: string;
  inputWindow: string;
  timestamp: string;
}

export type AnomalyType =
  | 'CO2_SPIKE'
  | 'THERMAL_RUNAWAY'
  | 'OFF_HOURS_OCCUPANCY'
  | 'SENSOR_STUCK'
  | 'HIGH_NOISE'
  | 'CORRELATED_SPIKE';

export type AnomalySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DetectedAnomaly {
  id: string;
  roomId?: string;
  roomName?: string;
  facilityId?: string;
  facilityName?: string;
  deviceId?: string;
  sensorType: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  score: number; // Z-score or deviation metric (e.g. 3.4 standard deviations)
  observedValue: number;
  expectedValue: number;
  detectedAt: string;
  explanation: string;
  confidence: number;
  modelVersion: string;
}

export interface PredictionOverview {
  provenance: MetricProvenance; // 'PREDICTED'
  facilityId?: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  co2: Co2Prediction;
  occupancy: OccupancyPrediction;
  temperature: TemperaturePrediction;
  anomalies: DetectedAnomaly[];
  generatedAt: string;
}

export interface PredictionFilterQuery {
  organizationId?: string;
  facilityId?: string;
  roomId?: string;
  horizonHours?: ForecastHorizonHours;
  inputWindow?: string;
}
