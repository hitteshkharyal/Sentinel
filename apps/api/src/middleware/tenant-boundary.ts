// ─────────────────────────────────────────────
// SENTINEL API — Multi-Tenant Boundary Guard (Day 16)
// ─────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { extractOrganizationId } from './rbac.js';
import { SecurityAuditService } from '../services/security-audit.service.js';

/**
 * Enforce strict multi-tenant boundary checks on incoming requests.
 * Prevents non-superadmin actors from reading or modifying foreign tenant resources.
 */
export function enforceTenantBoundary(orgIdKey = 'organizationId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(); // requireAuth will handle unauthenticated requests
    }

    // Superadmins hold cross-tenant governance privileges
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const requestedOrgId =
      req.params[orgIdKey] ||
      (req.query[orgIdKey] as string) ||
      (req.body && (req.body[orgIdKey] as string));

    if (!requestedOrgId) {
      return next();
    }

    const currentOrgId = req.organizationId || extractOrganizationId(req);
    if (currentOrgId && currentOrgId !== requestedOrgId) {
      void SecurityAuditService.logEvent({
        action: 'CROSS_TENANT_ACCESS_DENIED',
        severity: 'HIGH',
        actorType: 'USER',
        actorId: req.user.userId,
        actorEmail: req.user.email,
        organizationId: currentOrgId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        resource: req.originalUrl,
        status: 'BLOCKED',
        details: {
          currentOrgId,
          attemptedOrgId: requestedOrgId,
          method: req.method,
        },
      });

      return next(
        new AppError(
          'Zero-trust tenant boundary violation: Cross-tenant resource access is forbidden.',
          403,
          'CROSS_TENANT_FORBIDDEN'
        )
      );
    }

    next();
  };
}
