// ─────────────────────────────────────────────
// SENTINEL API — Authentication Middleware
// ─────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from './error-handler.js';
import type { AuthTokenPayload } from '@sentinel/types';

// Extend Express Request interface to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(401, 'Authentication required: missing or invalid Authorization header.')
    );
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(new AppError(401, 'Invalid, expired, or malformed authentication token.'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Ignored for optional auth
    }
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) {
      return next(new AppError(401, 'Authentication required.'));
    }
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ORGANIZATION_ADMIN') {
      return next(
        new AppError(
          403,
          'Access forbidden: Administrator privileges required to manage access controls.'
        )
      );
    }
    next();
  });
}

