// ─────────────────────────────────────────────
// SENTINEL API — Event Intelligence & Sensor Fusion Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { RoomModel, DeviceModel } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  eventFilterSchema,
  updateEventStatusSchema,
  evaluateEventSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  EventFilterQuery,
  SentinelEvent,
  EventStats,
  OccupancySnapshot,
  ValidatedTelemetry,
  TelemetrySensorData,
} from '@sentinel/types';

export const eventRouter = Router();

eventRouter.use(requireAuth);

/**
 * GET /api/v1/events/stats
 * Aggregate event statistics for the organization.
 */
eventRouter.get(
  '/stats',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const stats: EventStats = await EventService.getEventStats(orgId);

      const response: ApiResponse<EventStats> = {
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
 * GET /api/v1/events
 * List paginated events with comprehensive multi-criteria filtering.
 */
eventRouter.get(
  '/',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = eventFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid event filter parameters', 'VALIDATION_ERROR');
      }

      const filter: EventFilterQuery = validation.data;
      const result = await EventService.listEvents(orgId, filter);

      const response: ApiResponse<{
        events: SentinelEvent[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> = {
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
 * GET /api/v1/events/:id
 * Retrieve a single event by ID.
 */
eventRouter.get(
  '/:id',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const eventId = req.params.id as string;
      const event = await EventService.getEventById(eventId, orgId);

      if (!event) {
        throw new AppError(404, `Event not found: ${eventId}`);
      }

      const response: ApiResponse<SentinelEvent> = {
        success: true,
        data: event,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/events/:id/status
 * Update event lifecycle status (ACKNOWLEDGED, RESOLVED, DISMISSED) with notes.
 */
eventRouter.patch(
  '/:id/status',
  requirePermission('alert.acknowledge'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const eventId = req.params.id as string;
      const validation = updateEventStatusSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid status update payload', 'VALIDATION_ERROR');
      }

      const { status, notes } = validation.data;
      const userId = req.user?.userId;

      const updated = await EventService.updateEventStatus(
        eventId,
        orgId,
        status,
        userId,
        notes
      );

      if (!updated) {
        throw new AppError(404, `Event not found: ${eventId}`);
      }

      const response: ApiResponse<SentinelEvent> = {
        success: true,
        data: updated,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/events/evaluate
 * Authoritative on-demand telemetry evaluation & simulation injection.
 */
eventRouter.post(
  '/evaluate',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = evaluateEventSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid evaluation payload', 'VALIDATION_ERROR');
      }

      const { roomId, deviceId, timestamp, signals } = validation.data;

      // Ensure room belongs to organization
      const room = await RoomModel.findOne({ _id: roomId, organizationId: orgId });
      if (!room) {
        throw new AppError(404, `Room ${roomId} not found in this organization.`);
      }

      // If deviceId provided, verify it, otherwise pick or simulate device
      let resolvedDeviceId = deviceId;
      if (!resolvedDeviceId) {
        const attachedDevice = await DeviceModel.findOne({ roomId: room._id, organizationId: orgId });
        resolvedDeviceId = attachedDevice?.deviceId || `SIM-DEV-${room._id.toString().slice(-4).toUpperCase()}`;
      }

      const syntheticTelemetry: ValidatedTelemetry = {
        id: `eval-${Date.now()}`,
        organizationId: orgId,
        facilityId: room.facilityId.toString(),
        roomId: room._id.toString(),
        deviceId: resolvedDeviceId,
        timestamp: timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        sensors: signals as TelemetrySensorData,
        valid: true,
      };

      const result = await EventService.evaluateTelemetry(syntheticTelemetry);

      const response: ApiResponse<{
        occupancy: OccupancySnapshot;
        events: SentinelEvent[];
      }> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
