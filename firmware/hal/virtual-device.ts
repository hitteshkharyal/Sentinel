// ─────────────────────────────────────────────
// SENTINEL Firmware — Virtual ESP32 Hardware Node Engine
// ─────────────────────────────────────────────

import mqtt, { type MqttClient } from 'mqtt';
import {
  HalPirDriver,
  HalMmwaveDriver,
  HalCo2Driver,
  HalTempHumidityDriver,
  HalSoundDriver,
  HalDoorDriver,
  HalPressureDriver,
  HalLightDriver,
  HalRelayDriver,
} from './hal-drivers.js';
import type { HalDeviceInfo } from './hal-interface.js';

export interface VirtualNodeConfig {
  deviceId: string;
  orgId: string;
  facilityId: string;
  roomId?: string;
  macAddress: string;
  hardwareModel?: string;
  firmwareVersion?: string;
  presharedToken: string;
  brokerUrl: string;
  samplingIntervalMs?: number;
}

export interface VirtualNodeStats {
  publishedTelemetryCount: number;
  receivedCommandsCount: number;
  lastCommandReceived?: string;
  lastTelemetryTimestamp?: string;
  connected: boolean;
}

export class VirtualEsp32Node {
  readonly config: VirtualNodeConfig;
  readonly pir: HalPirDriver;
  readonly mmwave: HalMmwaveDriver;
  readonly co2: HalCo2Driver;
  readonly tempHum: HalTempHumidityDriver;
  readonly sound: HalSoundDriver;
  readonly door: HalDoorDriver;
  readonly pressure: HalPressureDriver;
  readonly light: HalLightDriver;
  readonly relay: HalRelayDriver;

  private client: MqttClient | null = null;
  private timer: NodeJS.Timeout | null = null;
  private bootTime = Date.now();
  private stats: VirtualNodeStats = {
    publishedTelemetryCount: 0,
    receivedCommandsCount: 0,
    connected: false,
  };

  constructor(config: VirtualNodeConfig) {
    this.config = {
      ...config,
      hardwareModel: config.hardwareModel || 'ESP32-S3-WROOM-1',
      firmwareVersion: config.firmwareVersion || '1.4.0',
      samplingIntervalMs: config.samplingIntervalMs || 5000,
    };

    // Instantiate all HAL drivers
    this.pir = new HalPirDriver();
    this.mmwave = new HalMmwaveDriver();
    this.co2 = new HalCo2Driver();
    this.tempHum = new HalTempHumidityDriver();
    this.sound = new HalSoundDriver();
    this.door = new HalDoorDriver();
    this.pressure = new HalPressureDriver();
    this.light = new HalLightDriver();
    this.relay = new HalRelayDriver();
  }

  get topicTelemetry(): string {
    return `sentinel/${this.config.orgId}/${this.config.facilityId}/${this.config.deviceId}/telemetry`;
  }

  get topicCommand(): string {
    return `sentinel/${this.config.orgId}/${this.config.facilityId}/${this.config.deviceId}/command`;
  }

  get topicConfig(): string {
    return `sentinel/${this.config.orgId}/${this.config.facilityId}/${this.config.deviceId}/config`;
  }

  get topicStatus(): string {
    return `sentinel/${this.config.orgId}/${this.config.facilityId}/${this.config.deviceId}/status`;
  }

  get topicAck(): string {
    return `sentinel/${this.config.orgId}/${this.config.facilityId}/${this.config.deviceId}/ack`;
  }

