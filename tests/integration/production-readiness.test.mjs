// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Production Readiness & Health Diagnostics
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { app } from '../../apps/api/dist/app.js';
import { validateProductionConfig } from '../../apps/api/dist/config.js';
import { DatabaseIndexManager } from '../../apps/api/dist/db/indexes.js';

describe('Production Readiness & Health Diagnostics Integration Tests', () => {
  const testPort = 64555;
  let server;

  before(async () => {
    await connectDatabase();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(testPort, resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  it('should return HTTP 200 and alive status on /health/live probe', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/health/live`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.status, 'alive');
    assert.ok(typeof json.uptime === 'number');
    assert.ok(json.pid > 0);
  });

  it('should return HTTP 200 and ready status on /health/ready probe when database is connected', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/health/ready`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.status, 'ready');
    assert.equal(json.checks.database, 'ok');
    assert.ok(typeof json.checks.dbLatencyMs === 'number');
    assert.equal(json.checks.memory, 'ok');
  });

  it('should return comprehensive diagnostic metrics payload on /health', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/health`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(json.success);
    assert.equal(json.data.status, 'healthy');
    assert.equal(json.data.version, '0.1.0');

    // System metrics
    assert.ok(json.data.system.nodeVersion.startsWith('v'));
    assert.ok(json.data.system.memory.heapUsedMb > 0);
    assert.ok(json.data.system.memory.heapUsagePercent >= 0);

    // Subsystem status
    assert.equal(json.data.services.api.status, 'running');
    assert.equal(json.data.services.database.status, 'connected');
    assert.ok(json.data.services.mqtt.status);
    assert.ok(json.data.services.websocket.path === '/ws/telemetry');
  });

  it('should reject insecure production configurations during boot check', () => {
    const insecureConfig = {
      env: 'production',
      jwt: { secret: 'CHANGE_ME_IN_PRODUCTION', expiry: '7d' },
      mongodb: { uri: 'mongodb://localhost:27017/sentinel' },
      cors: { origin: '*' },
    };

    const result = validateProductionConfig(insecureConfig);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 2);
    assert.ok(result.errors.some((e) => e.includes('JWT_SECRET')));
    assert.ok(result.errors.some((e) => e.includes('CORS_ORIGIN')));
  });

  it('should pass production configuration validation when secrets and origins are strict', () => {
    const validProdConfig = {
      env: 'production',
      jwt: {
        secret: 'a_very_secure_and_cryptographically_sound_key_over_32_characters_long',
        expiry: '15m',
      },
      mongodb: { uri: 'mongodb://sentinel-mongo:27017/sentinel' },
      cors: { origin: 'https://sentinel.enterprise.internal' },
    };

    const result = validateProductionConfig(validProdConfig);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('should synchronize and verify all compound database indexes across collections', async () => {
    const reports = await DatabaseIndexManager.syncAllIndexes();
    assert.ok(reports.length >= 15);

    const errorReports = reports.filter((r) => r.status === 'ERROR');
    assert.equal(errorReports.length, 0, `Index sync errors: ${JSON.stringify(errorReports)}`);

    const stats = await DatabaseIndexManager.getIndexStats();
    assert.ok(stats.telemetries >= 4, 'Telemetry should have compound indexes');
    assert.ok(stats.alerts >= 5, 'Alerts should have compound indexes');
    assert.ok(stats.complianceauditlogs >= 2, 'Compliance audit logs should have compound indexes');
  });
});

