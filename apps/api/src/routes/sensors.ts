// ─────────────────────────────────────────────
// SENTINEL API — Sensor Catalog & Configuration Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { SensorService } from '../services/sensor.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createSensorSchema,
  updateSensorSchema,
  configureSensorSchema,
  calibrateSensorSchema,
  sensorFilterSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  SensorCategory,
  SensorType,
  SensorFilterQuery,
} from '@sentinel/types';

export const sensorRouter = Router();

sensorRouter.use(requireAuth);

/**
 * GET /api/v1/sensors/catalog
 * Retrieve hardware sensor catalog with pinouts and recommended applications
 */
sensorRouter.get(
  '/catalog',
  requirePermission('sensor.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as SensorCategory | undefined;
      const sensorType = req.query.sensorType as SensorType | undefined;

      const items = SensorService.getCatalog(category, sensorType);

      const response: ApiResponse<typeof items> = {
        success: true,
        data: items,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/sensors/catalog/:idOrType
 * Retrieve single catalog specification by hardware model, type, or ID
 */
sensorRouter.get(
  '/catalog/:idOrType',
  requirePermission('sensor.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrType = req.params.idOrType as string;
      const item = SensorService.getCatalogItem(idOrType);
      if (!item) {
        throw new AppError(404, `Sensor hardware specification "${idOrType}" not found in catalog.`);
      }

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/sensors
 * List deployed sensors under the organization with optional spatial and hardware filters
 */
sensorRouter.get(
  '/',
  requirePermission('sensor.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = sensorFilterSchema.safeParse(req.query);
      const filter: SensorFilterQuery = validation.success ? validation.data : {};

      const sensors = await SensorService.getSensors(orgId, filter);

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
 * POST /api/v1/sensors
 * Register a new sensor instance
 */
sensorRouter.post(
  '/',
  requirePermission('sensor.configure'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const validation = createSensorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(400, 'Invalid sensor parameters');
      }

      const sensor = await SensorService.createSensor(orgId, userId, validation.data);

      const response: ApiResponse<typeof sensor> = {
        success: true,
        data: sensor,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/sensors/:id
 * Get single sensor details
 */
sensorRouter.get(
  '/:id',
  requirePermission('sensor.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const sensorId = req.params.id as string;
      const sensor = await SensorService.getSensorById(orgId, sensorId);

      const response: ApiResponse<typeof sensor> = {
        success: true,
        data: sensor,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/sensors/:id
 * Update sensor metadata (name, room, device link, enabled, status)
 */
sensorRouter.patch(
  '/:id',
  requirePermission('sensor.configure'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const sensorId = req.params.id as string;
      const validation = updateSensorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(400, 'Invalid update parameters');
      }

      const sensor = await SensorService.updateSensor(orgId, sensorId, validation.data);

      const response: ApiResponse<typeof sensor> = {
        success: true,
        data: sensor,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/sensors/:id/configure
 * Configure hardware parameters (GPIO pins, I2C address, intervals, thresholds)
 */
sensorRouter.put(
  '/:id/configure',
  requirePermission('sensor.configure'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const sensorId = req.params.id as string;
      const validation = configureSensorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(400, 'Invalid hardware configuration');
      }

      const sensor = await SensorService.configureSensor(orgId, sensorId, validation.data);

      const response: ApiResponse<typeof sensor> = {
        success: true,
        data: sensor,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/sensors/:id/calibrate
 * Calibrate hardware sensor offsets and baselines
 */
sensorRouter.post(
  '/:id/calibrate',
  requirePermission('sensor.configure'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }
      const sensorId = req.params.id as string;

      const validation = calibrateSensorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(400, 'Invalid calibration values');
      }

      const sensor = await SensorService.calibrateSensor(
        orgId,
        sensorId,
        userId,
        validation.data
      );

      const response: ApiResponse<typeof sensor> = {
        success: true,
        data: sensor,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/sensors/:id
 * Delete sensor instance
 */
sensorRouter.delete(
  '/:id',
  requirePermission('sensor.configure'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const sensorId = req.params.id as string;
      await SensorService.deleteSensor(orgId, sensorId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
