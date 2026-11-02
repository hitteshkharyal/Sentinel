// ─────────────────────────────────────────────
// SENTINEL API — Sliding-Window Rate Limiter Middleware (Day 16)
// ─────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';
import { SecurityAuditService } from '../services/security-audit.service.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates an in-memory sliding window rate limiter middleware.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) =>
      req.ip ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip',
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Periodically sweep expired entries every 30 seconds
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 30_000);

  // Unref interval so it does not block Node process exit
  if (sweepInterval.unref) {
    sweepInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || record.resetTime <= now) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil(record.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));

      // Asynchronously record security breach
      void SecurityAuditService.logEvent({
        action: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        actorType: req.user ? 'USER' : 'ANONYMOUS',
        actorId: req.user?.userId,
        actorEmail: req.user?.email,
        ipAddress: key,
        userAgent: req.headers['user-agent'],
        resource: req.originalUrl,
        status: 'BLOCKED',
        details: {
          key,
          observedCount: record.count,
          allowedLimit: max,
          windowMs,
        },
      });

      return next(new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
}

// ── Default Enterprise Pre-configured Rate Limiters ──

/**
 * General API Limiter: 120 req / 60 seconds
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API rate limit exceeded. Please wait a moment before trying again.',
});

/**
 * Auth Brute-Force Limiter: 10 req / 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
});

/**
 * High-Throughput Telemetry Ingest Limiter: 300 req / 60 seconds
 */
export const telemetryRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Telemetry ingestion threshold exceeded for this device or origin.',
  keyGenerator: (req: Request) => {
    const deviceToken = req.headers['x-device-token'] as string;
    if (deviceToken) return `dev_${deviceToken.substring(0, 15)}`;
    return (
      req.ip ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      'unknown-ip'
    );
  },
});
