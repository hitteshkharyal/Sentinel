// ─────────────────────────────────────────────
// SENTINEL API — Sensor Data HTTP Ingestion Route
// Direct HTTP POST ingestion endpoint for microcontrollers (ESP32/ESP8266)
// Authenticated with X-Device-API-Key header
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { DeviceCredentialModel, DeviceModel } from '../models/index.js';
import { TelemetryValidator } from '../services/telemetry-validator.js';
import { sensorDataIngestionSchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, TelemetryMessage } from '@sentinel/types';

export const sensorDataRouter = Router();

/**
 * POST /api/v1/sensors/data
 * Lightweight HTTP ingestion endpoint inspired by WeatherDash architecture
 * Supports ESP32 & ESP8266 standalone Arduino sketches
 */
sensorDataRouter.post(
  '/data',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract API Key
      let apiKey = (req.headers['x-device-api-key'] || req.headers['x-device-token']) as string | undefined;
      if (!apiKey && req.headers.authorization?.startsWith('Bearer ')) {
        apiKey = req.headers.authorization.substring(7).trim();
      }
      if (!apiKey && req.body?.apiKey) {
        apiKey = req.body.apiKey as string;
      }

      if (!apiKey) {
        throw new AppError(
          401,
          'Authentication required: Missing X-Device-API-Key header or Bearer token.'
        );
      }

      // 2. Validate payload structure
      const parsed = sensorDataIngestionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          `Invalid sensor payload: ${parsed.error.errors[0]?.message || 'Validation error'}`
        );
      }

      const bodyDeviceId = parsed.data.deviceId?.trim().toUpperCase();

      // 3. Authenticate device via DeviceCredentialModel
      let credential = null;

      if (bodyDeviceId) {
        credential = await DeviceCredentialModel.findOne({
          deviceId: bodyDeviceId,
          status: 'ACTIVE',
        });
      }

      // Fallback: search by keyPrefix if deviceId was not in body
      if (!credential && apiKey.length >= 12) {
        const prefix = apiKey.substring(0, 16);
        credential = await DeviceCredentialModel.findOne({
          keyPrefix: prefix,
          status: 'ACTIVE',
        });
      }

      if (!credential) {
        // Fallback for standalone test/virtual devices where key starts with sent_dev_
        const allActive = await DeviceCredentialModel.find({ status: 'ACTIVE' }).limit(50);
        for (const candidate of allActive) {
          if (candidate.verifySecret(apiKey)) {
            credential = candidate;
            break;
          }
        }
      }

      if (!credential) {
        throw new AppError(401, 'Unauthorized: Invalid or unknown device API key.');
      }

      const isKeyValid = credential.verifySecret(apiKey);
      if (!isKeyValid) {
        throw new AppError(401, 'Authentication failed: Invalid device API key secret.');
      }

      const verifiedDeviceId = credential.deviceId;

      // 4. Update lastRotatedAt/access tracking timestamp
      credential.lastRotatedAt = new Date();
      await credential.save().catch(() => {});

      // 5. Structure into TelemetryMessage for authoritative validator
      const sensorMap = parsed.data.sensors;
      const rssi = typeof sensorMap.rssi === 'number' ? sensorMap.rssi : undefined;
      const uptime = typeof sensorMap.uptime_sec === 'number' ? sensorMap.uptime_sec : undefined;

      const telemetryPayload: TelemetryMessage = {
        deviceId: verifiedDeviceId,
        timestamp: parsed.data.timestamp
          ? (typeof parsed.data.timestamp === 'number' ? new Date(parsed.data.timestamp).toISOString() : new Date(parsed.data.timestamp).toISOString())
          : new Date().toISOString(),
        sensors: sensorMap,
        metadata: {
          wifiRssiDbm: rssi,
          uptimeSeconds: uptime,
        },
      };

      // 6. Process through authoritative TelemetryValidator
      const result = await TelemetryValidator.validateAndProcess(telemetryPayload);

      // 7. Update device status to ONLINE
      await DeviceModel.updateOne(
        { deviceId: verifiedDeviceId },
        {
          $set: {
            status: 'ONLINE',
            lastSeenAt: new Date(),
          },
        }
      ).catch(() => {});

      const response: ApiResponse<{
        message: string;
        deviceId: string;
        telemetryId: string;
        processedReadings: number;
        eventsCount: number;
      }> = {
        success: true,
        data: {
          message: 'Sensor data ingested successfully',
          deviceId: verifiedDeviceId,
          telemetryId: result.telemetry.id,
          processedReadings: Object.keys(sensorMap).length,
          eventsCount: 0,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);
