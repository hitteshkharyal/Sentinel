// ─────────────────────────────────────────────
// SENTINEL API — Compliance & Governance Router (Day 15)
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { ComplianceService } from '../services/compliance.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { updateComplianceProfileSchema, remediateViolationSchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, ComplianceProfile, ComplianceAuditResult } from '@sentinel/types';

export const complianceRouter = Router();

complianceRouter.use(requireAuth);

/**
 * GET /api/v1/compliance/profile
 * Retrieve active regulatory compliance profile for the organization.
 */
complianceRouter.get(
  '/profile',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const profile = await ComplianceService.getOrCreateProfile(orgId);

      const response: ApiResponse<ComplianceProfile> = {
        success: true,
        data: profile,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/compliance/profile
 * Update compliance profile settings (frameworks, strictness, auto-remediation).
 */
complianceRouter.put(
  '/profile',
  requirePermission('organization.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = updateComplianceProfileSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid compliance profile configuration', 'VALIDATION_ERROR');
      }

      const updated = await ComplianceService.updateProfile(orgId, validation.data);

      const response: ApiResponse<ComplianceProfile> = {
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
 * GET /api/v1/compliance/audit
 * Trigger a live compliance evaluation across all rooms, rules, devices, and telemetry.
 */
complianceRouter.get(
  '/audit',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const result = await ComplianceService.evaluateCompliance(orgId);

      const response: ApiResponse<ComplianceAuditResult> = {
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
 * GET /api/v1/compliance/history
 * Retrieve historical audit snapshots.
 */
complianceRouter.get(
  '/history',
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const limit = Number(req.query.limit) || 10;
      const history = await ComplianceService.getAuditHistory(orgId, limit);

      const response: ApiResponse<ComplianceAuditResult[]> = {
        success: true,
        data: history,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/compliance/remediate
 * Resolve or suppress an active compliance violation.
 */
complianceRouter.post(
  '/remediate',
  requirePermission('automation.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = remediateViolationSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid remediation payload', 'VALIDATION_ERROR');
      }

      const outcome = await ComplianceService.remediateViolation(
        orgId,
        validation.data.violationId,
        validation.data.action,
        validation.data.notes
      );

      const response: ApiResponse<{ message: string }> = {
        success: outcome.success,
        data: { message: outcome.message },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
