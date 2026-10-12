// ─────────────────────────────────────────────
// @sentinel/types — Events
// ─────────────────────────────────────────────

import type { AlertSeverity } from './device.js';

export type EventType =
  | 'ROOM_OCCUPIED'
  | 'ROOM_VACANT'
  | 'HIGH_CO2'
  | 'HIGH_TEMPERATURE'
  | 'LOW_TEMPERATURE'
  | 'ABNORMAL_ACTIVITY'
  | 'ASSISTANCE_INDICATION'
  | 'PROLONGED_INACTIVITY'
  | 'AFTER_HOURS_PRESENCE'
  | 'OVERCAPACITY'
  | 'PERSON_LEFT_BEHIND'
  | 'DEVICE_OFFLINE'
  | 'SENSOR_ERROR'
  | 'ENVIRONMENTAL_ANOMALY';

export type OccupancyState =
  | 'EMPTY'
  | 'OCCUPIED'
  | 'STATIONARY_OCCUPANCY'
  | 'ACTIVE_OCCUPANCY'
  | 'HIGH_DENSITY'
  | 'UNKNOWN';

export interface SentinelEvent {
  id: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  deviceId?: string;
  eventType: EventType;
  severity: AlertSeverity;
  confidence: number;
  timestamp: string;
  inputSignals: Record<string, unknown>;
  status: EventStatus;
  description?: string;
}

export type EventStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED';

export interface OccupancySnapshot {
  roomId: string;
  estimatedOccupancy: number;
  occupancyConfidence: number;
  occupancyState: OccupancyState;
  timestamp: string;
  inputSignals: {
    pir?: boolean;
    mmwavePresence?: boolean;
    mmwaveCount?: number;
    door?: string;
    co2Trend?: 'rising' | 'falling' | 'stable';
  };
}
