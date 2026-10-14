// ─────────────────────────────────────────────
// SENTINEL API — Authentication & Access Control Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  loginSchema,
  registerSchema,
  allowlistEmailSchema,
  reviewAccessRequestSchema,
} from '@sentinel/validation';
import {
  verifyGoogleCredential,
  getGoogleUserFromCode,
  googleClient,
} from '../utils/google-auth.js';
import { config } from '../config.js';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '@sentinel/types';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Register with email, password, and display name
 */
authRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const { email, password, displayName } = validation.data;
      const result = await AuthService.register(email, password, displayName);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Log in with email and password
 */
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const { email, password } = validation.data;
      const result = await AuthService.login(email, password);

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
 * POST /api/v1/auth/google
 * Authenticate with Google ID Token (Google Identity Services One-Tap / Button)
 */
authRouter.post(
  '/google',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken, code } = req.body;

      if (!idToken && !code) {
        throw new AppError(
          400,
          'Either Google idToken or authorization code is required.'
        );
      }

      const googleUser = idToken
        ? await verifyGoogleCredential(idToken)
        : await getGoogleUserFromCode(code);

      const result = await AuthService.authenticateWithGoogle(googleUser);

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
 * GET /api/v1/auth/google/url
 * Generate Google OAuth 2.0 authorization URL
 */
authRouter.get('/google/url', (_req: Request, res: Response): void => {
  if (!config.google.clientId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message: 'Google Client ID is not configured on the server.',
      },
    });
    return;
  }

  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });

  res.json({
    success: true,
    data: { url },
  });
});

/**
 * GET /api/v1/auth/google/callback
 * Google OAuth redirect callback endpoint
 */
authRouter.get(
  '/google/callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new AppError(400, 'Missing Google authorization code.');
      }

      const googleUser = await getGoogleUserFromCode(code);

      try {
        const result = await AuthService.authenticateWithGoogle(googleUser);

        // Redirect back to frontend with tokens in URL parameters for client-side storage
        const redirectUrl = new URL('/login', config.frontendUrl);
        redirectUrl.searchParams.set('token', result.token);
        redirectUrl.searchParams.set('refreshToken', result.refreshToken);
        if (result.accountLinked) {
          redirectUrl.searchParams.set('linked', 'true');
        }

        res.redirect(redirectUrl.toString());
      } catch (authError) {
        if (
          authError instanceof AppError &&
          authError.code === 'ACCOUNT_PENDING_APPROVAL'
        ) {
          const redirectUrl = new URL('/login', config.frontendUrl);
          redirectUrl.searchParams.set('pendingApproval', 'true');
          redirectUrl.searchParams.set('email', googleUser.email);
          res.redirect(redirectUrl.toString());
          return;
        }
        throw authError;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/check-status
 * Check approval status of an email (public)
 */
authRouter.get(
  '/check-status',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.query.email as string;
      if (!email) {
        throw new AppError(400, 'email query parameter is required.');
      }

      const status = await AuthService.checkEmailStatus(email);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new AppError(400, 'refreshToken is required.');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Revoke refresh token
 */
authRouter.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken && typeof refreshToken === 'string') {
        await AuthService.revokeToken(refreshToken);
      }

      res.json({
        success: true,
        data: { message: 'Logged out successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Protected endpoint returning the authenticated user profile
 */
authRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const profile = await AuthService.getUserProfile(req.user.userId);

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────
// ADMIN ACCESS CONTROL ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/v1/auth/access-requests
 * Admin: List pending requests and approved allowlist
 */
authRouter.get(
  '/access-requests',
  requireAdmin,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await AuthService.getAccessRequests();
      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/allowlist
 * Admin: Pre-authorize / whitelist an email
 */
authRouter.post(
  '/allowlist',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = allowlistEmailSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          400,
          validation.error.errors.map((e) => e.message).join(', ')
        );
      }

      const { email, role, notes } = validation.data;
      const entry = await AuthService.addToAllowlist(
        email,
        role,
        notes,
        req.user?.userId
      );

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/access-requests/:id/approve
 * Admin: Approve a pending access request
 */
authRouter.post(
  '/access-requests/:id/approve',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Request ID is required.');
      }
      const validation = reviewAccessRequestSchema.safeParse(req.body);
      const role = validation.success ? validation.data.role : undefined;
      const notes = validation.success ? validation.data.notes : undefined;

      const updated = await AuthService.approveAccessRequest(
        id,
        role,
        notes,
        req.user?.userId
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/auth/access-requests/:id/reject
 * Admin: Reject a pending access request
 */
authRouter.post(
  '/access-requests/:id/reject',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Request ID is required.');
      }
      const { notes } = req.body;

      const updated = await AuthService.rejectAccessRequest(
        id,
        notes,
        req.user?.userId
      );

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/auth/allowlist/:id
 * Admin: Revoke allowlist entry
 */
authRouter.delete(
  '/allowlist/:id',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new AppError(400, 'Entry ID is required.');
      }
      await AuthService.revokeAllowlistEntry(id);

      res.json({
        success: true,
        data: { message: 'Access revoked successfully.' },
      });

    } catch (error) {
      next(error);
    }
  }
);
