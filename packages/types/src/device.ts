// ─────────────────────────────────────────────
// @sentinel/types — Device & Microcontroller Identity
// ─────────────────────────────────────────────

export type DeviceStatus =
  | 'UNREGISTERED'
  | 'PROVISIONING'
  | 'ONLINE'
  | 'OFFLINE'
  | 'ERROR'
  | 'UPDATING'
  | 'DISABLED';

export type ChipModel =
  | 'ESP32-WROOM-32D'
  | 'ESP32-WROOM-32U'
  | 'ESP32-S3-WROOM-1'
  | 'ESP32-C3-MINI'
  | 'ESP32-CAM'
  | 'ESP32-GENERIC';

export type PowerSource = 'MAINS' | 'BATTERY' | 'POE' | 'USB';

export interface DeviceMetadata {
  flashSizeBytes?: number;
  freeHeapBytes?: number;
  wifiRssiDbm?: number;
  cpuFreqMhz?: number;
  powerSource?: PowerSource;
  batteryPercent?: number;
  uptimeSeconds?: number;
  lastResetReason?: string;
  [key: string]: unknown;
}

export interface Device {
  id: string;
  deviceId: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  name: string;
  macAddress: string;
  chipModel: ChipModel;
  hardwareVersion: string;
  firmwareVersion: string;
  status: DeviceStatus;
  ipAddress?: string;
  metadata: DeviceMetadata;
  assignedSensorsCount: number;
  lastSeenAt?: string;
  lastHeartbeatAt?: string;
  lastError?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CredentialType = 'API_KEY' | 'HMAC_KEY' | 'PRESHARED_TOKEN';
export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DeviceCredential {
  id: string;
  deviceId: string;
  credentialType: CredentialType;
  keyPrefix: string;
  lastRotatedAt: string;
  expiresAt?: string;
  status: CredentialStatus;
}

export interface DeviceRegistrationCredentials {
  deviceId: string;
  token: string;
  mqttClientId: string;
  mqttTopicPrefix: string;
  expiresAt?: string;
}

export interface RegisterDeviceDTO {
  deviceId: string;
  name: string;
  macAddress: string;
  chipModel?: ChipModel;
  hardwareVersion: string;
  firmwareVersion?: string;
  facilityId: string;
  roomId?: string;
  powerSource?: PowerSource;
}

export interface DeviceRegistrationResponse {
  device: Device;
  credentials: DeviceRegistrationCredentials;
}

export interface UpdateDeviceDTO {
  name?: string;
  status?: DeviceStatus;
  firmwareVersion?: string;
  facilityId?: string;
  roomId?: string | null;
  metadata?: Partial<DeviceMetadata>;
}

export interface AssignDeviceDTO {
  facilityId: string;
  roomId?: string | null;
}

export interface DeviceHeartbeatDTO {
  firmwareVersion?: string;
  ipAddress?: string;
  wifiRssiDbm?: number;
  freeHeapBytes?: number;
  uptimeSeconds?: number;
  batteryPercent?: number;
  status?: DeviceStatus;
  error?: string;
}

export interface RotateDeviceSecretDTO {
  reason?: string;
}

export interface DeviceFilterQuery {
  facilityId?: string;
  roomId?: string;
  status?: DeviceStatus;
  search?: string;
  chipModel?: ChipModel;
}

export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  provisioning: number;
  error: number;
  disabled: number;
}

// ── Backwards-compatible Sensor definitions ──
export interface Sensor {
  id: string;
  deviceId: string;
  organizationId: string;
  sensorType: SensorType;
  model?: string;
  manufacturer?: string;
  interfaceType: SensorInterface;
  enabled: boolean;
  configuration: SensorConfiguration;
  createdAt: string;
  updatedAt: string;
}

export type SensorType =
  | 'PIR'
  | 'MMWAVE'
  | 'CO2'
  | 'TEMPERATURE'
  | 'HUMIDITY'
  | 'SOUND_LEVEL'
  | 'DOOR_MAGNETIC'
  | 'PRESSURE'
  | 'LIGHT'
  | 'SMOKE'
  | 'GAS'
  | 'FLAME'
  | 'WATER_LEAK'
  | 'VIBRATION'
  | 'ULTRASONIC'
  | 'CURRENT'
  | 'GPS'
  | 'RFID';

export type SensorInterface =
  | 'GPIO'
  | 'ADC'
  | 'PWM'
  | 'I2C'
  | 'SPI'
  | 'UART'
  | 'WIFI'
  | 'MQTT';

export interface SensorConfiguration {
  gpioPin?: number;
  i2cAddress?: string;
  samplingIntervalMs: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  thresholds?: SensorThreshold[];
  calibrationOffset?: number;
}

export interface SensorThreshold {
  name: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
  severity: AlertSeverity;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
