// ─────────────────────────────────────────────
// SENTINEL API — Deployment Center & Firmware Generator Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { DeploymentService } from '../services/deployment.service.js';
import { DeploymentTemplateService } from '../services/deployment-template.service.js';
import { FirmwareGeneratorService } from '../services/firmware-generator.service.js';
import { HardwareTestService } from '../services/hardware-test.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import {
  createDeploymentSchema,
  updateDeploymentSchema,
  deploymentHardwareConfigSchema,
  generateFirmwareSchema,
} from '@sentinel/validation';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, DeploymentStatus, IndustryType } from '@sentinel/types';

export const deploymentRouter = Router();

// Apply authentication to all deployment endpoints
deploymentRouter.use(requireAuth);

/**
 * GET /api/v1/deployments/templates
 * Retrieve available sector deployment templates.
 */
deploymentRouter.get(
  '/templates',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const industry = req.query.industry as IndustryType | undefined;
      const templates = industry
        ? DeploymentTemplateService.getTemplatesByIndustry(industry)
        : DeploymentTemplateService.getAllTemplates();

      const response: ApiResponse<typeof templates> = {
        success: true,
        data: templates,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments/validate-hardware
 * Pre-flight validation of hardware pins, conflicts, and power draw.
 */
deploymentRouter.post(
  '/validate-hardware',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedHw = deploymentHardwareConfigSchema.parse(req.body);
      const result = DeploymentService.validateHardwareConfig(parsedHw);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments
 * Create a new deployment configuration.
 */
deploymentRouter.post(
  '/',
  requirePermission('deployment.create'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const userId = req.user!.userId;
      const parsedDto = createDeploymentSchema.parse(req.body);

      const deployment = await DeploymentService.createDeployment(
        organizationId,
        userId,
        parsedDto
      );

      const response: ApiResponse<typeof deployment> = {
        success: true,
        data: deployment,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments
 * List deployments with filtering and search.
 */
deploymentRouter.get(
  '/',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { industry, status, facilityId, search, limit, offset } = req.query;

      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;

      const result = await DeploymentService.getDeployments(organizationId, {
        industry: industry as string | undefined,
        status: status as DeploymentStatus | undefined,
        facilityId: facilityId as string | undefined,
        search: search as string | undefined,
        limit: limitNum,
        offset: offsetNum,
      });

      const pageNum = Math.floor(offsetNum / limitNum) + 1;
      const totalPages = Math.ceil(result.total / limitNum) || 1;

      const response: ApiResponse<typeof result.deployments> = {
        success: true,
        data: result.deployments,
        meta: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages,
        },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments/:id
 * Retrieve specific deployment details.
 */
deploymentRouter.get(
  '/:id',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const deployment = await DeploymentService.getDeploymentById(
        organizationId,
        deploymentId
      );

      const response: ApiResponse<typeof deployment> = {
        success: true,
        data: deployment,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/deployments/:id
 * Update deployment configuration.
 */
deploymentRouter.put(
  '/:id',
  requirePermission('deployment.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const parsedDto = updateDeploymentSchema.parse(req.body);

      const updated = await DeploymentService.updateDeployment(
        organizationId,
        deploymentId,
        parsedDto
      );

      const response: ApiResponse<typeof updated> = {
        success: true,
        data: updated,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/deployments/:id
 * Delete a deployment.
 */
deploymentRouter.delete(
  '/:id',
  requirePermission('deployment.delete'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const result = await DeploymentService.deleteDeployment(
        organizationId,
        deploymentId
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments/:id/firmware/generate
 * Trigger dynamic PlatformIO firmware project generation.
 */
deploymentRouter.post(
  '/:id/firmware/generate',
  requirePermission('firmware.generate'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const userId = req.user!.userId;
      const parsed = generateFirmwareSchema.safeParse(req.body);
      const requestedVersion = parsed.success && parsed.data.version
        ? parsed.data.version
        : '1.0.0';

      const artifact = await FirmwareGeneratorService.generateFirmware(
        organizationId,
        deploymentId,
        userId,
        requestedVersion
      );

      const response: ApiResponse<typeof artifact> = {
        success: true,
        data: artifact,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments/:id/firmware/artifacts
 * List firmware builds for a deployment.
 */
deploymentRouter.get(
  '/:id/firmware/artifacts',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const artifacts = await FirmwareGeneratorService.getArtifactsForDeployment(
        organizationId,
        deploymentId
      );

      const response: ApiResponse<typeof artifacts> = {
        success: true,
        data: artifacts,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments/:id/firmware/artifacts/:artifactId
 * Retrieve specific firmware build artifact manifest.
 */
deploymentRouter.get(
  '/:id/firmware/artifacts/:artifactId',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const artifactId = req.params.artifactId as string;
      const artifact = await FirmwareGeneratorService.getArtifactById(
        organizationId,
        artifactId
      );

      const response: ApiResponse<typeof artifact> = {
        success: true,
        data: artifact,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments/:id/firmware/artifacts/:artifactId/download
 * Download PlatformIO project as ZIP file.
 */
deploymentRouter.get(
  '/:id/firmware/artifacts/:artifactId/download',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const artifactId = req.params.artifactId as string;
      const { buffer, filename } =
        await FirmwareGeneratorService.getFirmwareZipBuffer(
          organizationId,
          artifactId
        );

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments/:id/provision
 * Provision device credentials and register hardware node for deployment.
 */
deploymentRouter.post(
  '/:id/provision',
  requirePermission('deployment.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const userId = req.user!.userId;

      const result = await DeploymentService.provisionDevice(
        organizationId,
        deploymentId,
        userId
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments/:id/test/start
 * Initiate or re-run diagnostic hardware scorecard test.
 */
deploymentRouter.post(
  '/:id/test/start',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const userId = req.user!.userId;
      const simulate =
        req.query.simulate === 'true' || req.body?.simulate === true;

      const scorecard = await HardwareTestService.runDiagnosticTest(
        organizationId,
        deploymentId,
        userId,
        simulate
      );

      const response: ApiResponse<typeof scorecard> = {
        success: true,
        data: scorecard,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/deployments/:id/test/status
 * Get current test scorecard status.
 */
deploymentRouter.get(
  '/:id/test/status',
  requirePermission('deployment.read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const scorecard = await HardwareTestService.getLatestScorecard(
        organizationId,
        deploymentId
      );

      if (!scorecard) {
        throw new AppError(404, 'No test session found for this deployment.');
      }

      const response: ApiResponse<typeof scorecard> = {
        success: true,
        data: scorecard,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/deployments/:id/test/signoff
 * Final installer sign-off for deployment readiness.
 */
deploymentRouter.post(
  '/:id/test/signoff',
  requirePermission('deployment.update'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const deploymentId = req.params.id as string;
      const userId = req.user!.userId;
      const { sessionId, notes } = req.body;

      if (!sessionId) {
        throw new AppError(400, 'sessionId is required for sign-off.');
      }

      const scorecard = await HardwareTestService.signOffTestSession(
        organizationId,
        deploymentId,
        sessionId,
        userId,
        notes
      );

      const response: ApiResponse<typeof scorecard> = {
        success: true,
        data: scorecard,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);
