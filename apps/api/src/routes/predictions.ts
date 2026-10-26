// ─────────────────────────────────────────────
// SENTINEL API — Prediction & Anomaly Detection Router
// Master Prompt Section 41 & Section 48 Day 13
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { PredictionService } from '../services/prediction.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { predictionQuerySchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '@sentinel/types';
import type {
  PredictionOverview,
  Co2Prediction,
  OccupancyPrediction,
  TemperaturePrediction,
  DetectedAnomaly,
  PredictionFilterQuery,
  ForecastHorizonHours,
} from '@sentinel/types';

export const predictionsRouter = Router();

predictionsRouter.use(requireAuth);

/**
 * GET /api/v1/predictions/overview
 * Comprehensive predictive overview (CO2, occupancy, temperature, anomalies)
 */
predictionsRouter.get(
  '/overview',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = predictionQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid prediction query parameters', 'VALIDATION_ERROR');
      }

      const filter: PredictionFilterQuery = {
        organizationId: orgId,
        facilityId: validation.data.facilityId,
        roomId: validation.data.roomId,
        horizonHours: validation.data.horizonHours as ForecastHorizonHours,
        inputWindow: validation.data.inputWindow,
      };

      const data = await PredictionService.getPredictionOverview(orgId, filter);

      const response: ApiResponse<PredictionOverview> = {
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
 * GET /api/v1/predictions/co2
 * Mass-balance CO2 accumulation and ventilation decay forecast
 */
predictionsRouter.get(
  '/co2',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = predictionQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid prediction query parameters', 'VALIDATION_ERROR');
      }

      const filter: PredictionFilterQuery = {
        organizationId: orgId,
        facilityId: validation.data.facilityId,
        roomId: validation.data.roomId,
        horizonHours: validation.data.horizonHours as ForecastHorizonHours,
        inputWindow: validation.data.inputWindow,
      };

      const data = await PredictionService.predictCo2Trend(orgId, filter);

      const response: ApiResponse<Co2Prediction> = {
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
 * GET /api/v1/predictions/occupancy
 * Hourly occupancy headcount curve and pre-cooling advisory
 */
predictionsRouter.get(
  '/occupancy',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = predictionQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid prediction query parameters', 'VALIDATION_ERROR');
      }

      const filter: PredictionFilterQuery = {
        organizationId: orgId,
        facilityId: validation.data.facilityId,
        roomId: validation.data.roomId,
        horizonHours: validation.data.horizonHours as ForecastHorizonHours,
        inputWindow: validation.data.inputWindow,
      };

      const data = await PredictionService.predictOccupancyTrend(orgId, filter);

      const response: ApiResponse<OccupancyPrediction> = {
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
 * GET /api/v1/predictions/temperature
 * Setback thermal decay curve and equilibrium forecasting
 */
predictionsRouter.get(
  '/temperature',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = predictionQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid prediction query parameters', 'VALIDATION_ERROR');
      }

      const filter: PredictionFilterQuery = {
        organizationId: orgId,
        facilityId: validation.data.facilityId,
        roomId: validation.data.roomId,
        horizonHours: validation.data.horizonHours as ForecastHorizonHours,
        inputWindow: validation.data.inputWindow,
      };

      const data = await PredictionService.predictTemperatureTrend(orgId, filter);

      const response: ApiResponse<TemperaturePrediction> = {
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
 * GET /api/v1/predictions/anomalies
 * Statistical anomaly detection across fleet sensors and zones
 */
predictionsRouter.get(
  '/anomalies',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = predictionQuerySchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid prediction query parameters', 'VALIDATION_ERROR');
      }

      const filter: PredictionFilterQuery = {
        organizationId: orgId,
        facilityId: validation.data.facilityId,
        roomId: validation.data.roomId,
        inputWindow: validation.data.inputWindow,
      };

      const data = await PredictionService.detectAnomalies(orgId, filter);

      const response: ApiResponse<DetectedAnomaly[]> = {
        success: true,
        data,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
