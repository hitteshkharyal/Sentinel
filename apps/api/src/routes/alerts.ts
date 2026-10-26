// ─────────────────────────────────────────────
// SENTINEL API — Alert Lifecycle & Incident Operations Router
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/alert.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  alertFilterSchema,
  createAlertSchema,
  updateAlertStatusSchema,
  escalateAlertSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  Alert,
  AlertStats,
  AlertFilterQuery,
} from '@sentinel/types';

export const alertRouter = Router();

alertRouter.use(requireAuth);

/**
 * GET /api/v1/alerts/stats
 * Aggregate incident and SLA statistics for the organization.
 */
alertRouter.get(
  '/stats',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const stats: AlertStats = await AlertService.getAlertStats(orgId);

      const response: ApiResponse<AlertStats> = {
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
 * GET /api/v1/alerts
 * List paginated alerts with multi-criteria filtering.
 */
alertRouter.get(
  '/',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = alertFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid alert filter query', 'VALIDATION_ERROR');
      }

      const result = await AlertService.listAlerts(
        orgId,
        validation.data as AlertFilterQuery
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

/**
 * GET /api/v1/alerts/:id
 * Retrieve a single alert incident with populated assignments.
 */
alertRouter.get(
  '/:id',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const alert = await AlertService.getAlertById(orgId, alertId);

      if (!alert) {
        throw new AppError(404, 'Alert not found', 'NOT_FOUND');
      }

      const response: ApiResponse<Alert> = {
        success: true,
        data: alert,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/alerts
 * File a manual incident alert or simulate incident triage.
 */
alertRouter.post(
  '/',
  requirePermission('alert.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = createAlertSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid alert payload', 'VALIDATION_ERROR');
      }

      const created = await AlertService.createAlert(
        orgId,
        validation.data,
        req.user?.userId,
        req.user?.email
      );

      const response: ApiResponse<Alert> = {
        success: true,
        data: created,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/alerts/:id/acknowledge
 * Acknowledge an active alert.
 */
alertRouter.post(
  '/:id/acknowledge',
  requirePermission('alert.acknowledge'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const userId = req.user!.userId;
      const note = typeof req.body.note === 'string' ? req.body.note : undefined;

      const updated = await AlertService.acknowledgeAlert(orgId, alertId, userId, note);

      const response: ApiResponse<Alert> = {
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
 * POST /api/v1/alerts/:id/assign
 * Assign an alert to a responsible operator or technician.
 */
alertRouter.post(
  '/:id/assign',
  requirePermission('alert.acknowledge'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const assignerUserId = req.user!.userId;
      const assignedToUserId = req.body.assignedTo || req.body.assignedToUserId;
      const note = typeof req.body.note === 'string' ? req.body.note : undefined;

      if (!assignedToUserId || typeof assignedToUserId !== 'string') {
        throw new AppError(400, 'Target assigned user ID is required', 'VALIDATION_ERROR');
      }

      const updated = await AlertService.assignAlert(
        orgId,
        alertId,
        assignedToUserId,
        assignerUserId,
        note
      );

      const response: ApiResponse<Alert> = {
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
 * POST /api/v1/alerts/:id/status
 * Transition alert status (IN_PROGRESS, RESOLVED, DISMISSED).
 */
alertRouter.post(
  '/:id/status',
  requirePermission('alert.resolve'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const userId = req.user!.userId;
      const validation = updateAlertStatusSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid alert status transition payload', 'VALIDATION_ERROR');
      }

      const updated = await AlertService.updateStatus(
        orgId,
        alertId,
        userId,
        validation.data
      );

      const response: ApiResponse<Alert> = {
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
 * POST /api/v1/alerts/:id/resolve
 * Convenience endpoint for resolving an incident alert.
 */
alertRouter.post(
  '/:id/resolve',
  requirePermission('alert.resolve'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const userId = req.user!.userId;
      const resolutionNotes = typeof req.body.notes === 'string' ? req.body.notes : undefined;

      const updated = await AlertService.updateStatus(orgId, alertId, userId, {
        status: 'RESOLVED',
        resolutionNotes,
      });

      const response: ApiResponse<Alert> = {
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
 * POST /api/v1/alerts/:id/escalate
 * Trigger SLA or manual incident tier escalation.
 */
alertRouter.post(
  '/:id/escalate',
  requirePermission('alert.acknowledge'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const alertId = req.params.id as string;
      const userId = req.user!.userId;
      const validation = escalateAlertSchema.safeParse(req.body);

      const reason = validation.success ? validation.data.reason : undefined;

      const escalated = await AlertService.escalateAlert(
        orgId,
        alertId,
        userId,
        reason
      );

      const response: ApiResponse<Alert> = {
        success: true,
        data: escalated,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
