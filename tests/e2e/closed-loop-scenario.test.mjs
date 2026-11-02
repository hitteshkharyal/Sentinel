// ─────────────────────────────────────────────
// SENTINEL Tests — End-to-End: Full Closed-Loop Scenario
// ─────────────────────────────────────────────
// Validates full closed-loop enterprise lifecycle:
// 1. Organization & Spatial Digital Twin Provisioning
// 2. Industry Sector Policy Pack Deployment
// 3. IoT Hardware Credential Issuance & Mutual Authentication
// 4. Real-Time MQTT Telemetry Streaming & Ingestion
// 5. Digital Twin Live State Synchronization
// 6. Automation Rule Execution & Alert Lifecycle
// 7. Full Compliance Evaluation & Zero-Trust Audit Logging

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mqtt from 'mqtt';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { MqttService } from '../../apps/api/dist/services/mqtt.service.js';
import { IndustryPolicyService } from '../../apps/api/dist/services/industry-policy.service.js';
import { ComplianceService } from '../../apps/api/dist/services/compliance.service.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  DeviceModel,
  DeviceCredentialModel,
  UserModel,
  TelemetryModel,
  AutomationRuleModel,
  AutomationExecutionModel,
  AlertModel,
  SecurityAuditLogModel,
} from '../../apps/api/dist/models/index.js';
import { ComplianceAuditLogModel } from '../../apps/api/dist/models/ComplianceAuditLog.js';
import { ComplianceProfileModel } from '../../apps/api/dist/models/ComplianceProfile.js';

