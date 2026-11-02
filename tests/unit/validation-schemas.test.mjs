// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Zod Validation Schemas
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSchema,
  registerSchema,
  createOrganizationSchema,
  createFacilitySchema,
  createRoomSchema,
  registerDeviceSchema,
  telemetryMessageSchema,
  createAutomationRuleSchema,
  securityAuditFilterSchema,
  runSecurityAuditScanSchema,
} from '../../packages/validation/dist/index.js';

describe('Zod Validation Schemas Unit Tests', () => {
  it('should validate valid user registration payload', () => {
    const valid = {
      email: 'engineer@sentinel.local',
      password: 'StrongPassword123!',
      displayName: 'Staff Engineer',
    };
    const result = registerSchema.safeParse(valid);
    assert.equal(result.success, true);
  });

  it('should reject registration with invalid email or weak password', () => {
    const invalidEmail = { email: 'not-an-email', password: 'ValidPassword123!', displayName: 'Test' };
    assert.equal(registerSchema.safeParse(invalidEmail).success, false);

    const weakPassword = { email: 'valid@sentinel.local', password: 'short', displayName: 'Test' };
    assert.equal(registerSchema.safeParse(weakPassword).success, false);
  });

  it('should validate organization creation schema', () => {
    const validOrg = {
      name: 'Apex Robotics Logistics',
      slug: 'apex-robotics',
      industry: 'warehouse',
    };
    const result = createOrganizationSchema.safeParse(validOrg);
    assert.equal(result.success, true);
  });

  it('should validate facility and room schemas with enum constraints', () => {
    const validFacility = {
      name: 'Building A - North Wing',
      code: 'BLD-A-N',
      type: 'logistics_hub',
      timezone: 'UTC',
    };
    assert.equal(createFacilitySchema.safeParse(validFacility).success, true);

    const validRoom = {
      facilityId: '507f1f77bcf86cd799439011',
      floorId: '507f1f77bcf86cd799439012',
      name: 'Deep Freezer Vault 01',
      roomNumber: 'FRZ-101',
      roomType: 'storage',
      privacyLevel: 'HIGH_PRIVACY',
    };
    assert.equal(createRoomSchema.safeParse(validRoom).success, true);
  });

  it('should validate device registration schema', () => {
    const validDev = {
      facilityId: '507f1f77bcf86cd799439011',
      deviceId: 'ESP32_SENSOR_HUB_01',
      name: 'Atrium Air Quality Node',
      model: 'ESP32-S3-WROOM-1',
      macAddress: 'AA:BB:CC:DD:EE:FF',
    };
    const result = registerDeviceSchema.safeParse(validDev);
    assert.equal(result.success, true);
  });

  it('should validate authoritative telemetry ingest message', () => {
    const validTelemetry = {
      deviceId: 'ESP32_01',
      timestamp: new Date().toISOString(),
      sensors: {
        temperature: 22.5,
        humidity: 45.0,
        co2: 650,
        motion: true,
        pirTriggered: true,
      },
    };
    const result = telemetryMessageSchema.safeParse(validTelemetry);
    assert.equal(result.success, true);
  });

  it('should validate complete automation rule schema with condition operators', () => {
    const validRule = {
      name: 'High CO2 Fresh Air Damper Boost',
      enabled: true,
      triggerEventType: 'HIGH_CO2',
      conditions: [
        { field: 'currentCo2', operator: 'gte', value: 1000 },
      ],
      actions: [
        { type: 'VENTILATION_INCREASE', params: { speed: 'HIGH' } },
      ],
      cooldownMs: 60000,
    };
    const result = createAutomationRuleSchema.safeParse(validRule);
    assert.equal(result.success, true);
  });

  it('should validate security audit filter and scan schemas', () => {
    const filter = {
      severity: 'CRITICAL',
      action: 'ROGUE_DEVICE_BLOCKED',
      status: 'BLOCKED',
      page: 1,
      limit: 25,
    };
    assert.equal(securityAuditFilterSchema.safeParse(filter).success, true);

    const scan = { deepScan: true };
    assert.equal(runSecurityAuditScanSchema.safeParse(scan).success, true);
  });
});
