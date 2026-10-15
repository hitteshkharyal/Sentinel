// ─────────────────────────────────────────────
// SENTINEL API — Organization RBAC Middleware
// ─────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { MembershipModel, IMembershipDocument } from '../models/Membership.js';
import { hasPermission } from '@sentinel/shared';
import { AppError } from './error-handler.js';
import type { Permission, Role } from '@sentinel/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      organizationId?: string;
      orgRole?: Role;
      membership?: IMembershipDocument;
    }
  }
}

/**
 * Resolve the organization ID from headers, route parameters, or query parameters
 */
export function extractOrganizationId(req: Request): string | undefined {
  const header = req.headers['x-organization-id'] as string;
  if (header) return header.trim();

  if (req.params.organizationId) return req.params.organizationId.trim();
  if (req.params.orgId) return req.params.orgId.trim();
  if (req.query.orgId) return (req.query.orgId as string).trim();
  if (req.query.organizationId) return (req.query.organizationId as string).trim();

  // If the route is /organizations/:id, the param is named 'id'
  if (req.baseUrl.includes('/organizations') && req.params.id) {
    return req.params.id.trim();
  }

  return undefined;
}

/**
 * Middleware ensuring user is a member of the organization specified by context
 */
export async function resolveOrgMembership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'Authentication required.');
    }

    const orgId = extractOrganizationId(req);
    if (!orgId) {
      throw new AppError(
        400,
        'Organization context missing. Provide X-Organization-Id header or organizationId parameter.'
      );
    }

    req.organizationId = orgId;

    // Super Admin has universal access
    if (req.user.role === 'SUPER_ADMIN') {
      req.orgRole = 'SUPER_ADMIN';
      return next();
    }

    const membership = await MembershipModel.findOne({
      userId: req.user.userId,
      organizationId: orgId,
      status: 'ACTIVE',
    });

    if (!membership) {
      throw new AppError(
        403,
        'Access denied: You are not an active member of this organization.'
      );
    }

    req.membership = membership;
    req.orgRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware requiring specific granular permission within an organization
 */
export function requirePermission(permission: Permission | Permission[]) {
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // First ensure membership and organization context are resolved
    if (!req.orgRole) {
      await resolveOrgMembership(req, res, (err) => {
        if (err) return next(err);
        evaluate();
      });
    } else {
      evaluate();
    }

    function evaluate() {
      const role = req.orgRole;
      if (!role) {
        return next(new AppError(403, 'Organization role not found.'));
      }

      if (role === 'SUPER_ADMIN') {
        return next();
      }

      const hasAll = requiredPermissions.every((p) => hasPermission(role, p));
      if (!hasAll) {
        return next(
          new AppError(
            403,
            `Forbidden: Your role (${role}) lacks the required permission: ${requiredPermissions.join(', ')}.`
          )
        );
      }

      next();
    }
  };
}

/**
 * Middleware requiring specific role(s) within the organization
 */
export function requireOrgRole(allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.orgRole) {
      await resolveOrgMembership(req, res, (err) => {
        if (err) return next(err);
        checkRole();
      });
    } else {
      checkRole();
    }

    function checkRole() {
      const role = req.orgRole;
      if (!role) {
        return next(new AppError(403, 'Organization role not found.'));
      }

      if (role === 'SUPER_ADMIN' || allowedRoles.includes(role)) {
        return next();
      }

      return next(
        new AppError(
          403,
          `Forbidden: Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${role}.`
        )
      );
    }
  };
}
