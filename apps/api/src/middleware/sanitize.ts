// ─────────────────────────────────────────────
// SENTINEL API — NoSQL Injection & Input Sanitizer (Day 16)
// ─────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { SecurityAuditService } from '../services/security-audit.service.js';

/**
 * Recursively scans an object for forbidden MongoDB operator keys ($gt, $where, etc.)
 */
function containsMongoOperators(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const match = containsMongoOperators(item);
      if (match) return match;
    }
    return null;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      return key;
    }
    const nested = containsMongoOperators(value);
    if (nested) return nested;
  }

  return null;
}

/**
 * Express middleware protecting against MongoDB operator injection attacks in query and body.
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  // Check req.query
  if (req.query) {
    const queryViolation = containsMongoOperators(req.query);
    if (queryViolation) {
      void SecurityAuditService.logEvent({
        action: 'SUSPICIOUS_PAYLOAD_BLOCKED',
        severity: 'HIGH',
        actorType: req.user ? 'USER' : 'ANONYMOUS',
        actorId: req.user?.userId,
        actorEmail: req.user?.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        resource: req.originalUrl,
        status: 'BLOCKED',
        details: {
          location: 'query',
          flaggedKey: queryViolation,
        },
      });

      return next(
        new AppError(
          `Security violation: Suspicious query parameter "${queryViolation}" rejected.`,
          400,
          'MALFORMED_INPUT'
        )
      );
    }
  }

  // Check req.body
  if (req.body && typeof req.body === 'object') {
    const bodyViolation = containsMongoOperators(req.body);
    if (bodyViolation) {
      void SecurityAuditService.logEvent({
        action: 'SUSPICIOUS_PAYLOAD_BLOCKED',
        severity: 'HIGH',
        actorType: req.user ? 'USER' : 'ANONYMOUS',
        actorId: req.user?.userId,
        actorEmail: req.user?.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        resource: req.originalUrl,
        status: 'BLOCKED',
        details: {
          location: 'body',
          flaggedKey: bodyViolation,
        },
      });

      return next(
        new AppError(
          `Security violation: Suspicious body payload property "${bodyViolation}" rejected.`,
          400,
          'MALFORMED_INPUT'
        )
      );
    }
  }

  next();
}
