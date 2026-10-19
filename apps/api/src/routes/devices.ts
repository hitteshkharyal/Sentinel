// ─────────────────────────────────────────────
// SENTINEL API — ESP32 Device & Microcontroller Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { DeviceService } from '../services/device.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  registerDeviceSchema,
  updateDeviceSchema,
  assignDeviceSchema,
  deviceHeartbeatSchema,
  rotateDeviceSecretSchema,
  deviceFilterSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, DeviceFilterQuery } from '@sentinel/types';

export const deviceRouter = Router();

// ─────────────────────────────────────────────
// UNPROTECTED / TOKEN-AUTHENTICATED DEVICE HEARTBEAT
// ─────────────────────────────────────────────

/**
 * POST /api/v1/devices/heartbeat
 * POST /api/v1/devices/:deviceId/heartbeat
 * Hardware heartbeat ingestion endpoint for physical ESP32 microcontroller nodes.
 * Authenticates via X-Device-Token / X-Device-Secret or Bearer token header.
 */
const handleHeartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawSecret =
      (req.headers['x-device-token'] as string) ||
      (req.headers['x-device-secret'] as string) ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      (req.body.deviceSecret as string) ||
      (req.body.token as string);

    const deviceId =
      (req.params.deviceId as string) ||
      (req.body.deviceId as string);

    if (!deviceId) {
      throw new AppError(400, 'Microcontroller deviceId is required for heartbeat.');
    }

    if (!rawSecret) {
      throw new AppError(401, 'Cryptographic device secret key required to authenticate heartbeat.');
    }

    const validation = deviceHeartbeatSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(
        400,
        `Invalid heartbeat payload format: ${validation.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    const result = await DeviceService.recordHeartbeat(deviceId, rawSecret, validation.data);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

deviceRouter.post('/heartbeat', handleHeartbeat);
deviceRouter.post('/:deviceId/heartbeat', handleHeartbeat);

// ─────────────────────────────────────────────
// PROTECTED USER / OPERATOR MANAGEMENT ROUTES
// ─────────────────────────────────────────────

deviceRouter.use(requireAuth);

/**
 * GET /api/v1/devices/stats
 * Get microcontroller inventory metrics (total, online, offline, provisioning, errors)
 */
deviceRouter.get(
  '/stats',
  requirePermission('device.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const stats = await DeviceService.getDeviceStats(orgId);

      const response: ApiResponse<typeof stats> = {
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
 * GET /api/v1/devices
 * List registered microcontrollers with optional spatial and hardware filters
 */
deviceRouter.get(
  '/',
  requirePermission('device.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = deviceFilterSchema.safeParse(req.query);
      const filter: DeviceFilterQuery = validation.success ? validation.data : {};

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));

      const result = await DeviceService.listDevices(orgId, filter, page, limit);

      const response: ApiResponse<typeof result.devices> = {
        success: true,
        data: result.devices,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/devices
 * Register new ESP32 microcontroller and generate cryptographic provisioning credentials
 */
deviceRouter.post(
  '/',
  requirePermission('device.register'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const userId = req.user?.userId;
      const validation = registerDeviceSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          `Invalid device registration data: ${validation.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const result = await DeviceService.registerDevice(orgId, validation.data, userId);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/devices/:id
 * Retrieve single device details with attached sensors and credential metadata
 */
deviceRouter.get(
  '/:id',
  requirePermission('device.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const idOrDeviceId = req.params.id as string;

      const result = await DeviceService.getDeviceById(orgId, idOrDeviceId);

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

/**
 * GET /api/v1/devices/:id/config
 * Generate C++ PlatformIO config.h header and MQTT onboarding parameters
 */
deviceRouter.get(
  '/:id/config',
  requirePermission('device.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const idOrDeviceId = req.params.id as string;

      const config = await DeviceService.generateDeviceConfig(orgId, idOrDeviceId);

      const response: ApiResponse<typeof config> = {
        success: true,
        data: config,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/devices/:id
 * Update device identity, firmware targets, or status
 */
deviceRouter.patch(
  '/:id',
  requirePermission('device.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const id = req.params.id as string;

      const validation = updateDeviceSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          `Invalid device update data: ${validation.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const device = await DeviceService.updateDevice(orgId, id, validation.data);

      const response: ApiResponse<typeof device> = {
        success: true,
        data: device,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/devices/:id/assign
 * Reassign device to a different facility or room
 */
deviceRouter.post(
  '/:id/assign',
  requirePermission('device.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const id = req.params.id as string;

      const validation = assignDeviceSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          `Invalid assignment data: ${validation.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const device = await DeviceService.assignDevice(
        orgId,
        id,
        validation.data.facilityId,
        validation.data.roomId
      );

      const response: ApiResponse<typeof device> = {
        success: true,
        data: device,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/devices/:id/rotate-secret
 * Rotate device secret token and return new credentials
 */
deviceRouter.post(
  '/:id/rotate-secret',
  requirePermission('device.register'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const id = req.params.id as string;
      const userId = req.user?.userId;

      const validation = rotateDeviceSecretSchema.safeParse(req.body);
      const reason = validation.success ? validation.data.reason : undefined;

      const credentials = await DeviceService.rotateDeviceCredential(
        orgId,
        id,
        reason,
        userId
      );

      const response: ApiResponse<typeof credentials> = {
        success: true,
        data: credentials,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/devices/:id/reboot
 * Dispatch reboot signal command to microcontroller node
 */
deviceRouter.post(
  '/:id/reboot',
  requirePermission('device.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const id = req.params.id as string;

      const { device } = await DeviceService.getDeviceById(orgId, id);

      // Simulates dispatching reboot command payload to device command topic
      const response: ApiResponse<{ deviceId: string; rebootInitiated: boolean; dispatchedAt: string }> = {
        success: true,
        data: {
          deviceId: device.deviceId,
          rebootInitiated: true,
          dispatchedAt: new Date().toISOString(),
        },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/devices/:id
 * Decommission device and unlink associated sensors
 */
deviceRouter.delete(
  '/:id',
  requirePermission('device.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const id = req.params.id as string;

      await DeviceService.deleteDevice(orgId, id);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: `Device "${id}" successfully decommissioned.` },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
