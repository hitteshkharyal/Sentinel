// ─────────────────────────────────────────────
// SENTINEL API — Express Application Setup
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
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// ── Security ──
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// ── Body Parsing ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

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


// ── Placeholder route stubs (will be implemented in later phases) ──
app.get('/api/v1', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SENTINEL API',
      version: '0.1.0',
      description: 'Privacy-Preserving Autonomous Sensor Intelligence & Automation Platform',
    },
  });
});

// ── Error Handling ──
app.use(errorHandler);

export { app };
