// ─────────────────────────────────────────────
// SENTINEL Firmware — Concrete HAL Driver Implementations
// ─────────────────────────────────────────────

import type {
  HalSensorConfig,
  HalSensorReading,
  IHalDriver,
  MmwaveReadingPayload,
  TempHumidityReadingPayload,
  DoorReadingPayload,
  SoundReadingPayload,
  RelayStatePayload,
} from './hal-interface.js';

// ── 1. PIR Motion Driver (GPIO Digital) ──────────────────────────────────────
export class HalPirDriver implements IHalDriver<boolean> {
  readonly sensorType = 'PIR';
  readonly interfaceType = 'GPIO';
  private initialized = false;
  private currentMotion = false;
  private eventCount = 0;
  private isHealthy = true;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    this.currentMotion = false;
    this.eventCount = 0;
    return true;
  }

  // Fault or test injection
  setMotion(detected: boolean): void {
    if (detected && !this.currentMotion) {
      this.eventCount++;
    }
    this.currentMotion = detected;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<boolean>> {
    return {
      sensorType: this.sensorType,
      value: this.isHealthy ? this.currentMotion : false,
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'GPIO input pin stuck or floating' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
    this.currentMotion = false;
  }
}

// ── 2. mmWave Radar Driver (UART 60GHz FMCW) ─────────────────────────────────
export class HalMmwaveDriver implements IHalDriver<MmwaveReadingPayload> {
  readonly sensorType = 'MMWAVE';
  readonly interfaceType = 'UART';
  private initialized = false;
  private isHealthy = true;
  private presence = false;
  private count = 0;
  private distance = 0;
  private energy = 0;
  private stationaryConfidence = 0;
  private movementConfidence = 0;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    this.presence = false;
    this.count = 0;
    this.distance = 0;
    return true;
  }

  setRadarTarget(presence: boolean, count = 1, distance = 2.4, energy = 65): void {
    this.presence = presence;
    this.count = presence ? count : 0;
    this.distance = presence ? distance : 0;
    this.energy = presence ? energy : 0;
    this.stationaryConfidence = presence ? 92 : 0;
    this.movementConfidence = presence ? 45 : 0;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<MmwaveReadingPayload>> {
    return {
      sensorType: this.sensorType,
      value: {
        presence: this.presence,
        count: this.count,
        distance: this.distance,
        energy: this.energy,
        stationaryConfidence: this.stationaryConfidence,
        movementConfidence: this.movementConfidence,
      },
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'UART2 frame synchronization timeout (60GHz radar)' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
    this.presence = false;
  }
}

// ── 3. CO2 Sensor Driver (I2C Sensirion SCD40 / SCD30) ───────────────────────
export class HalCo2Driver implements IHalDriver<number> {
  readonly sensorType = 'CO2';
  readonly interfaceType = 'I2C';
  private initialized = false;
  private isHealthy = true;
  private currentPpm = 480;
  private offset = 0;
  private multiplier = 1.0;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    this.offset = config?.calibrationOffset ?? 0;
    this.multiplier = config?.calibrationMultiplier ?? 1.0;
    return true;
  }

  setPpm(ppm: number): void {
    this.currentPpm = ppm;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<number>> {
    const calibrated = (this.currentPpm * this.multiplier) + this.offset;
    return {
      sensorType: this.sensorType,
      value: Math.round(calibrated * 10) / 10,
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'SCD40 I2C NACK or CRC-8 verification failed' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 4. Temperature & Humidity Driver (I2C SHT31 / AHT20) ──────────────────────
export class HalTempHumidityDriver implements IHalDriver<TempHumidityReadingPayload> {
  readonly sensorType = 'TEMP_HUMIDITY';
  readonly interfaceType = 'I2C';
  private initialized = false;
  private isHealthy = true;
  private currentTemp = 22.4;
  private currentHum = 48.0;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    return true;
  }

  setValues(tempC: number, humidityPct: number): void {
    this.currentTemp = tempC;
    this.currentHum = humidityPct;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<TempHumidityReadingPayload>> {
    return {
      sensorType: this.sensorType,
      value: {
        temperature: Math.round(this.currentTemp * 10) / 10,
        humidity: Math.round(this.currentHum * 10) / 10,
      },
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'SHT31 I2C bus error or CRC checksum failure' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 5. Sound Level Driver (ADC Analog SPL Microphone) ────────────────────────
export class HalSoundDriver implements IHalDriver<SoundReadingPayload> {
  readonly sensorType = 'SOUND_LEVEL';
  readonly interfaceType = 'ADC';
  private initialized = false;
  private isHealthy = true;
  private currentSplDb = 42.5;
  private peakAdc = 340;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    return true;
  }

  setSpl(db: number, peak = 450): void {
    this.currentSplDb = db;
    this.peakAdc = peak;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<SoundReadingPayload>> {
    return {
      sensorType: this.sensorType,
      value: {
        splDb: Math.round(this.currentSplDb * 10) / 10,
        peakAdc: this.peakAdc,
      },
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'ADC1_CH6 analog sampling saturated or disconnected' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 6. Magnetic Door Sensor Driver (GPIO Digital Pull-up) ─────────────────────
export class HalDoorDriver implements IHalDriver<DoorReadingPayload> {
  readonly sensorType = 'DOOR_MAGNETIC';
  readonly interfaceType = 'GPIO';
  private initialized = false;
  private isHealthy = true;
  private state: 'open' | 'closed' = 'closed';
  private transitionCount = 0;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    this.state = 'closed';
    this.transitionCount = 0;
    return true;
  }

  setState(state: 'open' | 'closed'): void {
    if (state !== this.state) {
      this.transitionCount++;
      this.state = state;
    }
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<DoorReadingPayload>> {
    return {
      sensorType: this.sensorType,
      value: {
        state: this.state,
        transitionCount: this.transitionCount,
      },
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'Reed switch contact debounce failure' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 7. Barometric Pressure Driver (I2C Bosch BMP280) ─────────────────────────
export class HalPressureDriver implements IHalDriver<number> {
  readonly sensorType = 'PRESSURE';
  readonly interfaceType = 'I2C';
  private initialized = false;
  private isHealthy = true;
  private pressureHpa = 1013.25;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    return true;
  }

  setPressure(hpa: number): void {
    this.pressureHpa = hpa;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<number>> {
    return {
      sensorType: this.sensorType,
      value: Math.round(this.pressureHpa * 100) / 100,
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'BMP280 calibration register read timeout' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 8. Ambient Light Driver (I2C Rohm BH1750 / ADC) ──────────────────────────
export class HalLightDriver implements IHalDriver<number> {
  readonly sensorType = 'LIGHT';
  readonly interfaceType = 'I2C';
  private initialized = false;
  private isHealthy = true;
  private lux = 350.0;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    return true;
  }

  setLux(lux: number): void {
    this.lux = lux;
  }

  setFault(faulty: boolean): void {
    this.isHealthy = !faulty;
  }

  async read(): Promise<HalSensorReading<number>> {
    return {
      sensorType: this.sensorType,
      value: Math.round(this.lux * 10) / 10,
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
      error: !this.isHealthy ? 'BH1750 I2C bus acknowledge failed' : undefined,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    this.initialized = false;
  }
}

// ── 9. Actuator Relay Driver (GPIO Digital Output - Safe Fail-Secure) ────────
export class HalRelayDriver implements IHalDriver<RelayStatePayload> {
  readonly sensorType = 'RELAY';
  readonly interfaceType = 'GPIO';
  private initialized = false;
  private isHealthy = true;
  private energized = false;
  private triggerCount = 0;
  private lastTriggerAt?: number;

  isInitialized(): boolean {
    return this.initialized;
  }

  async init(_config?: HalSensorConfig): Promise<boolean> {
    this.initialized = true;
    this.isHealthy = true;
    // CRITICAL: Safe Fail-Secure default state (de-energized)
    this.energized = false;
    this.triggerCount = 0;
    this.lastTriggerAt = undefined;
    return true;
  }

  set(energize: boolean): boolean {
    if (!this.initialized) return false;
    this.energized = energize;
    this.triggerCount++;
    this.lastTriggerAt = Date.now();
    return true;
  }

  async pulse(durationMs: number): Promise<boolean> {
    if (!this.initialized) return false;
    this.set(true);
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    this.set(false);
    return true;
  }

  getState(): RelayStatePayload {
    return {
      energized: this.energized,
      triggerCount: this.triggerCount,
      lastTriggerAt: this.lastTriggerAt,
    };
  }

  async read(): Promise<HalSensorReading<RelayStatePayload>> {
    return {
      sensorType: this.sensorType,
      value: this.getState(),
      timestamp: Date.now(),
      healthy: this.initialized && this.isHealthy,
    };
  }

  async health(): Promise<boolean> {
    return this.initialized && this.isHealthy;
  }

  async deinit(): Promise<void> {
    // Enforce safe de-energization on shutdown
    this.energized = false;
    this.initialized = false;
  }
}
