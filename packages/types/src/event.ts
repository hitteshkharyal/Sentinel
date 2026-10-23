// ─────────────────────────────────────────────
// @sentinel/types — Events & Sensor Fusion
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

export type EventStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED' | 'DISMISSED';

export interface SentinelEvent {
  id: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  deviceId?: string;
  facilityName?: string;
  roomName?: string;
  deviceName?: string;
  eventType: EventType;
  severity: AlertSeverity;
  confidence: number;
  timestamp: string;
  inputSignals: Record<string, unknown>;
  status: EventStatus;
  title: string;
  description: string;
  recommendation?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

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
    soundLevel?: number;
    co2Trend?: 'rising' | 'falling' | 'stable';
    temperature?: number;
  };
}

export interface EventFilterQuery {
  organizationId?: string;
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  eventType?: EventType | string;
  severity?: AlertSeverity | string;
  status?: EventStatus | string;
  startTime?: string;
  endTime?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EventStats {
  totalEvents: number;
  activeEvents: number;
  criticalEvents: number;
  acknowledgedEvents: number;
  resolvedToday: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
}

export interface UpdateEventStatusDTO {
  status: EventStatus;
  notes?: string;
}

export interface EvaluateEventDTO {
  roomId: string;
  deviceId?: string;
  timestamp?: string;
  signals: Record<string, unknown>;
}

export interface SensorFusionResult {
  occupancy: OccupancySnapshot;
  triggeredEvents: SentinelEvent[];
}
