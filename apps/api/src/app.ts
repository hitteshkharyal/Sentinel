// ─────────────────────────────────────────────
// SENTINEL API — Express Application Setup
// ─────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
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
