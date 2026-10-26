// ─────────────────────────────────────────────
// SENTINEL API — Analytics & ESG Digital Twin Router
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { analyticsFilterSchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '@sentinel/types';
import type {
  AnalyticsOverview,
  OccupancyAnalytics,
  EnvironmentalAnalytics,
  EsgEnergyAnalytics,
  SlaIncidentAnalytics,
  AutomationPerformanceAnalytics,
  DeviceFleetAnalytics,
} from '@sentinel/types';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

/**
 * GET /api/v1/analytics/overview
 * Comprehensive overview across spatial occupancy, ESG energy savings, SLA, and device health.
 */
analyticsRouter.get(
  '/overview',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const data = await AnalyticsService.getAnalyticsOverview(orgId, validation.data);

      const response: ApiResponse<AnalyticsOverview> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/occupancy
 * Real-time room utilization and hourly occupancy trend.
 */
analyticsRouter.get(
  '/occupancy',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const { start, end } = AnalyticsService.getTimeRange(validation.data);
      const data = await AnalyticsService.getOccupancyAnalytics(
        orgId,
        start,
        end,
        validation.data
      );

      const response: ApiResponse<OccupancyAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/environment
 * Indoor environmental quality metrics, CO2 hazard exposure, and thermal comfort compliance.
 */
analyticsRouter.get(
  '/environment',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const { start, end } = AnalyticsService.getTimeRange(validation.data);
      const data = await AnalyticsService.getEnvironmentalAnalytics(
        orgId,
        start,
        end,
        validation.data
      );

      const response: ApiResponse<EnvironmentalAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/esg
 * ESG Digital Twin: Energy conservation, cost reduction, and carbon offset from autonomous setback.
 */
analyticsRouter.get(
  '/esg',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const { start, end } = AnalyticsService.getTimeRange(validation.data);
      const data = await AnalyticsService.getEsgEnergyAnalytics(
        orgId,
        start,
        end,
        validation.data
      );

      const response: ApiResponse<EsgEnergyAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/sla
 * SLA Incident response metrics, Mean Time to Acknowledge (MTTA), and escalation rates.
 */
analyticsRouter.get(
  '/sla',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const { start, end } = AnalyticsService.getTimeRange(validation.data);
      const data = await AnalyticsService.getSlaIncidentAnalytics(
        orgId,
        start,
        end,
        validation.data
      );

      const response: ApiResponse<SlaIncidentAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/automation
 * Performance, execution frequency, and action distribution of autonomous rules.
 */
analyticsRouter.get(
  '/automation',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const { start, end } = AnalyticsService.getTimeRange(validation.data);
      const data = await AnalyticsService.getAutomationPerformanceAnalytics(
        orgId,
        start,
        end,
        validation.data
      );

      const response: ApiResponse<AutomationPerformanceAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/devices
 * Device fleet uptime, Wi-Fi RSSI signal quality, and sensor catalog operational health.
 */
analyticsRouter.get(
  '/devices',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = analyticsFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid analytics filter parameters', 'VALIDATION_ERROR');
      }

      const data = await AnalyticsService.getDeviceFleetAnalytics(orgId, validation.data);

      const response: ApiResponse<DeviceFleetAnalytics> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
