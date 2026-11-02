// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Zero-Trust Security Perimeter
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { app } from '../../apps/api/dist/app.js';
import { generateAccessToken } from '../../apps/api/dist/utils/jwt.js';
import {
  OrganizationModel,
  UserModel,
  SecurityAuditLogModel,
} from '../../apps/api/dist/models/index.js';

describe('Zero-Trust Security Perimeter Integration Tests', () => {
  const testPort = 62555;
  let server;
  let adminToken;
  let orgId;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-sec-${Date.now()}@sentinel.local`,
        displayName: 'Security Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));

    adminToken = generateAccessToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });

    const org = await OrganizationModel.create({
      name: `Security Perimeter Org ${Date.now()}`,
      slug: `sec-perim-${Date.now()}`,
      industry: 'factory',
      createdBy: admin._id,
    });
    orgId = org._id.toString();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(testPort, resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await SecurityAuditLogModel.deleteMany({ organizationId: orgId });
    await OrganizationModel.deleteOne({ _id: orgId });
    await mongoose.disconnect();
  });

  it('should return strict Helmet CSP and rate limit headers on REST responses', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const csp = res.headers.get('content-security-policy');
    const limit = res.headers.get('x-ratelimit-limit');
    const remaining = res.headers.get('x-ratelimit-remaining');

    assert.ok(csp);
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(limit);
    assert.ok(remaining !== null);
  });

  it('should block NoSQL operator injection attacks with HTTP 400 MALFORMED_INPUT', async () => {
    const maliciousPayload = {
      email: { $gt: '' },
      password: 'password123',
    };

    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.error?.code, 'MALFORMED_INPUT');
  });

  it('should execute automated Zero-Trust scan via REST endpoint and return scorecard', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/security/run-audit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-Organization-Id': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deepScan: true }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.success);
    assert.ok(json.data.overallScore >= 70);
    assert.ok(json.data.checks.length >= 6);
  });
});
