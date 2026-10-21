// ─────────────────────────────────────────────
// @sentinel/types — Telemetry & MQTT Communication
// ─────────────────────────────────────────────

export interface TelemetryMessage {
  deviceId: string;
  timestamp: string;
  sensors: TelemetrySensorData;
  metadata?: TelemetryDeviceMetadata;
}

export interface TelemetryDeviceMetadata {
  wifiRssiDbm?: number;
  freeHeapBytes?: number;
  batteryPercent?: number;
  uptimeSeconds?: number;
  ipAddress?: string;
  firmwareVersion?: string;
  [key: string]: unknown;
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
  smoke?: boolean | number;
  gas?: number;
  flame?: boolean;
  waterLeak?: boolean;
  vibration?: number;
  ultrasonic?: number;
  current?: number;
  gps?: GpsData;
  rfid?: RfidData;
  [key: string]: unknown;
}

export interface MmwaveData {
  presence: boolean;
  count?: number;
  distance?: number;
  energy?: number;
  stationaryConfidence?: number;
  movementConfidence?: number;
}

export type DoorState = 'open' | 'closed';

export interface GpsData {
  latitude: number;
  longitude: number;
  speed?: number;
  altitude?: number;
  satellites?: number;
}

export interface RfidData {
  uid: string;
  tagType?: string;
}

export interface ValidatedTelemetry extends TelemetryMessage {
  id: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  receivedAt: string;
  valid: boolean;
  validationErrors?: string[];
}

export interface TelemetryEntity {
  id: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  deviceId: string;
  timestamp: string;
  receivedAt: string;
  sensors: TelemetrySensorData;
  valid: boolean;
  validationErrors?: string[];
  metadata?: TelemetryDeviceMetadata;
  createdAt: string;
}

export interface TelemetryFilterQuery {
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  sensorType?: string;
  validOnly?: boolean;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

export interface TelemetryStats {
  totalMessages: number;
  validMessages: number;
  invalidMessages: number;
  lastMessageAt?: string;
  messagesPerMinute: number;
}

export interface MqttTopicContext {
  orgId: string;
  facilityId: string;
  deviceId: string;
  channel: 'telemetry' | 'status' | 'command' | 'config' | 'ack';
}

export interface DeviceCommandPayload {
  commandId: string;
  command: 'REBOOT' | 'CALIBRATE' | 'SET_INTERVAL' | 'TRIGGER_ACTUATOR' | 'REQUEST_STATUS' | string;
  params?: Record<string, unknown>;
  sentAt: string;
  targetDeviceId: string;
}

export interface DeviceCommandResponse {
  commandId: string;
  deviceId: string;
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
  timestamp: string;
  error?: string;
}
