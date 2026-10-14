// ─────────────────────────────────────────────
// SENTINEL API — Health Check Route
// ─────────────────────────────────────────────

import { Router } from 'express';
import { isDatabaseConnected } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
      services: {
        api: 'running',
        database: isDatabaseConnected() ? 'connected' : 'not_connected',
        mqtt: 'not_connected', // Will be updated in Day 8
      },
    },
  });
});
