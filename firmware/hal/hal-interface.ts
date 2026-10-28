// ─────────────────────────────────────────────
// SENTINEL Firmware — HAL Interface Definitions
// ─────────────────────────────────────────────

/**
 * Hardware Abstraction Layer (HAL) — Sensor Interface Contract
 *
 * Every sensor driver must implement these lifecycle methods:
 *
 *   init(config)     → Initialize sensor hardware registers and bus
 *   read()           → Read current validated sensor values
 *   health()         → Verify bus response, ACK, and peripheral connectivity
 *   deinit()         → Release sensor resources and return actuators to safe state
 *
 * Supported sensor HAL modules:
 *
 *   hal_pir        — Passive Infrared (GPIO digital)
 *   hal_mmwave     — mmWave presence/count (UART 60GHz)
 *   hal_co2        — CO₂ concentration (I2C Sensirion SCD30/SCD40)
 *   hal_temperature — Temperature (I2C Sensirion SHT31)
 *   hal_humidity   — Humidity (I2C Sensirion SHT31)
 *   hal_sound      — Sound level (ADC analog SPL)
 *   hal_door       — Magnetic door sensor (GPIO digital pull-up)
 *   hal_pressure   — Barometric pressure (I2C Bosch BMP280)
 *   hal_light      — Light level (I2C Rohm BH1750 / ADC)
 *   hal_relay      — Relay actuator control (GPIO digital fail-secure)
 */

export interface HalSensorConfig {
  sensorType: string;
  interfaceType: 'GPIO' | 'ADC' | 'PWM' | 'I2C' | 'SPI' | 'UART';
  pin?: number;
  i2cAddress?: number;
  baudRate?: number;
  samplingIntervalMs: number;
  calibrationOffset?: number;
  calibrationMultiplier?: number;
  activeHigh?: boolean;
}

export interface HalSensorReading<T = number | boolean | Record<string, unknown>> {
  sensorType: string;
  value: T;
  timestamp: number;
  healthy: boolean;
  error?: string;
}

export interface MmwaveReadingPayload {
  presence: boolean;
  count: number;
  distance: number;
  energy: number;
  stationaryConfidence: number;
  movementConfidence: number;
}

export interface TempHumidityReadingPayload {
  temperature: number;
  humidity: number;
}

export interface DoorReadingPayload {
  state: 'open' | 'closed';
  transitionCount: number;
}

export interface SoundReadingPayload {
  splDb: number;
  peakAdc: number;
}

export interface RelayStatePayload {
  energized: boolean;
  triggerCount: number;
  lastTriggerAt?: number;
}

export interface HalDeviceInfo {
  deviceId: string;
  hardwareVersion: string;
  firmwareVersion: string;
  chipModel: string;
  freeHeap: number;
  minFreeHeap: number;
  uptime: number;
  wifiRssi: number;
  ipAddress: string;
  macAddress: string;
}

export interface IHalDriver<T = unknown> {
  readonly sensorType: string;
  readonly interfaceType: string;
  isInitialized(): boolean;
  init(config?: HalSensorConfig): Promise<boolean>;
  read(): Promise<HalSensorReading<T>>;
  health(): Promise<boolean>;
  deinit(): Promise<void>;
}
