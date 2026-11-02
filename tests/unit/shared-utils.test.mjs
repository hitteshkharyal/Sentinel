// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Shared Utilities & RBAC
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  MQTT_TOPICS,
  SECURITY_CONFIG,
  hasPermission,
} from '../../packages/shared/dist/index.js';

describe('Shared Utilities & RBAC Unit Tests', () => {
  it('should grant SUPER_ADMIN all core administrative and audit permissions', () => {
    assert.equal(hasPermission('SUPER_ADMIN', 'organization.create'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'organization.delete'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'device.register'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'automation.create'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'audit.read'), true);
  });

  it('should restrict VIEWER to read-only permissions', () => {
    assert.equal(hasPermission('VIEWER', 'organization.read'), true);
    assert.equal(hasPermission('VIEWER', 'telemetry.read'), true);
    assert.equal(hasPermission('VIEWER', 'device.register'), false);
    assert.equal(hasPermission('VIEWER', 'automation.create'), false);
    assert.equal(hasPermission('VIEWER', 'organization.delete'), false);
  });

  it('should enforce role hierarchy relationships', () => {
    assert.ok(ROLE_HIERARCHY.SUPER_ADMIN > ROLE_HIERARCHY.ORGANIZATION_ADMIN);
    assert.ok(ROLE_HIERARCHY.ORGANIZATION_ADMIN > ROLE_HIERARCHY.FACILITY_ADMIN);
    assert.ok(ROLE_HIERARCHY.FACILITY_ADMIN > ROLE_HIERARCHY.OPERATOR);
    assert.ok(ROLE_HIERARCHY.OPERATOR > ROLE_HIERARCHY.VIEWER);
    assert.equal(ROLE_HIERARCHY.SUPER_ADMIN, 100);
    assert.equal(ROLE_HIERARCHY.VIEWER, 10);
  });

  it('should verify standard 5-part MQTT topic templates', () => {
    assert.equal(MQTT_TOPICS.telemetry, 'sentinel/{orgId}/{facilityId}/{deviceId}/telemetry');
    assert.equal(MQTT_TOPICS.status, 'sentinel/{orgId}/{facilityId}/{deviceId}/status');
    assert.equal(MQTT_TOPICS.command, 'sentinel/{orgId}/{facilityId}/{deviceId}/command');
    assert.equal(MQTT_TOPICS.config, 'sentinel/{orgId}/{facilityId}/{deviceId}/config');
    assert.equal(MQTT_TOPICS.ack, 'sentinel/{orgId}/{facilityId}/{deviceId}/ack');
  });

  it('should maintain strict security configuration parameters', () => {
    assert.ok(SECURITY_CONFIG.BCRYPT_SALT_ROUNDS >= 12);
    assert.ok(SECURITY_CONFIG.MIN_PASSWORD_LENGTH >= 8);
    assert.equal(SECURITY_CONFIG.RATE_LIMITS.AUTH_MAX_REQUESTS, 10);
    assert.equal(SECURITY_CONFIG.RATE_LIMITS.API_MAX_REQUESTS, 120);
    assert.equal(SECURITY_CONFIG.RATE_LIMITS.TELEMETRY_MAX_REQUESTS, 300);
  });
});

