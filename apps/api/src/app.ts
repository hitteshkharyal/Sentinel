// ─────────────────────────────────────────────
// SENTINEL API — Express Application Setup (Day 16 Hardened)
// ─────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { organizationRouter } from './routes/organizations.js';
import { facilityRouter } from './routes/facilities.js';
import { roomRouter } from './routes/rooms.js';
import { sensorRouter } from './routes/sensors.js';
import { deviceRouter } from './routes/devices.js';
import { telemetryRouter } from './routes/telemetry.js';
import { eventRouter } from './routes/events.js';
import { automationRouter } from './routes/automations.js';
import { alertRouter } from './routes/alerts.js';
import { analyticsRouter } from './routes/analytics.js';
import { predictionsRouter } from './routes/predictions.js';
import { complianceRouter } from './routes/compliance.js';
import { policiesRouter } from './routes/policies.js';
import { securityRouter } from './routes/security.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRateLimiter, authRateLimiter, telemetryRateLimiter } from './middleware/rate-limiter.js';
import { sanitizeInputs } from './middleware/sanitize.js';

const app = express();

// ── Security Hardening (Helmet CSP & Strict Transport) ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// ── Body Parsing & Input Sanitization ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInputs);

// ── General API Rate Limiting ──
app.use('/api/v1', apiRateLimiter);

// ── Endpoint-Specific Rate Limiters ──
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/register', authRateLimiter);
app.use('/api/v1/telemetry', telemetryRateLimiter);

// ── Routes ──
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationRouter);
app.use('/api/v1/facilities', facilityRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/sensors', sensorRouter);
app.use('/api/v1/devices', deviceRouter);
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/automations', automationRouter);
app.use('/api/v1/alerts', alertRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/predictions', predictionsRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/policies', policiesRouter);
app.use('/api/v1/security', securityRouter);

// ── Info Endpoint ──
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SENTINEL API',
      version: '0.1.0',
      description: 'Privacy-Preserving Autonomous Sensor Intelligence & Automation Platform',
      security: {
        zeroTrust: true,
        rateLimiting: true,
        csp: true,
        sanitization: true,
      },
    },
  });
});

// ── Error Handling ──
app.use(errorHandler);

export { app };
