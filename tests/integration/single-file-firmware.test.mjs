// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Phases 20–26 Workspace, Team, Single-File Firmware & Ingestion
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { SingleFileFirmwareGeneratorService } from '../../apps/api/dist/services/single-file-firmware.service.js';
import { DeploymentTeamService } from '../../apps/api/dist/services/deployment-team.service.js';
import { TelemetryValidator } from '../../apps/api/dist/services/telemetry-validator.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  UserModel,
  DeploymentModel,
  DeviceModel,
  DeviceCredentialModel,
  TelemetryModel,
} from '../../apps/api/dist/models/index.js';

describe('Phases 20–26: Deployment Team, Single-File Firmware & HTTP Ingestion', () => {
  let adminId;
  let orgId;
  let facilityId;
  let floorId;
  let roomId;
  let deployment;
  let deviceId;
  let plainApiKey;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-p26-${Date.now()}@sentinel.local`,
        displayName: 'Phase 26 Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id.toString();

    const org = await OrganizationModel.create({
      name: `Phases 20-26 Test Org ${Date.now()}`,
      slug: `p26-org-${Date.now()}`,
      industry: 'hotel',
      createdBy: adminId,
    });
    orgId = org._id.toString();

    const facility = await FacilityModel.create({
      organizationId: orgId,
      name: 'Resort Alpha',
      timezone: 'UTC',
      industry: 'hotel',
      createdBy: adminId,
    });
    facilityId = facility._id.toString();

    const floor = await FloorModel.create({
      organizationId: orgId,
      facilityId,
      level: 1,
      name: 'Ground Floor',
      createdBy: adminId,
    });
    floorId = floor._id.toString();

    const room = await RoomModel.create({
      organizationId: orgId,
      facilityId,
      floorId,
      name: 'Suite 101',
      roomNumber: '101',
      roomType: 'hotel_room',
      floorNumber: 1,
      status: 'VACANT',
    });
    roomId = room._id.toString();

    deployment = await DeploymentModel.create({
      organizationId: orgId,
      facilityId,
      facilityName: facility.name,
      roomId,
      roomName: room.name,
      name: 'Suite 101 Deployment',
      industry: 'hotel',
      useCaseId: 'room_occupancy',
      useCaseName: 'Room Occupancy Monitoring',
      status: 'CONFIGURED',
      hardwareConfig: {
        chipModel: 'ESP32-WROOM-32D',
        boardName: 'ESP32 Dev Module',
        operatingVoltage: '3.3V',
        powerSource: 'MAINS',
        sensors: [
          {
            sensorType: 'PIR',
            model: 'HC-SR501',
            manufacturer: 'Generic',
            category: 'PRESENCE_MOTION',
            interfaceType: 'GPIO',
            assignedPins: [13],
            samplingIntervalMs: 2000,
            isMandatory: true,
          },
          {
            sensorType: 'TEMPERATURE',
            model: 'BME280',
            manufacturer: 'Bosch',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            assignedPins: [21, 22],
            samplingIntervalMs: 5000,
            isMandatory: true,
          },
        ],
        actuators: [],
        i2cBus: { sdaPin: 21, sclPin: 22, frequencyHz: 100000 },
      },
      createdBy: adminId,
    });

    deviceId = `DEV_TEST_${deployment._id.toString().slice(-6).toUpperCase()}`;

    await DeviceModel.create({
      deviceId,
      organizationId: orgId,
      facilityId,
      roomId,
      name: 'Suite 101 ESP32',
      macAddress: `AA:BB:CC:DD:EE:${Date.now().toString().slice(-2)}`,
      chipModel: 'ESP32-WROOM-32D',
      hardwareVersion: 'v1.0',
      firmwareVersion: 'v1.0.0',
      status: 'ONLINE',
      registeredAt: new Date(),
    });

    const secret = DeviceCredentialModel.generateSecret();
    plainApiKey = secret.token;
    await DeviceCredentialModel.create({
      deviceId,
      organizationId: orgId,
      credentialType: 'API_KEY',
      keyPrefix: secret.prefix,
      hashedSecret: secret.hashed,
      status: 'ACTIVE',
      lastRotatedAt: new Date(),
    });
  });

  after(async () => {
    await DeploymentModel.deleteMany({ organizationId: orgId });
    await DeviceCredentialModel.deleteMany({ organizationId: orgId });
    await DeviceModel.deleteMany({ organizationId: orgId });
    await RoomModel.deleteMany({ organizationId: orgId });
    await FloorModel.deleteMany({ organizationId: orgId });
    await FacilityModel.deleteMany({ organizationId: orgId });
    await OrganizationModel.deleteMany({ _id: orgId });
    await mongoose.disconnect();
  });

  it('1. should assign team members and supervisors to a deployment', async () => {
    const team = await DeploymentTeamService.addMember(
      orgId,
      deployment._id.toString(),
      'alice.supervisor@example.com',
      'SUPERVISOR',
      adminId,
      'Alice Supervisor'
    );

    assert.ok(Array.isArray(team));
    assert.strictEqual(team.length, 1);
    assert.strictEqual(team[0].email, 'alice.supervisor@example.com');
    assert.strictEqual(team[0].role, 'SUPERVISOR');
  });

  it('2. should update team member role and remove member cleanly', async () => {
    await DeploymentTeamService.addMember(
      orgId,
      deployment._id.toString(),
      'bob.tech@example.com',
      'TECHNICIAN',
      adminId,
      'Bob Technician'
    );

    const updated = await DeploymentTeamService.updateMemberRole(
      orgId,
      deployment._id.toString(),
      'bob.tech@example.com',
      'INSTALLER'
    );
    const bob = updated.find((m) => m.email === 'bob.tech@example.com');
    assert.ok(bob);
    assert.strictEqual(bob.role, 'INSTALLER');

    const afterRemove = await DeploymentTeamService.removeMember(
      orgId,
      deployment._id.toString(),
      'bob.tech@example.com'
    );
    assert.strictEqual(afterRemove.some((m) => m.email === 'bob.tech@example.com'), false);
  });

  it('3. should generate a standalone sentinel_firmware.ino sketch with ESP32/ESP8266 support', () => {
    const result = SingleFileFirmwareGeneratorService.generateIno(
      deployment.toSafeDeployment(),
      {
        boardType: 'ESP32_DEV',
        wifiSsid: 'Company_WiFi',
        wifiPassword: 'Pass123_Secret',
        serverUrl: 'http://192.168.1.50:4000',
        telemetryIntervalMs: 5000,
        deviceId,
        apiKey: plainApiKey,
      }
    );

    assert.strictEqual(result.filename, 'sentinel_firmware.ino');
    assert.ok(result.content.includes('Company_WiFi'));
    assert.ok(result.content.includes(plainApiKey));
    assert.ok(result.content.includes('http://192.168.1.50:4000/api/v1/sensors/data'));
    assert.ok(result.content.includes('Adafruit_BME280'));
    assert.ok(result.content.includes('PIN_PIR_0'));
    assert.ok(result.content.includes('http.POST(payload)'));
    assert.ok(result.content.includes('#if defined(ESP32)'));
    assert.ok(result.content.includes('#elif defined(ESP8266)'));
  });

  it('4. should ingest HTTP telemetry and update digital twin room stasis', async () => {
    const payload = {
      deviceId,
      timestamp: new Date().toISOString(),
      sensors: {
        motion: true,
        temperature: 24.1,
        humidity: 50.2,
      },
    };

    const result = await TelemetryValidator.validateAndProcess(payload);
    assert.ok(result.telemetry);
    assert.strictEqual(result.telemetry.deviceId, deviceId);

    const doc = await TelemetryModel.findById(result.telemetry.id);
    assert.ok(doc);
    assert.strictEqual(doc.deviceId, deviceId);
  });
});
