// ─────────────────────────────────────────────
// @sentinel/types — Telemetry
// ─────────────────────────────────────────────

export interface TelemetryMessage {
  deviceId: string;
  timestamp: string;
  sensors: TelemetrySensorData;
}

export interface TelemetrySensorData {
  pir?: boolean;
  mmwave?: MmwaveData;
  co2?: number;
  temperature?: number;
  humidity?: number;
  soundLevel?: number;
  door?: DoorState;
  pressure?: number;
  light?: number;
  smoke?: boolean;
  gas?: number;
  flame?: boolean;
  waterLeak?: boolean;
  vibration?: number;
  ultrasonic?: number;
  current?: number;
  gps?: GpsData;
}

export interface MmwaveData {
  presence: boolean;
  count?: number;
  distance?: number;
}

export type DoorState = 'open' | 'closed';

export interface GpsData {
  latitude: number;
  longitude: number;
  speed?: number;
}

export interface ValidatedTelemetry extends TelemetryMessage {
  organizationId: string;
  facilityId: string;
  roomId?: string;
  receivedAt: string;
  valid: boolean;
  validationErrors?: string[];
}
