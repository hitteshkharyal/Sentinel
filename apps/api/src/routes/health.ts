// ─────────────────────────────────────────────
// SENTINEL API — Production Health & Diagnostic Probes
// ─────────────────────────────────────────────

import { Router } from 'express';
import os from 'node:os';
import mongoose from 'mongoose';
import { isDatabaseConnected } from '../db.js';
import { config } from '../config.js';
import { MqttService } from '../services/mqtt.service.js';
import { WebSocketService } from '../services/websocket.service.js';

export const healthRouter = Router();

/**
 * GET /api/v1/health/network
 * Returns host local IPv4 addresses so UI can pre-fill device firmware server URLs accurately
 */
healthRouter.get('/network', (_req, res): void => {
  const interfaces = os.networkInterfaces();
  const addresses: { interface: string; ip: string; isWiFi: boolean; isEthernet: boolean }[] = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        const lowerName = name.toLowerCase();
        addresses.push({
          interface: name,
          ip: net.address,
          isWiFi: lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan'),
          isEthernet: lowerName.includes('ethernet') || lowerName.includes('eth'),
        });
      }
    }
  }

  // Prioritize Wi-Fi interface, then Ethernet, then other LAN interfaces
  addresses.sort((a, b) => (b.isWiFi ? 1 : 0) - (a.isWiFi ? 1 : 0));

  const primaryIp = addresses[0]?.ip || 'localhost';
  const port = config.port;

  res.status(200).json({
    success: true,
    data: {
      primaryIp,
      port,
      recommendedServerUrl: `http://${primaryIp}:${port}`,
      interfaces: addresses,
    },
  });
});

/**
 * GET /api/v1/health/live
 * Kubernetes / Docker Liveness Probe.
 * Fast check confirming the process is alive and responsive.
 */
healthRouter.get('/live', (_req, res): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

/**
 * GET /api/v1/health/ready
 * Kubernetes / Docker Readiness Probe.
 * Verifies core dependencies (database, memory) before accepting traffic.
 */
healthRouter.get('/ready', async (_req, res): Promise<void> => {
  const isDbReady = isDatabaseConnected();
  let dbLatencyMs = -1;

  if (isDbReady && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - start;
    } catch {
      res.status(503).json({
        status: 'unready',
        error: 'Database ping failed',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  } else {
    res.status(503).json({
      status: 'unready',
      error: 'Database not connected',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Memory pressure safeguard
  const mem = process.memoryUsage();
  const heapUsagePercent = (mem.heapUsed / mem.heapTotal) * 100;

  if (heapUsagePercent > 98) {
    res.status(503).json({
      status: 'unready',
      error: 'Critical memory pressure',
      heapUsagePercent: Math.round(heapUsagePercent),
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok',
      dbLatencyMs,
      memory: 'ok',
      heapUsagePercent: Math.round(heapUsagePercent),
    },
  });
});

/**
 * GET /api/v1/health
 * Comprehensive Diagnostic Health & Metrics Overview.
 */
healthRouter.get('/', async (_req, res): Promise<void> => {
  const isDbReady = isDatabaseConnected();
  let dbLatencyMs = -1;

  if (isDbReady && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - start;
    } catch {
      dbLatencyMs = -1;
    }
  }

  const mqttStatus = MqttService.getStatus();
  const wsStatus = WebSocketService.getStatus();
  const mem = process.memoryUsage();
  const heapUsagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  const overallStatus =
    isDbReady && (dbLatencyMs < 2000 || dbLatencyMs === -1)
      ? 'healthy'
      : 'degraded';

  res.json({
    success: true,
    data: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
      environment: config.env,
      system: {
        nodeVersion: process.version,
        pid: process.pid,
        memory: {
          rssMb: Math.round(mem.rss / (1024 * 1024)),
          heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
          heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
          heapUsagePercent,
        },
      },
      services: {
        api: { status: 'running', port: config.port },
        database: {
          status: isDbReady ? 'connected' : 'disconnected',
          latencyMs: dbLatencyMs,
        },
        mqtt: {
          status: mqttStatus.isRunning ? 'online' : 'standalone_or_external',
          port: mqttStatus.port,
          embedded: mqttStatus.isRunning,
        },
        websocket: {
          status: wsStatus.isRunning ? 'online' : 'offline',
          clientCount: wsStatus.clientCount,
          path: '/ws/telemetry',
        },
      },
    },
  });
});
