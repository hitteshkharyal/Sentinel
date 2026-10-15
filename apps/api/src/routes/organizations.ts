// ─────────────────────────────────────────────
// SENTINEL API — Organizations & RBAC Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organization.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '@sentinel/types';

export const organizationRouter = Router();

// All organization routes require authentication
organizationRouter.use(requireAuth);

/**
 * GET /api/v1/organizations
 * List all organizations accessible by current authenticated user
 */
organizationRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
      const orgs = await OrganizationService.getOrganizationsForUser(
        req.user!.userId,
        isSuperAdmin
      );

      const response: ApiResponse<typeof orgs> = {
        success: true,
        data: orgs,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/organizations
 * Create a new organization (user automatically becomes ORGANIZATION_ADMIN)
 */
organizationRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = createOrganizationSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const org = await OrganizationService.createOrganization(
        req.user!.userId,
        validation.data
      );

      const response: ApiResponse<typeof org> = {
        success: true,
        data: org,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/organizations/:id
 * Get single organization details
 */
organizationRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Organization ID is required.');
      }
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
      const result = await OrganizationService.getOrganizationById(
        id,
        req.user!.userId,
        isSuperAdmin
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
 * PATCH /api/v1/organizations/:id
 * Update organization metadata (requires organization.update permission)
 */
organizationRouter.patch(
  '/:id',
  requirePermission('organization.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Organization ID is required.');
      }
      const validation = updateOrganizationSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const updated = await OrganizationService.updateOrganization(
        id,
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
 * DELETE /api/v1/organizations/:id
 * Delete organization (requires organization.delete permission)
 */
organizationRouter.delete(
  '/:id',
  requirePermission('organization.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Organization ID is required.');
      }
      await OrganizationService.deleteOrganization(id);

      res.json({
        success: true,
        data: { message: 'Organization deleted successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// TEAM MEMBERSHIP & RBAC ROUTES
// ─────────────────────────────────────────────

/**
 * GET /api/v1/organizations/:id/members
 * List all team members and roles in an organization (requires member.read)
 */
organizationRouter.get(
  '/:id/members',
  requirePermission('member.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Organization ID is required.');
      }
      const members = await OrganizationService.getMembers(id);

      const response: ApiResponse<typeof members> = {
        success: true,
        data: members,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/organizations/:id/members
 * Invite or add a member to the organization (requires member.create)
 */
organizationRouter.post(
  '/:id/members',
  requirePermission('member.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Organization ID is required.');
      }
      const validation = inviteMemberSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const actorRole = req.orgRole || 'OPERATOR';
      const member = await OrganizationService.addMember(
        id,
        validation.data.email,
        validation.data.role,
        req.user!.userId,
        actorRole,
        validation.data.facilityIds
      );

      const response: ApiResponse<typeof member> = {
        success: true,
        data: member,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/organizations/:id/members/:memberId
 * Update a member's role (requires member.update)
 */
organizationRouter.patch(
  '/:id/members/:memberId',
  requirePermission('member.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const memberId = req.params.memberId;
      if (!id || !memberId) {
        throw new AppError(400, 'Organization ID and Member ID are required.');
      }
      const validation = updateMemberRoleSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const actorRole = req.orgRole || 'OPERATOR';
      const updated = await OrganizationService.updateMemberRole(
        id,
        memberId,
        validation.data.role,
        actorRole
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
 * DELETE /api/v1/organizations/:id/members/:memberId
 * Remove a member from the organization (requires member.delete)
 */
organizationRouter.delete(
  '/:id/members/:memberId',
  requirePermission('member.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const memberId = req.params.memberId;
      if (!id || !memberId) {
        throw new AppError(400, 'Organization ID and Member ID are required.');
      }
      const actorRole = req.orgRole || 'OPERATOR';

      await OrganizationService.removeMember(id, memberId, actorRole);

      res.json({
        success: true,
        data: { message: 'Member removed successfully from organization.' },
      });
    } catch (error) {
      next(error);
    }
  }
);