  /**
   * Boot the virtual device, initialize all HAL drivers, and connect to MQTT broker.
   */
  async start(): Promise<void> {
    this.bootTime = Date.now();

    // 1. Initialize all HAL Drivers
    await Promise.all([
      this.pir.init(),
      this.mmwave.init(),
      this.co2.init(),
      this.tempHum.init(),
      this.sound.init(),
      this.door.init(),
      this.pressure.init(),
      this.light.init(),
      this.relay.init(),
    ]);

    // 2. Connect to MQTT Broker with Zero-Trust Credentials
    await new Promise<void>((resolve, reject) => {
      const clientId = `VirtualNode-${this.config.deviceId}-${Date.now().toString(36)}`;
      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId,
        username: this.config.deviceId,
        password: this.config.presharedToken,
        keepalive: 15,
        reconnectPeriod: 2000,
      });

      this.client.on('connect', () => {
        this.stats.connected = true;

        // Subscribe to Command & Config channels
        this.client?.subscribe([this.topicCommand, this.topicConfig], { qos: 1 }, (err) => {
          if (err) reject(err);
          else {
            this.publishStatus('ONLINE');
            resolve();
          }
        });
      });

      this.client.on('error', (err) => {
        this.stats.connected = false;
        // If not already resolved/rejected
        reject(err);
      });

      this.client.on('message', async (topic, payload) => {
        await this.handleInboundMessage(topic, payload);
      });
    });

    // 3. Start Periodic Telemetry Sampling Task
    this.timer = setInterval(async () => {
      await this.sampleAndPublishTelemetry();
    }, this.config.samplingIntervalMs);
  }

  /**
   * Handle incoming cloud command or config update.
   */
  private async handleInboundMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      const data = JSON.parse(payload.toString('utf-8'));
      this.stats.receivedCommandsCount++;
      this.stats.lastCommandReceived = data.command;

      if (topic === this.topicCommand) {
        const { commandId, command, params } = data;

        if (command === 'TRIGGER_ACTUATOR') {
          const energize = params?.energize ?? true;
          const durationMs = params?.durationMs ?? 0;

          if (durationMs > 0) {
            await this.relay.pulse(durationMs);
            this.publishAck(commandId, 'ACKNOWLEDGED', `Pulsed relay for ${durationMs}ms`);
          } else {
            this.relay.set(energize);
            this.publishAck(
              commandId,
              'ACKNOWLEDGED',
              energize ? 'Actuator relay energized' : 'Actuator relay de-energized'
            );
          }
        } else if (command === 'REBOOT') {
          // Re-init HAL drivers to simulate soft-reset
          await this.relay.deinit();
          await this.relay.init();
          this.bootTime = Date.now();
          this.publishAck(commandId, 'ACKNOWLEDGED', 'Virtual ESP32 soft-reboot complete');
        } else if (command === 'REQUEST_STATUS') {
          await this.sampleAndPublishTelemetry();
          this.publishAck(commandId, 'ACKNOWLEDGED', 'Telemetry refreshed and published');
        } else {
          this.publishAck(commandId, 'ACKNOWLEDGED', `Command "${command}" processed`);
        }
      }
    } catch (err: unknown) {
      console.error(`[VirtualNode ${this.config.deviceId}] Inbound message error:`, err);
    }
  }

  /**
   * Sample all HAL sensor readings and publish canonical telemetry packet.
   */
  async sampleAndPublishTelemetry(): Promise<void> {
    if (!this.client || !this.stats.connected) return;

    const [
      pirReading,
      mmwaveReading,
      co2Reading,
      tempHumReading,
      soundReading,
      doorReading,
      pressureReading,
      lightReading,
      relayReading,
    ] = await Promise.all([
      this.pir.read(),
      this.mmwave.read(),
      this.co2.read(),
      this.tempHum.read(),
      this.sound.read(),
      this.door.read(),
      this.pressure.read(),
      this.light.read(),
      this.relay.read(),
    ]);

    const uptimeSeconds = Math.floor((Date.now() - this.bootTime) / 1000);
    const nowIso = new Date().toISOString();

    const telemetryPayload = {
      deviceId: this.config.deviceId,
      timestamp: nowIso,
      sensors: {
        pir: pirReading.healthy ? pirReading.value : undefined,
        mmwave: mmwaveReading.healthy ? mmwaveReading.value : undefined,
        co2: co2Reading.healthy ? co2Reading.value : undefined,
        temperature: tempHumReading.healthy ? tempHumReading.value.temperature : undefined,
        humidity: tempHumReading.healthy ? tempHumReading.value.humidity : undefined,
        soundLevel: soundReading.healthy ? soundReading.value.splDb : undefined,
        door: doorReading.healthy ? doorReading.value.state : undefined,
        pressure: pressureReading.healthy ? pressureReading.value : undefined,
        light: lightReading.healthy ? lightReading.value : undefined,
      },
      metadata: {
        wifiRssiDbm: -56 + Math.floor(Math.random() * 6 - 3),
        freeHeapBytes: 198420 - (uptimeSeconds * 2),
        uptimeSeconds,
        firmwareVersion: this.config.firmwareVersion,
        hardwareModel: this.config.hardwareModel,
        ipAddress: '192.168.1.185',
        actuatorEnergized: relayReading.value.energized,
      },
    };

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(
        this.topicTelemetry,
        Buffer.from(JSON.stringify(telemetryPayload)),
        { qos: 1 },
        (err) => {
          if (err) reject(err);
          else {
            this.stats.publishedTelemetryCount++;
            this.stats.lastTelemetryTimestamp = nowIso;
            resolve();
          }
        }
      );
    });
  }

  publishStatus(status: 'ONLINE' | 'OFFLINE', error?: string): void {
    if (!this.client || !this.stats.connected) return;
    const payload = {
      deviceId: this.config.deviceId,
      status,
      error,
      timestamp: Date.now(),
      ipAddress: '192.168.1.185',
    };
    this.client.publish(this.topicStatus, JSON.stringify(payload), { qos: 1 });
  }

  publishAck(commandId: string, status: string, details?: string): void {
    if (!this.client || !this.stats.connected) return;
    const payload = {
      commandId,
      deviceId: this.config.deviceId,
      status,
      details,
      timestamp: Date.now(),
    };
    this.client.publish(this.topicAck, JSON.stringify(payload), { qos: 1 });
  }

  getDeviceInfo(): HalDeviceInfo {
    const uptimeSeconds = Math.floor((Date.now() - this.bootTime) / 1000);
    return {
      deviceId: this.config.deviceId,
      hardwareVersion: 'v3.2',
      firmwareVersion: this.config.firmwareVersion || '1.4.0',
      chipModel: this.config.hardwareModel || 'ESP32-S3-WROOM-1',
      freeHeap: 198420 - (uptimeSeconds * 2),
      minFreeHeap: 185000,
      uptime: uptimeSeconds,
      wifiRssi: -56,
      ipAddress: '192.168.1.185',
      macAddress: this.config.macAddress,
    };
  }

  getStats(): VirtualNodeStats {
    return { ...this.stats };
  }

  /**
   * Stop the virtual node, de-energize actuators, deinit all drivers, and close MQTT connection.
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.client) {
      this.publishStatus('OFFLINE');
      await new Promise<void>((resolve) => {
        this.client?.end(false, () => resolve());
      });
      this.client = null;
    }

    // Enforce safe de-energization on all HAL drivers
    await Promise.all([
      this.relay.deinit(),
      this.door.deinit(),
      this.pir.deinit(),
      this.sound.deinit(),
      this.mmwave.deinit(),
      this.co2.deinit(),
      this.tempHum.deinit(),
      this.pressure.deinit(),
      this.light.deinit(),
    ]);

    this.stats.connected = false;
  }
}
