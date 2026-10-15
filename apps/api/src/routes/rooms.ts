// ─────────────────────────────────────────────
// SENTINEL API — Rooms & Spatial Twin Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { FacilityService } from '../services/facility.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createRoomSchema,
  updateRoomSchema,
  roomFilterSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, RoomFilterQuery } from '@sentinel/types';

export const roomRouter = Router();

roomRouter.use(requireAuth);

/**
 * GET /api/v1/rooms/search
 * Global room search (Prompt #37) across room numbers, names, descriptions
 */
roomRouter.get(
  '/search',
  requirePermission('room.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const q = (req.query.q as string) || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const rooms = await FacilityService.searchRooms(orgId, q, limit);

      const response: ApiResponse<typeof rooms> = {
        success: true,
        data: rooms,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/rooms
 * List rooms with optional spatial filters (facilityId, floorId, type, occupancy)
 */
roomRouter.get(
  '/',
  requirePermission('room.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = roomFilterSchema.safeParse(req.query);
      const filter: RoomFilterQuery = validation.success ? validation.data : {};

      const rooms = await FacilityService.getRooms(orgId, filter);

      const response: ApiResponse<typeof rooms> = {
        success: true,
        data: rooms,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/rooms
 * Create a new room / spatial area (requires room.create)
 */
roomRouter.post(
  '/',
  requirePermission('room.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = createRoomSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const room = await FacilityService.createRoom(
        orgId,
        req.user!.userId,
        validation.data
      );

      const response: ApiResponse<typeof room> = {
        success: true,
        data: room,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/rooms/:id
 * Get single room details and current environmental telemetry
 */
roomRouter.get(
  '/:id',
  requirePermission('room.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const roomId = req.params.id;
      if (!roomId) {
        throw new AppError(400, 'Room ID is required.');
      }

      const room = await FacilityService.getRoomById(orgId, roomId);

      const response: ApiResponse<typeof room> = {
        success: true,
        data: room,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/rooms/:id
 * Update room metadata and digital twin telemetry parameters (requires room.update)
 */
roomRouter.patch(
  '/:id',
  requirePermission('room.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const roomId = req.params.id;
      if (!roomId) {
        throw new AppError(400, 'Room ID is required.');
      }

      const validation = updateRoomSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const updated = await FacilityService.updateRoom(
        orgId,
        roomId,
        validation.data
      );

      const response: ApiResponse<typeof updated> = {
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
 * DELETE /api/v1/rooms/:id
 * Delete room from digital twin (requires room.delete)
 */
roomRouter.delete(
  '/:id',
  requirePermission('room.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const roomId = req.params.id;
      if (!roomId) {
        throw new AppError(400, 'Room ID is required.');
      }

      await FacilityService.deleteRoom(orgId, roomId);

      res.json({
        success: true,
        data: { message: 'Room removed from digital twin successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);
