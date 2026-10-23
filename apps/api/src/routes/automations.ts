// ─────────────────────────────────────────────
// SENTINEL API — Autonomous Policy & Automation Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { AutomationService } from '../services/automation.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
  automationFilterSchema,
  automationExecutionFilterSchema,
  testAutomationRuleSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type {
  ApiResponse,
  AutomationRule,
  AutomationExecution,
  AutomationStats,
  AutomationFilterQuery,
  AutomationExecutionFilterQuery,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
} from '@sentinel/types';

export const automationRouter = Router();

automationRouter.use(requireAuth);

/**
 * GET /api/v1/automations/stats
 * Aggregate automation metrics (active rules, executions today, energy setbacks).
 */
automationRouter.get(
  '/stats',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      // Seed default rules if organization is new
      await AutomationService.seedDefaultRules(orgId);

      const stats: AutomationStats = await AutomationService.getStats(orgId);
      const response: ApiResponse<AutomationStats> = {
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
 * GET /api/v1/automations/executions
 * Paginated execution audit logs.
 */
automationRouter.get(
  '/executions',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = automationExecutionFilterSchema.safeParse(req.query);

      if (!validation.success) {
        throw new AppError(400, 'Invalid execution filter parameters', 'VALIDATION_ERROR');
      }

      const filter: AutomationExecutionFilterQuery = validation.data;
      const result = await AutomationService.listExecutions(orgId, filter);

      const response: ApiResponse<{
        executions: AutomationExecution[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> = {
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
 * GET /api/v1/automations
 * List paginated automation rules.
 */
automationRouter.get(
  '/',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      // Ensure standard default policies exist
      await AutomationService.seedDefaultRules(orgId);

      const validation = automationFilterSchema.safeParse(req.query);
      if (!validation.success) {
        throw new AppError(400, 'Invalid automation filter parameters', 'VALIDATION_ERROR');
      }

      const filter: AutomationFilterQuery = validation.data as unknown as AutomationFilterQuery;
      const result = await AutomationService.listRules(orgId, filter);

      const response: ApiResponse<{
        rules: AutomationRule[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> = {
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
 * GET /api/v1/automations/:id
 * Retrieve a single rule by ID.
 */
automationRouter.get(
  '/:id',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const ruleId = req.params.id as string;
      const rule = await AutomationService.getRuleById(ruleId, orgId);

      if (!rule) {
        throw new AppError(404, `Automation rule not found: ${ruleId}`);
      }

      const response: ApiResponse<AutomationRule> = {
        success: true,
        data: rule,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/automations
 * Create a new visual automation rule.
 */
automationRouter.post(
  '/',
  requirePermission('automation.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = createAutomationRuleSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid automation rule creation payload', 'VALIDATION_ERROR');
      }

      const dto: CreateAutomationRuleDTO = validation.data as unknown as CreateAutomationRuleDTO;
      const created = await AutomationService.createRule(orgId, dto);

      const response: ApiResponse<AutomationRule> = {
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
 * PUT /api/v1/automations/:id
 * Update an existing rule.
 */
automationRouter.put(
  '/:id',
  requirePermission('automation.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const ruleId = req.params.id as string;
      const validation = updateAutomationRuleSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid automation rule update payload', 'VALIDATION_ERROR');
      }

      const dto: UpdateAutomationRuleDTO = validation.data as unknown as UpdateAutomationRuleDTO;
      const updated = await AutomationService.updateRule(ruleId, orgId, dto);

      if (!updated) {
        throw new AppError(404, `Automation rule not found: ${ruleId}`);
      }

      const response: ApiResponse<AutomationRule> = {
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
 * POST /api/v1/automations/:id/toggle
 * Toggle enabled state of a rule.
 */
automationRouter.post(
  '/:id/toggle',
  requirePermission('automation.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const ruleId = req.params.id as string;
      const toggled = await AutomationService.toggleRule(ruleId, orgId);

      if (!toggled) {
        throw new AppError(404, `Automation rule not found: ${ruleId}`);
      }

      const response: ApiResponse<AutomationRule> = {
        success: true,
        data: toggled,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/automations/:id
 * Delete an automation rule.
 */
automationRouter.delete(
  '/:id',
  requirePermission('automation.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const ruleId = req.params.id as string;
      const deleted = await AutomationService.deleteRule(ruleId, orgId);

      if (!deleted) {
        throw new AppError(404, `Automation rule not found: ${ruleId}`);
      }

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/automations/test
 * Test a rule against a synthetic event in sandbox mode.
 */
automationRouter.post(
  '/test',
  requirePermission('automation.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId!;
      const validation = testAutomationRuleSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(400, 'Invalid test simulation payload', 'VALIDATION_ERROR');
      }

      const result = await AutomationService.testRule(orgId, validation.data);

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