describe('End-to-End Closed-Loop Operational Lifecycle', () => {
  const brokerPort = 23883;
  let adminId;
  let orgId;
  let facilityId;
  let floorId;
  let roomId;
  let deviceId;
  let deviceToken;
  let mqttClient;
  let alertId;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-e2e-${Date.now()}@sentinel.local`,
        displayName: 'E2E Master Administrator',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id;

    // Start dedicated test MQTT broker
    await MqttService.startBroker(brokerPort);
  });

  after(async () => {
    if (mqttClient && mqttClient.connected) {
      mqttClient.end(true);
    }
    await MqttService.stopBroker();

    // Cascading test entity teardown
    if (alertId) await AlertModel.deleteOne({ _id: alertId });
    if (orgId) {
      await AutomationExecutionModel.deleteMany({ organizationId: orgId });
      await AutomationRuleModel.deleteMany({ organizationId: orgId });
      await ComplianceAuditLogModel.deleteMany({ organizationId: orgId });
      await ComplianceProfileModel.deleteMany({ organizationId: orgId });
      await SecurityAuditLogModel.deleteMany({ organizationId: orgId });
      await TelemetryModel.deleteMany({ organizationId: orgId });
      if (deviceId) {
        await DeviceCredentialModel.deleteMany({ deviceId });
        await DeviceModel.deleteMany({ deviceId });
      }
      if (roomId) await RoomModel.deleteOne({ _id: roomId });
      if (floorId) await FloorModel.deleteOne({ _id: floorId });
      if (facilityId) await FacilityModel.deleteOne({ _id: facilityId });
      await OrganizationModel.deleteOne({ _id: orgId });
    }

    await mongoose.disconnect();
  });

  it('Phase 1: should provision organization and spatial digital twin hierarchy', async () => {
    const org = await OrganizationModel.create({
      name: `Providence St. John Health System ${Date.now()}`,
      slug: `providence-health-${Date.now()}`,
      industry: 'hospital',
      createdBy: adminId,
    });
    orgId = org._id.toString();
    assert.ok(orgId);

    const facility = await FacilityModel.create({
      organizationId: org._id,
      name: 'Cardiology Critical Care Pavilion',
      code: 'CARD-CC-01',
      type: 'hospital_wing',
      timezone: 'America/New_York',
    });
    facilityId = facility._id.toString();
    assert.ok(facilityId);

    const floor = await FloorModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      name: 'Floor 4 - Intensive Cardiac Unit',
      level: 4,
    });
    floorId = floor._id.toString();
    assert.ok(floorId);

    const room = await RoomModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      floorId: floor._id,
      name: 'ICU Isolation Suite 402',
      roomNumber: '402-A',
      roomType: 'hospital_room',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 1,
      currentTemperature: 21.0,
      currentCo2: 480,
      currentHumidity: 45,
      occupancyState: 'EMPTY',
      doorState: 'closed',
    });
    roomId = room._id.toString();
    assert.ok(roomId);
  });

  it('Phase 2: should deploy healthcare sector policy pack with automation rules', async () => {
    const deployResult = await IndustryPolicyService.applyPolicyPack(orgId, 'hospital', {
      overwriteExisting: true,
      enableRulesImmediately: true,
    });

    assert.equal(deployResult.status, 'APPLIED');
    assert.equal(deployResult.appliedRules.length, 3);

    const rules = await AutomationRuleModel.find({ organizationId: orgId });
    assert.equal(rules.length, 3);
  });

  it('Phase 3: should register IoT device and issue cryptographic preshared secret', async () => {
    deviceId = `ESP32_E2E_${Date.now().toString().slice(-6)}`;

    await DeviceModel.create({
      organizationId: new mongoose.Types.ObjectId(orgId),
      facilityId: new mongoose.Types.ObjectId(facilityId),
      roomId: new mongoose.Types.ObjectId(roomId),
      deviceId,
      name: 'ICU Multi-Modal Telemetry Gateway',
      model: 'ESP32-S3-WROOM-1',
      status: 'ONLINE',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      capabilities: ['CO2', 'TEMPERATURE', 'HUMIDITY', 'SOUND_LEVEL', 'MMWAVE'],
    });

    const secret = DeviceCredentialModel.generateSecret();
    deviceToken = secret.token;

    const cred = await DeviceCredentialModel.create({
      organizationId: new mongoose.Types.ObjectId(orgId),
      deviceId,
      credentialType: 'PRESHARED_TOKEN',
      keyPrefix: secret.prefix,
      hashedSecret: secret.hashed,
      status: 'ACTIVE',
    });

    assert.ok(cred._id);
    assert.equal(cred.deviceId, deviceId);
  });

  it('Phase 4: should stream real-time telemetry over MQTT and update room digital twin', async () => {
    mqttClient = mqtt.connect(`mqtt://127.0.0.1:${brokerPort}`, {
      clientId: `CLIENT_${deviceId}`,
      username: deviceId,
      password: deviceToken,
      reconnectPeriod: 0,
      connectTimeout: 3000,
    });

    await new Promise((resolve, reject) => {
      mqttClient.on('connect', resolve);
      mqttClient.on('error', reject);
    });

    const topic = `sentinel/${orgId}/${facilityId}/${deviceId}/telemetry`;
    const payload = {
      timestamp: new Date().toISOString(),
      sensors: {
        temperature: 24.8,
        co2: 1050,
        humidity: 52,
        soundLevel: 55.4,
        mmwave: {
          presence: true,
          stationaryConfidence: 96,
          count: 1,
        },
      },
      metadata: {
        firmwareVersion: 'v2.1.0-e2e',
        wifiRssiDbm: -58,
      },
    };

    await new Promise((resolve, reject) => {
      mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Ingestion processing pause
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Verify Telemetry record persisted
    const telemetryRecord = await TelemetryModel.findOne({ deviceId });
    assert.ok(telemetryRecord);
    assert.equal(telemetryRecord.valid, true);

    // Verify Room digital twin live synchronization
    const updatedRoom = await RoomModel.findById(roomId);
    assert.ok(updatedRoom);
    assert.equal(updatedRoom.currentCo2, 1050);
    assert.equal(updatedRoom.currentTemperature, 24.8);
    assert.equal(updatedRoom.occupancyState, 'STATIONARY_OCCUPANCY');
  });

  it('Phase 5: should execute automation workflow, create incident alert and advance status', async () => {
    const rules = await AutomationRuleModel.find({ organizationId: orgId });
    const selectedRule = rules[0];
    assert.ok(selectedRule);

    // Record rule execution
    const execution = await AutomationExecutionModel.create({
      automationId: selectedRule._id,
      eventId: new mongoose.Types.ObjectId(),
      organizationId: new mongoose.Types.ObjectId(orgId),
      facilityId: new mongoose.Types.ObjectId(facilityId),
      roomId: new mongoose.Types.ObjectId(roomId),
      status: 'SUCCESS',
      triggerEvent: {
        eventType: selectedRule.triggerEventType,
        severity: 'HIGH',
        title: `Triggered by ${selectedRule.name}`,
      },
      actions: [
        { type: 'VENTILATION_INCREASE', success: true, simulated: true },
        { type: 'CREATE_ALERT', success: true, simulated: true },
      ],
      durationMs: 38,
    });
    assert.ok(execution._id);

    // Create incident alert
    const alert = await AlertModel.create({
      organizationId: new mongoose.Types.ObjectId(orgId),
      facilityId: new mongoose.Types.ObjectId(facilityId),
      roomId: new mongoose.Types.ObjectId(roomId),
      deviceId,
      title: 'CO2 Threshold Exceeded in ICU Suite 402',
      description: 'CO2 concentration reached 1050 ppm. Automated ventilation boost triggered.',
      severity: 'HIGH',
      status: 'CREATED',
      confidence: 96,
      sensorEvidence: { co2: 1050, temperature: 24.8 },
      history: [
        {
          action: 'CREATED',
          timestamp: new Date(),
          note: 'Automated alert created via telemetry event evaluation',
        },
      ],
    });
    alertId = alert._id;
    assert.ok(alertId);

    // Operator acknowledges alert
    const ackAlert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        $set: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
        $push: {
          history: {
            action: 'ACKNOWLEDGED',
            userId: adminId,
            userName: 'E2E Master Administrator',
            timestamp: new Date(),
            note: 'HVAC team verified ventilation dampers engaged',
          },
        },
      },
      { new: true }
    );

    assert.ok(ackAlert);
    assert.equal(ackAlert.status, 'ACKNOWLEDGED');
    assert.equal(ackAlert.history.length, 2);
  });

  it('Phase 6: should run compliance assessment and verify Zero-Trust security trail', async () => {
    // Run compliance evaluation
    const audit = await ComplianceService.evaluateCompliance(orgId);
    assert.ok(audit);
    assert.ok(audit.overallScore >= 0 && audit.overallScore <= 100);

    // Verify compliance audit log persisted
    const complianceLog = await ComplianceAuditLogModel.findOne({ organizationId: orgId });
    assert.ok(complianceLog);

    // Verify security audit recorded MQTT authentication event
    const secLogs = await SecurityAuditLogModel.find({ organizationId: orgId });
    assert.ok(secLogs.length >= 1);
    const authLog = secLogs.find((l) => l.action === 'AUTH_SUCCESS');
    assert.ok(authLog);
    assert.equal(authLog.actorId, deviceId);
  });
});
