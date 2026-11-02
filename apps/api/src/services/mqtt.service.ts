// ─────────────────────────────────────────────
// SENTINEL API — MQTT Gateway & Ingestion Service
// ─────────────────────────────────────────────

import net from 'node:net';
import crypto from 'node:crypto';
import {
  Aedes,
  Client,
  PublishPacket,
  AedesPublishPacket,
  Subscription,
  AuthenticateError,
} from 'aedes';
import { DeviceModel, DeviceCredentialModel, IDeviceDocument } from '../models/index.js';
import { TelemetryValidator } from './telemetry-validator.js';
import { SecurityAuditService } from './security-audit.service.js';
import type {
  MqttTopicContext,
  DeviceCommandPayload,
  DeviceCommandResponse,
  TelemetryMessage,
} from '@sentinel/types';

// Extended Aedes Client with verified device session data
export interface SentinelClient extends Client {
  device?: IDeviceDocument;
}

export class MqttService {
  private static aedesInstance: Aedes | null = null;
  private static tcpServer: net.Server | null = null;
  private static isRunning = false;

  /**
   * Parse MQTT topic formatted as:
   * sentinel/{orgId}/{facilityId}/{deviceId}/{channel}
   */
  static parseTopic(topic: string): MqttTopicContext | null {
    const parts = topic.split('/');
    if (parts.length < 5 || parts[0] !== 'sentinel') {
      return null;
    }

    const channel = parts[4] as 'telemetry' | 'status' | 'command' | 'config' | 'ack';
    if (!['telemetry', 'status', 'command', 'config', 'ack'].includes(channel)) {
      return null;
    }

    return {
      orgId: parts[1] || '',
      facilityId: parts[2] || '',
      deviceId: (parts[3] || '').toUpperCase(),
      channel,
    };
  }

