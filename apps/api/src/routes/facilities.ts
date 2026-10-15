// ─────────────────────────────────────────────
// SENTINEL API — Facilities & Floors Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { FacilityService } from '../services/facility.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createFacilitySchema,
  updateFacilitySchema,
  createFloorSchema,
  updateFloorSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '@sentinel/types';

export const facilityRouter = Router();

facilityRouter.use(requireAuth);

/**
 * GET /api/v1/facilities
 * List all facilities within active organization
 */
facilityRouter.get(
  '/',
  requirePermission('facility.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilities = await FacilityService.getFacilities(orgId);

      const response: ApiResponse<typeof facilities> = {
        success: true,
        data: facilities,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/facilities
 * Create a new facility (requires facility.create)
 */
facilityRouter.post(
  '/',
  requirePermission('facility.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = createFacilitySchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const facility = await FacilityService.createFacility(
        orgId,
        req.user!.userId,
        validation.data
      );

      const response: ApiResponse<typeof facility> = {
        success: true,
        data: facility,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/facilities/:id
 * Get single facility details with floor hierarchy
 */
facilityRouter.get(
  '/:id',
  requirePermission('facility.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilityId = req.params.id;
      if (!facilityId) {
        throw new AppError(400, 'Facility ID is required.');
      }

      const facility = await FacilityService.getFacilityById(orgId, facilityId);
      const response: ApiResponse<typeof facility> = {
        success: true,
        data: facility,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/facilities/:id
 * Update facility metadata (requires facility.update)
 */
facilityRouter.patch(
  '/:id',
  requirePermission('facility.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilityId = req.params.id;
      if (!facilityId) {
        throw new AppError(400, 'Facility ID is required.');
      }

      const validation = updateFacilitySchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const updated = await FacilityService.updateFacility(
        orgId,
        facilityId,
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
 * DELETE /api/v1/facilities/:id
 * Delete facility and associated floors/rooms (requires facility.delete)
 */
facilityRouter.delete(
  '/:id',
  requirePermission('facility.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilityId = req.params.id;
      if (!facilityId) {
        throw new AppError(400, 'Facility ID is required.');
      }

      await FacilityService.deleteFacility(orgId, facilityId);

      res.json({
        success: true,
        data: { message: 'Facility and associated spaces deleted successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// FLOOR ROUTES
// ─────────────────────────────────────────────

/**
 * GET /api/v1/facilities/:id/floors
 * List all floors in facility
 */
facilityRouter.get(
  '/:id/floors',
  requirePermission('facility.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilityId = req.params.id;
      if (!facilityId) {
        throw new AppError(400, 'Facility ID is required.');
      }

      const floors = await FacilityService.getFloorsByFacility(orgId, facilityId);
      const response: ApiResponse<typeof floors> = {
        success: true,
        data: floors,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/facilities/:id/floors
 * Add a floor to a facility (requires facility.update)
 */
facilityRouter.post(
  '/:id/floors',
  requirePermission('facility.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const facilityId = req.params.id;
      if (!facilityId) {
        throw new AppError(400, 'Facility ID is required.');
      }

      const validation = createFloorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const floor = await FacilityService.createFloor(
        orgId,
        facilityId,
        req.user!.userId,
        validation.data
      );

      const response: ApiResponse<typeof floor> = {
        success: true,
        data: floor,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/facilities/:id/floors/:floorId
 * Update floor details (requires facility.update)
 */
facilityRouter.patch(
  '/:id/floors/:floorId',
  requirePermission('facility.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const floorId = req.params.floorId;
      if (!floorId) {
        throw new AppError(400, 'Floor ID is required.');
      }

      const validation = updateFloorSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const updated = await FacilityService.updateFloor(
        orgId,
        floorId,
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
 * DELETE /api/v1/facilities/:id/floors/:floorId
 * Delete floor and cascade its rooms (requires facility.update)
 */
facilityRouter.delete(
  '/:id/floors/:floorId',
  requirePermission('facility.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const floorId = req.params.floorId;
      if (!floorId) {
        throw new AppError(400, 'Floor ID is required.');
      }

      await FacilityService.deleteFloor(orgId, floorId);

      res.json({
        success: true,
        data: { message: 'Floor and associated rooms deleted successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);
