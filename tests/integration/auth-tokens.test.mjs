// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Auth & Token Lifecycle
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { AuthService } from '../../apps/api/dist/services/auth.service.js';
import {
  UserModel,
  RefreshTokenModel,
  AllowedEmailModel,
  SecurityAuditLogModel,
} from '../../apps/api/dist/models/index.js';
import { generateAccessToken, verifyAccessToken } from '../../apps/api/dist/utils/jwt.js';

describe('Auth & Token Lifecycle Integration Tests', () => {
  const testEmail = `auth-test-${Date.now()}@sentinel.local`;
  const testPassword = 'ZeroTrustPass123!@#';
  let userId = '';

  before(async () => {
    await connectDatabase();
  });

  after(async () => {
    if (userId) {
      await UserModel.deleteOne({ _id: userId });
      await RefreshTokenModel.deleteMany({ userId });
      await AllowedEmailModel.deleteOne({ email: testEmail });
    }
    await mongoose.disconnect();
  });

  it('should register a new user in the system with pre-approval', async () => {
    // Pre-approve email in allowlist
    await AllowedEmailModel.create({
      email: testEmail,
      role: 'OPERATOR',
      status: 'APPROVED',
      displayName: 'Integration Test Operator',
    });

    const regResult = await AuthService.register(
      testEmail,
      testPassword,
      'Integration Test Operator'
    );

    assert.ok(regResult.user);
    assert.equal(regResult.user.email, testEmail);
    assert.equal(regResult.user.status, 'ACTIVE');
    assert.equal(regResult.user.role, 'OPERATOR');
    userId = regResult.user.id;
  });

  it('should log in and issue cryptographically signed JWT and refresh token', async () => {
    const loginResult = await AuthService.login(testEmail, testPassword);

    assert.ok(loginResult.token);
    assert.ok(loginResult.refreshToken);

    // Verify JWT payload
    const decoded = verifyAccessToken(loginResult.token);
    assert.equal(decoded.userId, userId);
    assert.equal(decoded.email, testEmail);
    assert.equal(decoded.role, 'OPERATOR');
    assert.equal(decoded.status, 'ACTIVE');
  });

  it('should rotate refresh token upon token refresh request', async () => {
    const initialLogin = await AuthService.login(testEmail, testPassword);
    const oldRefreshToken = initialLogin.refreshToken;

    const refreshResult = await AuthService.refreshAccessToken(oldRefreshToken);
    assert.ok(refreshResult.token);
    assert.ok(refreshResult.refreshToken);
    assert.notEqual(refreshResult.refreshToken, oldRefreshToken);

    // Verify old refresh token was marked revoked
    const oldDoc = await RefreshTokenModel.findOne({ token: oldRefreshToken });
    assert.ok(oldDoc);
    assert.equal(oldDoc.revoked, true);
  });

  it('should detect token family reuse and invalidate all active tokens for the user', async () => {
    const login = await AuthService.login(testEmail, testPassword);
    const initialToken = login.refreshToken;

    // First rotation (valid)
    const rotated = await AuthService.refreshAccessToken(initialToken);
    assert.ok(rotated.refreshToken);

    // Attacker or replayed client attempts to reuse initialToken (which is now revoked)
    await assert.rejects(
      async () => {
        await AuthService.refreshAccessToken(initialToken);
      },
      (err) => {
        assert.ok(err.message.includes('Refresh token reuse detected'));
        return true;
      }
    );

    // Verify all tokens for this user are now revoked
    const activeTokens = await RefreshTokenModel.countDocuments({
      userId,
      revoked: false,
    });
    assert.equal(activeTokens, 0);

    // Verify security audit log captured the critical token reuse
    const reuseLog = await SecurityAuditLogModel.findOne({
      action: 'TOKEN_REUSE_DETECTED',
      actorId: userId,
    });
    assert.ok(reuseLog);
    assert.equal(reuseLog.severity, 'CRITICAL');
  });
});
