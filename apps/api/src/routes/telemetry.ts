// ─────────────────────────────────────────────
// SENTINEL API — Telemetry & Communication Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  TelemetryModel,
  DeviceModel,
  DeviceCredentialModel,
  SensorModel,
} from '../models/index.js';
import { TelemetryValidator } from '../services/telemetry-validator.js';
import { MqttService } from '../services/mqtt.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  telemetryMessageSchema,
  telemetryFilterSchema,
  deviceCommandSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, TelemetryStats } from '@sentinel/types';

export const telemetryRouter = Router();

// ── 1. HTTP Telemetry Ingestion (Authenticated by Device Token) ──
/**
 * POST /api/v1/telemetry
 * Direct HTTP ingestion endpoint for microcontrollers and edge gateways.
 * Adheres to Master Rule: "Do not authenticate only by deviceId."
 */
telemetryRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract device authentication secret
      let token = req.headers['x-device-token'] as string | undefined;
      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7).trim();
      }
      if (!token && req.body?.token) {
        token = req.body.token as string;
      }

      if (!token) {
        throw new AppError(
          401,
          'Authentication required: Missing device secret token (X-Device-Token or Bearer).'
        );
      }

      // 2. Validate message payload schema
      const validation = telemetryMessageSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors[0]?.message || 'Invalid telemetry payload structure.'
        );
      }

      const upperDeviceId = validation.data.deviceId.trim().toUpperCase();

      // 3. Cryptographically authenticate device
      const credential = await DeviceCredentialModel.findOne({
        deviceId: upperDeviceId,
        status: 'ACTIVE',
      });

      if (!credential) {
        throw new AppError(401, `Unauthorized device: "${upperDeviceId}".`);
      }

      const isValidToken = credential.verifySecret(token);
      if (!isValidToken) {
        throw new AppError(401, 'Authentication failed: Invalid device secret key.');
      }

      // 4. Process through authoritative Telemetry Validator
      const result = await TelemetryValidator.validateAndProcess(validation.data);

      const response: ApiResponse<typeof result.telemetry> = {
        success: true,
        data: result.telemetry,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ── Protected Management & Query Endpoints (JWT + RBAC) ──
telemetryRouter.use(requireAuth);

/**
 * GET /api/v1/telemetry/stats
 * Telemetry ingestion throughput and reliability metrics.
 */
telemetryRouter.get(
  '/stats',
  requirePermission('telemetry.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId;
      if (!orgId) {
        throw new AppError(400, 'Organization context is required.');
      }

      const orgObjId = new mongoose.Types.ObjectId(orgId);
      const totalMessages = await TelemetryModel.countDocuments({ organizationId: orgObjId });
      const validMessages = await TelemetryModel.countDocuments({
        organizationId: orgObjId,
        valid: true,
      });
      const invalidMessages = totalMessages - validMessages;

      const lastDoc = await TelemetryModel.findOne({ organizationId: orgObjId })
        .sort({ timestamp: -1 })
        .select('timestamp');

      // Compute throughput over last 5 minutes
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentCount = await TelemetryModel.countDocuments({
        organizationId: orgObjId,
        timestamp: { $gte: fiveMinsAgo },
      });
      const messagesPerMinute = Math.round((recentCount / 5) * 10) / 10;

      const stats: TelemetryStats = {
        totalMessages,
        validMessages,
        invalidMessages,
        lastMessageAt: lastDoc?.timestamp ? lastDoc.timestamp.toISOString() : undefined,
        messagesPerMinute,
      };

      const response: ApiResponse<TelemetryStats> = {
        success: true,
        data: stats,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/telemetry/latest
 * Retrieve the latest reading snapshot across all active sensors in the organization.
 */
telemetryRouter.get(
  '/latest',
  requirePermission('telemetry.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId;
      if (!orgId) {
        throw new AppError(400, 'Organization context is required.');
      }

      const orgObjId = new mongoose.Types.ObjectId(orgId);
      const sensors = await SensorModel.find({
        organizationId: orgObjId,
        enabled: true,
      }).select('deviceId sensorType model interfaceType lastReading status facilityId roomId name');

      const response: ApiResponse<typeof sensors> = {
        success: true,
        data: sensors,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/telemetry
 * Query historical telemetry packets with spatial filters and pagination.
 */
telemetryRouter.get(
  '/',
  requirePermission('telemetry.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId;
      if (!orgId) {
        throw new AppError(400, 'Organization context is required.');
      }

      const validation = telemetryFilterSchema.safeParse(req.query);
      if (!validation.success) {
        throw new AppError(400, validation.error.errors[0]?.message || 'Invalid filter query.');
      }

      const { facilityId, roomId, deviceId, validOnly, startTime, endTime, page, limit } =
        validation.data;

      const query: Record<string, unknown> = {
        organizationId: new mongoose.Types.ObjectId(orgId),
      };

      if (facilityId) query.facilityId = new mongoose.Types.ObjectId(facilityId);
      if (roomId) query.roomId = new mongoose.Types.ObjectId(roomId);
      if (deviceId) query.deviceId = deviceId.trim().toUpperCase();
      if (validOnly) query.valid = true;

      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) (query.timestamp as Record<string, unknown>).$gte = new Date(startTime);
        if (endTime) (query.timestamp as Record<string, unknown>).$lte = new Date(endTime);
      }

      const total = await TelemetryModel.countDocuments(query);
      const skip = (page - 1) * limit;

      const docs = await TelemetryModel.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const items = docs.map((doc) => doc.toSafeTelemetry());

      const response: ApiResponse<typeof items> = {
        success: true,
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/telemetry/command
 * Send cloud actuator or configuration command to an ESP32 microcontroller via MQTT.
 */
telemetryRouter.post(
  '/command',
  requirePermission('device.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId;
      if (!orgId) {
        throw new AppError(400, 'Organization context is required.');
      }

      const validation = deviceCommandSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(400, validation.error.errors[0]?.message || 'Invalid command payload.');
      }

      const { deviceId, command, params } = validation.data;
      const device = await DeviceModel.findOne({
        organizationId: new mongoose.Types.ObjectId(orgId),
        deviceId: deviceId.trim().toUpperCase(),
      });

      if (!device) {
        throw new AppError(404, `Device "${deviceId}" not found in this organization.`);
      }

      const result = await MqttService.publishCommand(
        orgId,
        device.facilityId.toString(),
        device.deviceId,
        command,
        params
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
