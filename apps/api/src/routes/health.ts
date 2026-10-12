// ─────────────────────────────────────────────
// SENTINEL API — Health Check Route
// ─────────────────────────────────────────────

import { Router } from 'express';

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
        database: 'not_connected', // Will be updated when MongoDB is configured
        mqtt: 'not_connected', // Will be updated when MQTT is configured
      },
    },
  });
});
