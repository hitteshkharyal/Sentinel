// ─────────────────────────────────────────────
// SENTINEL Firmware — HAL Interface Definitions
// ─────────────────────────────────────────────
// These are C-style header-like definitions documented in TypeScript
// for shared reference. Actual firmware implementation will use C/C++
// in the PlatformIO/Arduino framework (Day 14).
//
// This file serves as the HAL contract specification.
// ─────────────────────────────────────────────

/**
 * Hardware Abstraction Layer (HAL) — Sensor Interface Contract
 *
 * Every sensor driver must implement these lifecycle methods:
 *
 *   hal_<sensor>_init(config)     → Initialize sensor hardware
 *   hal_<sensor>_read()           → Read current sensor value
 *   hal_<sensor>_health()         → Check sensor health/connectivity
 *   hal_<sensor>_deinit()         → Release sensor resources
 *
 * Supported sensor HAL modules:
 *
 *   hal_pir        — Passive Infrared (GPIO digital)
 *   hal_mmwave     — mmWave presence/count (UART)
 *   hal_co2        — CO₂ concentration (I2C / UART)
 *   hal_temperature — Temperature (I2C / analog)
 *   hal_humidity   — Humidity (I2C / analog)
 *   hal_sound      — Sound level (ADC analog)
 *   hal_door       — Magnetic door sensor (GPIO digital)
 *   hal_pressure   — Barometric pressure (I2C)
 *   hal_light      — Light level (ADC / I2C)
 *   hal_relay      — Relay control (GPIO digital output)
 *
 * Supported interfaces:
 *
 *   GPIO   — Digital input/output
 *   ADC    — Analog-to-digital conversion
 *   PWM    — Pulse-width modulation output
 *   I2C    — Inter-Integrated Circuit bus
 *   SPI    — Serial Peripheral Interface
 *   UART   — Universal Asynchronous Receiver-Transmitter
 */

export interface HalSensorConfig {
  sensorType: string;
  interfaceType: 'GPIO' | 'ADC' | 'PWM' | 'I2C' | 'SPI' | 'UART';
  pin?: number;
  i2cAddress?: number;
  samplingIntervalMs: number;
  calibrationOffset?: number;
}

export interface HalSensorReading {
  sensorType: string;
  value: number | boolean | Record<string, unknown>;
  timestamp: number;
  healthy: boolean;
  error?: string;
}

export interface HalDeviceInfo {
  deviceId: string;
  hardwareVersion: string;
  firmwareVersion: string;
  chipModel: string;
  freeHeap: number;
  uptime: number;
  wifiRssi: number;
}
