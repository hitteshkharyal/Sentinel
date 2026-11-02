// ─────────────────────────────────────────────
// SENTINEL API — Industry Policy Templates Router (Day 15)
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { IndustryPolicyService } from '../services/industry-policy.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { applyIndustryPolicyPackSchema } from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  IndustryPolicyTemplate,
  PolicyPack,
  PolicyPackApplicationResult,
  IndustryType,
  ComplianceFramework,
} from '@sentinel/types';

export const policiesRouter = Router();

policiesRouter.use(requireAuth);

/**
 * GET /api/v1/policies/packs
 * List all available enterprise industry policy packs across all 8 sectors.
 */
policiesRouter.get(
  '/packs',
  requirePermission('automation.read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const packs = IndustryPolicyService.getPolicyPacks();
      const response: ApiResponse<PolicyPack[]> = {
        success: true,
        data: packs,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/policies/packs/:industry
 * Retrieve policy pack for a specific sector.
 */
policiesRouter.get(
  '/packs/:industry',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const industry = req.params.industry as IndustryType;
      const pack = IndustryPolicyService.getPolicyPackForIndustry(industry);

      if (!pack) {
        throw new AppError(404, `No policy pack found for industry '${industry}'`, 'NOT_FOUND');
      }

      const response: ApiResponse<PolicyPack> = {
        success: true,
        data: pack,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/policies/templates
 * Query policy templates with optional industry or compliance framework filtering.
 */
policiesRouter.get(
  '/templates',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const industry = req.query.industry as IndustryType | undefined;
      const framework = req.query.framework as ComplianceFramework | undefined;

      const templates = IndustryPolicyService.getTemplates({ industry, framework });

      const response: ApiResponse<IndustryPolicyTemplate[]> = {
        success: true,
        data: templates,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/policies/templates/:id
 * Retrieve a single policy template.
 */
policiesRouter.get(
  '/templates/:id',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templateId = req.params.id;
      if (!templateId) {
        throw new AppError(400, 'Template ID is required', 'BAD_REQUEST');
      }
      const template = IndustryPolicyService.getTemplateById(templateId);

      if (!template) {
        throw new AppError(404, `Policy template '${templateId}' not found`, 'NOT_FOUND');
      }

      const response: ApiResponse<IndustryPolicyTemplate> = {
        success: true,
        data: template,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/policies/apply-pack
 * 1-Click Deploy an industry policy pack for the current organization.
 */
policiesRouter.post(
  '/apply-pack',
  requirePermission('automation.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = applyIndustryPolicyPackSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid policy pack parameters', 'VALIDATION_ERROR');
      }

      const result = await IndustryPolicyService.applyPolicyPack(
        orgId,
        validation.data.industry as IndustryType,
        {
          industry: validation.data.industry as IndustryType,
          overwriteExisting: validation.data.overwriteExisting,
          enableRulesImmediately: validation.data.enableRulesImmediately,
        }
      );

      const response: ApiResponse<PolicyPackApplicationResult> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
