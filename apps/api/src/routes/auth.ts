// ─────────────────────────────────────────────
// SENTINEL API — Authentication Routes
// ─────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '@sentinel/validation';
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
      const result = await AuthService.authenticateWithGoogle(googleUser);

      // Redirect back to frontend with tokens in URL parameters for client-side storage
      const redirectUrl = new URL('/login', config.frontendUrl);
      redirectUrl.searchParams.set('token', result.token);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      if (result.accountLinked) {
        redirectUrl.searchParams.set('linked', 'true');
      }

      res.redirect(redirectUrl.toString());
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
