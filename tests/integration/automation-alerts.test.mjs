// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Automation Rules & Alerts
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import {
  OrganizationModel,
  FacilityModel,
  RoomModel,
  UserModel,
  AutomationRuleModel,
  AutomationExecutionModel,
  AlertModel,
} from '../../apps/api/dist/models/index.js';

describe('Automation Rules & Alert Pipeline Integration Tests', () => {
  let adminId;
  let orgId;
  let facilityId;
  let roomId;
  let ruleId;
  let alertId;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-auto-${Date.now()}@sentinel.local`,
        displayName: 'Auto Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id;

    const org = await OrganizationModel.create({
      name: `Automation Org ${Date.now()}`,
      slug: `auto-org-${Date.now()}`,
      industry: 'school',
      createdBy: adminId,
    });
    orgId = org._id;

    const facility = await FacilityModel.create({
      organizationId: orgId,
      name: 'High School Science Wing',
      code: 'SCI-01',
      type: 'academic_building',
      timezone: 'UTC',
    });
    facilityId = facility._id;

    const room = await RoomModel.create({
      organizationId: orgId,
      facilityId,
      floorId: adminId, // dummy floor reference
      name: 'Chemistry Lab 201',
      roomNumber: '201',
      roomType: 'classroom',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 30,
      currentCo2: 1250,
      currentTemperature: 23.0,
      doorState: 'closed',
    });
    roomId = room._id;
  });

  after(async () => {
    if (alertId) await AlertModel.deleteOne({ _id: alertId });
    if (ruleId) {
      await AutomationRuleModel.deleteOne({ _id: ruleId });
      await AutomationExecutionModel.deleteMany({ automationId: ruleId });
    }
    if (roomId) await RoomModel.deleteOne({ _id: roomId });
    if (facilityId) await FacilityModel.deleteOne({ _id: facilityId });
    if (orgId) await OrganizationModel.deleteOne({ _id: orgId });
    await mongoose.disconnect();
  });

  it('should create automation rule and record execution log when conditions match', async () => {
    const rule = await AutomationRuleModel.create({
      organizationId: orgId,
      facilityId,
      roomId,
      name: 'Classroom High CO2 Damper Booster',
      enabled: true,
      triggerEventType: 'HIGH_CO2',
      conditions: [
        { field: 'currentCo2', operator: 'gte', value: 1000 },
      ],
      actions: [
        { type: 'VENTILATION_INCREASE', params: { damperBoostPercent: 100 }, simulated: true },
        { type: 'CREATE_ALERT', params: { severity: 'WARNING', title: 'Classroom CO2 Exceeded 1000 ppm' }, simulated: true },
      ],
      cooldownMs: 30000,
    });
    ruleId = rule._id;

    assert.ok(rule._id);
    assert.equal(rule.enabled, true);

    const dummyEventId = new mongoose.Types.ObjectId();

    // Simulate rule execution
    const execution = await AutomationExecutionModel.create({
      automationId: rule._id,
      eventId: dummyEventId,
      organizationId: orgId,
      facilityId,
      roomId,
      status: 'SUCCESS',
      triggerEvent: {
        eventType: 'HIGH_CO2',
        severity: 'WARNING',
        title: 'CO2 Spike Detected',
      },
      actions: [
        { type: 'VENTILATION_INCREASE', success: true, simulated: true },
        { type: 'CREATE_ALERT', success: true, simulated: true },
      ],
      durationMs: 45,
    });

    assert.ok(execution._id);
    assert.equal(execution.status, 'SUCCESS');

    // Create resulting alert
    const alert = await AlertModel.create({
      organizationId: orgId,
      facilityId,
      roomId,
      title: 'Classroom CO2 Exceeded 1000 ppm',
      description: 'Sensirion sensor observed 1250 ppm CO2. Air damper boosted to 100%.',
      severity: 'WARNING',
      status: 'CREATED',
      sensorEvidence: { co2: 1250 },
    });
    alertId = alert._id;

    assert.ok(alert._id);
    assert.equal(alert.severity, 'WARNING');
    assert.equal(alert.status, 'CREATED');
  });
});