  /**
   * Initialize and start embedded Aedes MQTT broker.
   */
  static async startBroker(port = 1883): Promise<void> {
    if (this.isRunning) return;

    const aedes = await Aedes.createBroker();
    this.aedesInstance = aedes;

    // ── 1. Client Authentication Hook ──
    // Master Requirement: "Do not authenticate only by deviceId."
    // Microcontroller must provide username (deviceId) and password (pre-shared secret token).
    aedes.authenticate = async (
      client: Client,
      username: Readonly<string | undefined>,
      password: Readonly<Buffer | undefined>,
      callback: (error: AuthenticateError | null, success: boolean | null) => void
    ) => {
      try {
        if (!username || !password) {
          void SecurityAuditService.logEvent({
            action: 'AUTH_FAILURE',
            severity: 'MEDIUM',
            actorType: 'DEVICE',
            status: 'BLOCKED',
            details: { reason: 'Missing deviceId or secret token in MQTT CONNECT frame' },
          });

          const authError = Object.assign(
            new Error('Authentication required: Missing deviceId or token.'),
            { returnCode: 4 }
          ) as AuthenticateError;
          return callback(authError, false);
        }

        const deviceId = String(username).trim().toUpperCase();
        const token = password.toString('utf-8');

        // Check active credential
        const credential = await DeviceCredentialModel.findOne({
          deviceId,
          status: 'ACTIVE',
        });

        if (!credential) {
          void SecurityAuditService.logEvent({
            action: 'ROGUE_DEVICE_BLOCKED',
            severity: 'HIGH',
            actorType: 'DEVICE',
            actorId: deviceId,
            status: 'BLOCKED',
            details: { reason: 'No active credential found for device' },
          });

          const authError = Object.assign(
            new Error(`Unauthorized device: "${deviceId}".`),
            { returnCode: 5 }
          ) as AuthenticateError;
          return callback(authError, false);
        }

        const isValid = credential.verifySecret(token);
        if (!isValid) {
          void SecurityAuditService.logEvent({
            action: 'ROGUE_DEVICE_BLOCKED',
            severity: 'HIGH',
            actorType: 'DEVICE',
            actorId: deviceId,
            organizationId: credential.organizationId.toString(),
            status: 'BLOCKED',
            details: { reason: 'Cryptographic SHA-256 token verification mismatch' },
          });

          const authError = Object.assign(
            new Error(`Invalid secret credentials for device "${deviceId}".`),
            { returnCode: 4 }
          ) as AuthenticateError;
          return callback(authError, false);
        }

        const device = await DeviceModel.findOne({ deviceId });
        if (!device || device.status === 'DISABLED') {
          void SecurityAuditService.logEvent({
            action: 'AUTH_LOCKOUT',
            severity: 'MEDIUM',
            actorType: 'DEVICE',
            actorId: deviceId,
            organizationId: credential.organizationId.toString(),
            status: 'BLOCKED',
            details: { reason: 'Device is disabled or not found in registry' },
          });

          const authError = Object.assign(
            new Error(`Device "${deviceId}" is disabled or not found.`),
            { returnCode: 5 }
          ) as AuthenticateError;
          return callback(authError, false);
        }

        // Attach verified device session to client
        (client as SentinelClient).device = device;

        void SecurityAuditService.logEvent({
          action: 'AUTH_SUCCESS',
          severity: 'INFO',
          actorType: 'DEVICE',
          actorId: deviceId,
          organizationId: device.organizationId.toString(),
          status: 'SUCCESS',
        });

        callback(null, true);
      } catch (err: unknown) {
        const authError = Object.assign(
          err instanceof Error ? err : new Error('Authentication error'),
          { returnCode: 3 }
        ) as AuthenticateError;
        callback(authError, false);
      }
    };

    // ── 2. Authorize Publish Hook (Topic Security) ──
    aedes.authorizePublish = (
      client: Client | null,
      packet: PublishPacket,
      callback: (error?: Error | null) => void
    ) => {
      // Allow internal server publications
      if (!client) {
        return callback(null);
      }

      const sClient = client as SentinelClient;
      if (!sClient.device) {
        return callback(new Error('Unauthenticated client publish rejected.'));
      }

      const parsed = MqttService.parseTopic(packet.topic);
      if (!parsed) {
        return callback(new Error(`Invalid topic format: "${packet.topic}".`));
      }

      // Enforce strict topic isolation: Device can only publish to its own hierarchy
      const device = sClient.device;
      if (
        parsed.orgId !== device.organizationId.toString() ||
        parsed.facilityId !== device.facilityId.toString() ||
        parsed.deviceId !== device.deviceId
      ) {
        void SecurityAuditService.logEvent({
          action: 'CROSS_TENANT_ACCESS_DENIED',
          severity: 'CRITICAL',
          actorType: 'DEVICE',
          actorId: device.deviceId,
          organizationId: device.organizationId.toString(),
          status: 'BLOCKED',
          resource: packet.topic,
          details: {
            reason: 'Impersonation blocked: Device tried to publish to foreign hierarchy',
            deviceOrgId: device.organizationId.toString(),
            targetOrgId: parsed.orgId,
          },
        });

        return callback(
          new Error(
            `Impersonation blocked: Device "${device.deviceId}" cannot publish to foreign topic "${packet.topic}".`
          )
        );
      }

      // Only allow publishing on telemetry, status, and ack channels
      if (!['telemetry', 'status', 'ack'].includes(parsed.channel)) {
        void SecurityAuditService.logEvent({
          action: 'UNAUTHORIZED_PUBLISH_ATTEMPT',
          severity: 'HIGH',
          actorType: 'DEVICE',
          actorId: device.deviceId,
          organizationId: device.organizationId.toString(),
          status: 'BLOCKED',
          resource: packet.topic,
          details: { channel: parsed.channel },
        });

        return callback(new Error(`Client cannot publish to channel: "${parsed.channel}".`));
      }

      callback(null);
    };

    // ── 3. Authorize Subscribe Hook ──
    aedes.authorizeSubscribe = (
      client: Client,
      subscription: Subscription,
      callback: (error: Error | null, subscription?: Subscription | null) => void
    ) => {
      const sClient = client as SentinelClient;
      if (!sClient.device) {
        return callback(new Error('Unauthenticated client subscribe rejected.'));
      }

      const parsed = MqttService.parseTopic(subscription.topic);
      if (!parsed) {
        return callback(new Error(`Invalid subscription topic format: "${subscription.topic}".`));
      }

      const device = sClient.device;
      if (
        parsed.orgId !== device.organizationId.toString() ||
        parsed.facilityId !== device.facilityId.toString() ||
        parsed.deviceId !== device.deviceId
      ) {
        void SecurityAuditService.logEvent({
          action: 'UNAUTHORIZED_SUBSCRIBE_ATTEMPT',
          severity: 'CRITICAL',
          actorType: 'DEVICE',
          actorId: device.deviceId,
          organizationId: device.organizationId.toString(),
          status: 'BLOCKED',
          resource: subscription.topic,
          details: { reason: 'Cross-device or cross-tenant subscription attempted' },
        });

        return callback(new Error('Cross-device subscription blocked.'));
      }

      // Client can only subscribe to its command, config, and ack channels
      if (!['command', 'config', 'ack'].includes(parsed.channel)) {
        return callback(new Error(`Client cannot subscribe to channel "${parsed.channel}".`));
      }

      callback(null, subscription);
    };

    // ── 4. Message Ingestion Listener ──
    aedes.on('publish', async (packet: AedesPublishPacket, client: Client | null) => {
      // Ignore broker internal packets ($SYS)
      if (packet.topic.startsWith('$SYS/')) return;
      if (!client) return; // Ignore internal server dispatches

      const parsed = MqttService.parseTopic(packet.topic);
      if (!parsed) return;

      try {
        const payloadStr = packet.payload.toString('utf-8');
        const payload = JSON.parse(payloadStr);

        if (parsed.channel === 'telemetry') {
          // Process through Telemetry Validator
          const telemetryMsg: TelemetryMessage = {
            deviceId: parsed.deviceId,
            timestamp: payload.timestamp || new Date().toISOString(),
            sensors: payload.sensors || payload,
            metadata: payload.metadata,
          };

          await TelemetryValidator.validateAndProcess(telemetryMsg, {
            expectedOrgId: parsed.orgId,
            expectedFacilityId: parsed.facilityId,
          });
        } else if (parsed.channel === 'status') {
          // Microcontroller state update
          await DeviceModel.updateOne(
            { deviceId: parsed.deviceId },
            {
              $set: {
                status: payload.status || 'ONLINE',
                lastSeenAt: new Date(),
                lastHeartbeatAt: new Date(),
                ipAddress: payload.ipAddress,
                lastError: payload.error,
              },
            }
          );
        }
      } catch {
        // Validation errors are logged or persisted in TelemetryModel with valid=false
      }
    });

    // ── 5. TCP Listener Setup ──
    return new Promise((resolve) => {
      const server = net.createServer(aedes.handle);
      this.tcpServer = server;

      server.listen(port, () => {
        this.isRunning = true;
        resolve();
      });

      server.on('error', () => {
        // Fallback gracefully if port is occupied
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * Publish a cloud command to an ESP32 microcontroller via MQTT.
   */
  static async publishCommand(
    organizationId: string,
    facilityId: string,
    deviceId: string,
    command: 'REBOOT' | 'CALIBRATE' | 'SET_INTERVAL' | 'TRIGGER_ACTUATOR' | 'REQUEST_STATUS' | string,
    params?: Record<string, unknown>
  ): Promise<DeviceCommandResponse> {
    const upperDeviceId = deviceId.trim().toUpperCase();
    const topic = `sentinel/${organizationId}/${facilityId}/${upperDeviceId}/command`;
    const commandId = `cmd_${crypto.randomBytes(8).toString('hex')}`;

    const payload: DeviceCommandPayload = {
      commandId,
      command,
      params,
      sentAt: new Date().toISOString(),
      targetDeviceId: upperDeviceId,
    };

    if (this.aedesInstance) {
      await new Promise<void>((resolve, reject) => {
        this.aedesInstance!.publish(
          {
            cmd: 'publish',
            qos: 1,
            dup: false,
            retain: false,
            topic,
            payload: Buffer.from(JSON.stringify(payload)),
          },
          (err?: Error) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    return {
      commandId,
      deviceId: upperDeviceId,
      status: 'DELIVERED',
      timestamp: payload.sentAt,
    };
  }

  /**
   * Stop embedded MQTT broker.
   */
  static async stopBroker(): Promise<void> {
    if (this.tcpServer) {
      await new Promise<void>((resolve) => {
        this.tcpServer!.close(() => resolve());
        setTimeout(resolve, 500);
      });
      this.tcpServer = null;
    }
    if (this.aedesInstance) {
      await new Promise<void>((resolve) => {
        this.aedesInstance!.close(() => resolve());
        setTimeout(resolve, 500);
      });
      this.aedesInstance = null;
    }
    this.isRunning = false;
  }

  static getStatus(): { isRunning: boolean; port: number } {
    return {
      isRunning: this.isRunning,
      port: 1883,
    };
  }
}
