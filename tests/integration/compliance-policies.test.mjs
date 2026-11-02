// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Compliance Profiles & Sector Policy Packs
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { IndustryPolicyService } from '../../apps/api/dist/services/industry-policy.service.js';
import { ComplianceService } from '../../apps/api/dist/services/compliance.service.js';
import {
  OrganizationModel,
  FacilityModel,
  RoomModel,
  UserModel,
  AutomationRuleModel,
} from '../../apps/api/dist/models/index.js';
import { ComplianceProfileModel } from '../../apps/api/dist/models/ComplianceProfile.js';
import { ComplianceAuditLogModel } from '../../apps/api/dist/models/ComplianceAuditLog.js';

describe('Compliance Profiles & Sector Policy Packs Integration Tests', () => {
  let adminId;
  let orgId;
  let facilityId;
  let roomId;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-comp-${Date.now()}@sentinel.local`,
        displayName: 'Compliance Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id;

    const org = await OrganizationModel.create({
      name: `Compliance Testing Hub ${Date.now()}`,
      slug: `comp-hub-${Date.now()}`,
      industry: 'warehouse',
      createdBy: adminId,
    });
    orgId = org._id.toString();

    const facility = await FacilityModel.create({
      organizationId: org._id,
      name: 'Cold-Chain Depot Alpha',
      code: 'DEPOT-A',
      type: 'logistics_hub',
      timezone: 'UTC',
    });
    facilityId = facility._id.toString();

    const room = await RoomModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      floorId: adminId,
      name: 'Deep Freezer Vault #1',
      roomNumber: 'FRZ-01',
      roomType: 'storage',
      privacyLevel: 'RESTRICTED_ACCESS',
      capacity: 2,
      currentTemperature: -14.0, // Excursion above -18C target
      currentCo2: 500,
      doorState: 'closed',
    });
    roomId = room._id.toString();
  });

  after(async () => {
    await ComplianceAuditLogModel.deleteMany({ organizationId: orgId });
    await ComplianceProfileModel.deleteMany({ organizationId: orgId });
    await AutomationRuleModel.deleteMany({ organizationId: orgId });
    await RoomModel.deleteOne({ _id: roomId });
    await FacilityModel.deleteOne({ _id: facilityId });
    await OrganizationModel.deleteOne({ _id: orgId });
    await mongoose.disconnect();
  });

  it('should load all 8 sector policy packs and 24 industry templates', () => {
    const packs = IndustryPolicyService.getPolicyPacks();
    assert.equal(packs.length, 8);

    const templates = IndustryPolicyService.getTemplates();
    assert.equal(templates.length, 24);
  });

  it('should deploy warehouse policy pack with 3 automated safety rules', async () => {
    const deployResult = await IndustryPolicyService.applyPolicyPack(orgId, 'warehouse', {
      overwriteExisting: true,
      enableRulesImmediately: true,
    });

    assert.equal(deployResult.appliedRules.length, 3);

    const activeRules = await AutomationRuleModel.find({ organizationId: orgId });
    assert.equal(activeRules.length, 3);
  });

  it('should evaluate spatial twin compliance and catch HACCP freezer excursion', async () => {
    const auditResult = await ComplianceService.evaluateCompliance(orgId);

    assert.ok(auditResult);
    assert.ok(auditResult.overallScore >= 0 && auditResult.overallScore <= 100);
    assert.ok(auditResult.frameworkScores.length >= 1);

    // Verify HACCP violation was flagged due to -14C freezer excursion
    const haccpViolations = auditResult.violations.filter((v) => v.framework === 'HACCP_FSMA');
    assert.ok(haccpViolations.length >= 1);
    assert.ok(haccpViolations[0].title.includes('Freezer'));

    // Verify audit log persisted
    const logged = await ComplianceAuditLogModel.findOne({ organizationId: orgId });
    assert.ok(logged);
  });
});
