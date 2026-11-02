// ─────────────────────────────────────────────
// SENTINEL API — Security & Zero-Trust Audit Router (Day 16)
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { SecurityAuditService } from '../services/security-audit.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission, extractOrganizationId } from '../middleware/rbac.js';
import { securityAuditFilterSchema, runSecurityAuditScanSchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  SecurityAuditLog,
  SecurityOverviewMetrics,
  SecurityAuditScanResult,
} from '@sentinel/types';

export const securityRouter = Router();

securityRouter.use(requireAuth);

/**
 * GET /api/v1/security/overview
 * Retrieve 24-hour security health, blocked threats count, and Zero-Trust posture status.
 */
securityRouter.get(
  '/overview',
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || extractOrganizationId(req);
      const metrics = await SecurityAuditService.getSecurityOverview(orgId);

      const response: ApiResponse<SecurityOverviewMetrics> = {
        success: true,
        data: metrics,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/security/audit-logs
 * Query filtered and paginated security audit events.
 */
securityRouter.get(
  '/audit-logs',
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || extractOrganizationId(req);
      const validation = securityAuditFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid security audit query parameters.', 'VALIDATION_ERROR');
      }

      const result = await SecurityAuditService.queryAuditLogs(orgId, validation.data);

      const response: ApiResponse<SecurityAuditLog[]> = {
        success: true,
        data: result.data,
        meta: result.meta,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/security/threats
 * Retrieve top recent blocked security threats and high-severity incidents.
 */
securityRouter.get(
  '/threats',
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || extractOrganizationId(req);
      const result = await SecurityAuditService.queryAuditLogs(orgId, {
        limit: 10,
        page: 1,
        severity: 'HIGH',
      });

      const response: ApiResponse<SecurityAuditLog[]> = {
        success: true,
        data: result.data,
        meta: result.meta,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/security/run-audit
 * Trigger an automated zero-trust security scan across all credentials, MQTT boundaries, and configurations.
 */
securityRouter.post(
  '/run-audit',
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || extractOrganizationId(req);
      if (!orgId) {
        throw new AppError(400, 'Organization context required for security audit scan.');
      }

      runSecurityAuditScanSchema.parse(req.body || {});
      const scanResult = await SecurityAuditService.runAutomatedSecurityScan(orgId);

      const response: ApiResponse<SecurityAuditScanResult> = {
        success: true,
        data: scanResult,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
