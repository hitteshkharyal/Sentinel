// ─────────────────────────────────────────────
// @sentinel/types — Device & Sensor
// ─────────────────────────────────────────────

export interface Device {
  id: string;
  deviceId: string;
  organizationId: string;
  facilityId: string;
  roomId?: string;
  name: string;
  hardwareVersion: string;
  firmwareVersion: string;
  status: DeviceStatus;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeviceStatus =
  | 'UNREGISTERED'
  | 'PROVISIONING'
  | 'ONLINE'
  | 'OFFLINE'
  | 'ERROR'
  | 'UPDATING'
  | 'DISABLED';

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
