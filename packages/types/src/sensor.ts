// ─────────────────────────────────────────────
// @sentinel/types — Sensor Catalog & Configuration
// ─────────────────────────────────────────────

import type { SensorInterface, SensorThreshold, SensorType } from './device.js';

export type SensorStatus = 'ONLINE' | 'OFFLINE' | 'CALIBRATING' | 'ERROR' | 'UNPROVISIONED';

export type SensorCategory =
  | 'PRESENCE_MOTION'
  | 'ENVIRONMENTAL'
  | 'SAFETY_HAZARD'
  | 'STRUCTURAL_POWER'
  | 'ACCESS_TELEMETRY';

export interface SensorCatalogItem {
  id: string;
  sensorType: SensorType;
  model: string;
  manufacturer: string;
  description: string;
  category: SensorCategory;
  interfaceType: SensorInterface;
  supportedInterfaces: SensorInterface[];
  defaultPin?: number;
  defaultI2cAddress?: string;
  baudRate?: number;
  operatingVoltage: string;
  defaultSamplingIntervalMs: number;
  minSamplingIntervalMs: number;
  maxSamplingIntervalMs: number;
  unit: string;
  measurementRange: {
    min: number;
    max: number;
  };
  accuracy?: string;
  pinoutGuide: string[];
  recommendedApplications: string[];
  datasheetUrl?: string;
}

export interface SensorCalibration {
  offset: number;
  multiplier: number;
  baseline: number;
  noiseFloor?: number;
  calibratedAt?: string;
  calibratedBy?: string;
}

export interface SensorReading {
  value: number | string | boolean | Record<string, unknown>;
  unit?: string;
  timestamp: string;
  confidence?: number;
}

export interface SensorDetailedConfig {
  gpioPin?: number;
  i2cAddress?: string;
  baudRate?: number;
  samplingIntervalMs: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  thresholds?: SensorThreshold[];
  filterWindowSize?: number;
  debounceMs?: number;
}

export interface SensorEntity {
  id: string;
  organizationId: string;
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  name: string;
  sensorType: SensorType;
  model: string;
  manufacturer: string;
  category: SensorCategory;
  interfaceType: SensorInterface;
  status: SensorStatus;
  enabled: boolean;
  configuration: SensorDetailedConfig;
  calibration: SensorCalibration;
  lastReading?: SensorReading;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSensorDTO {
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  name: string;
  sensorType: SensorType;
  model?: string;
  manufacturer?: string;
  interfaceType: SensorInterface;
  configuration?: Partial<SensorDetailedConfig>;
  calibration?: Partial<SensorCalibration>;
  enabled?: boolean;
}

export interface UpdateSensorDTO {
  name?: string;
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  enabled?: boolean;
  status?: SensorStatus;
}

export interface ConfigureSensorDTO {
  gpioPin?: number;
  i2cAddress?: string;
  baudRate?: number;
  samplingIntervalMs?: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  thresholds?: SensorThreshold[];
  filterWindowSize?: number;
  debounceMs?: number;
}

export interface CalibrateSensorDTO {
  offset?: number;
  multiplier?: number;
  baseline?: number;
  noiseFloor?: number;
}

export interface SensorFilterQuery {
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  sensorType?: SensorType;
  interfaceType?: SensorInterface;
  category?: SensorCategory;
  enabled?: boolean;
  status?: SensorStatus;
  q?: string;
}
