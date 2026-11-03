// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Deployment Wizard & Dynamic Firmware Generator
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { DeploymentTemplateService } from '../../apps/api/dist/services/deployment-template.service.js';
import { DeploymentService } from '../../apps/api/dist/services/deployment.service.js';
import { FirmwareGeneratorService } from '../../apps/api/dist/services/firmware-generator.service.js';
import { HardwareTestService } from '../../apps/api/dist/services/hardware-test.service.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  UserModel,
  DeploymentModel,
  DeviceModel,
} from '../../apps/api/dist/models/index.js';

describe('Deployment Wizard & Dynamic Firmware Generator Integration Tests', () => {
  let adminId;
  let orgId;
  let facilityId;
  let floorId;
  let roomId;
  let testDeployment;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-deploy-${Date.now()}@sentinel.local`,
        displayName: 'Deployment Installer Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id.toString();

    const org = await OrganizationModel.create({
      name: `Sentinel Automated Deployments ${Date.now()}`,
      slug: `deploy-hub-${Date.now()}`,
      industry: 'hotel',
      createdBy: adminId,
    });
    orgId = org._id.toString();

    const facility = await FacilityModel.create({
      organizationId: org._id,
      name: 'Grand Horizon Resort & Spa',
      code: 'HORIZON-01',
      type: 'hotel_tower',
      timezone: 'UTC',
    });
    facilityId = facility._id.toString();

    const floor = await FloorModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      name: 'Floor 4',
      level: 4,
    });
    floorId = floor._id.toString();

    const room = await RoomModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      floorId: floor._id,
      name: 'Presidential Suite 401',
      roomNumber: '401',
      roomType: 'hotel_room',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 2,
    });
    roomId = room._id.toString();
  });

  after(async () => {
    if (orgId) {
      await DeploymentModel.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });
      await OrganizationModel.deleteOne({ _id: new mongoose.Types.ObjectId(orgId) });
      await FacilityModel.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });
      await FloorModel.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });
      await RoomModel.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });
      await DeviceModel.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });
    }
    await mongoose.disconnect();
  });

  // 1. Template Service Verification
  it('1. should retrieve pre-configured sector templates for all major industries', () => {
    const allTemplates = DeploymentTemplateService.getAllTemplates();
    assert.ok(allTemplates.length >= 10, 'Expected at least 10 sector templates');

    const hotelTpl = DeploymentTemplateService.getTemplatesByIndustry('hotel');
    assert.ok(hotelTpl.length > 0, 'Hotel templates should be returned');
    assert.equal(hotelTpl[0].industry, 'hotel');

    const busTpl = DeploymentTemplateService.getTemplatesByIndustry('school_bus');
    assert.ok(busTpl.length > 0, 'School bus templates should be returned');

    const customTpl = DeploymentTemplateService.getTemplateById('tpl-custom');
    assert.ok(customTpl, 'Custom template should exist');
  });

  // 2. Hardware Pre-flight Validation & Conflict Engine
  it('2. should validate safe pinout and identify GPIO conflicts and reserved pins', () => {
    // Valid config
    const validHw = {
      chipModel: 'ESP32-WROOM-32D',
      boardName: 'ESP32 DevKit v1',
      operatingVoltage: '3.3V',
      powerSource: 'MAINS',
      sensors: [
        {
          sensorType: 'PIR',
          model: 'EKMC',
          manufacturer: 'Panasonic',
          category: 'PRESENCE_MOTION',
          interfaceType: 'GPIO',
          assignedPins: [13],
          samplingIntervalMs: 1000,
          isMandatory: true,
        },
        {
          sensorType: 'DOOR_MAGNETIC',
          model: 'MC-38',
          manufacturer: 'Sentinel',
          category: 'SECURITY',
          interfaceType: 'GPIO',
          assignedPins: [14],
          samplingIntervalMs: 500,
          isMandatory: true,
        },
        {
          sensorType: 'CO2',
          model: 'SCD40',
          manufacturer: 'Sensirion',
          category: 'ENVIRONMENTAL',
          interfaceType: 'I2C',
          assignedPins: [21, 22],
          samplingIntervalMs: 5000,
          isMandatory: false,
        },
      ],
      actuators: [
        {
          actuatorType: 'RELAY',
          model: 'SRD-05VDC',
          assignedPin: 27,
          activeLevel: 'HIGH',
        },
      ],
      i2cBus: { sdaPin: 21, sclPin: 22, frequencyHz: 100000 },
      uart2: { rxPin: 16, txPin: 17, baudRate: 115200 },
    };

    const validResult = DeploymentService.validateHardwareConfig(validHw);
    assert.equal(validResult.valid, true, 'Clean hardware config should be valid');
    assert.equal(validResult.conflicts.length, 0, 'Should have 0 pin conflicts');
    assert.ok(validResult.totalPowerEstMa > 150, 'Current estimate should be computed');

    // Conflicting config (Duplicate GPIO 13 on both PIR and Door)
    const conflictingHw = {
      ...validHw,
      sensors: [
        { ...validHw.sensors[0], assignedPins: [13] },
        { ...validHw.sensors[1], assignedPins: [13] }, // Duplicate pin!
      ],
    };

    const conflictResult = DeploymentService.validateHardwareConfig(conflictingHw);
    assert.equal(conflictResult.valid, false, 'Conflicting pins must fail validation');
    assert.equal(conflictResult.conflicts.length, 1, 'Should detect 1 pin conflict');
    assert.equal(conflictResult.conflicts[0].pinNumber, 13);

    // Fatal Flash SPI Pin assignment (GPIO 6)
    const flashConflictHw = {
      ...validHw,
      sensors: [{ ...validHw.sensors[0], assignedPins: [6] }],
    };
    const flashResult = DeploymentService.validateHardwareConfig(flashConflictHw);
    assert.equal(flashResult.valid, false, 'Flash SPI pin 6 assignment must fail validation');
    assert.ok(flashResult.issues.some((i) => i.code === 'FLASH_SPI_PIN_CONFLICT'));
  });

  // 3. Deployment Creation & CRUD
  it('3. should create, retrieve, and update a deployment record in database', async () => {
    const created = await DeploymentService.createDeployment(orgId, adminId, {
      name: 'Suite 401 Occupancy Automation',
      facilityId,
      roomId,
      industry: 'hotel',
      useCaseId: 'room_occupancy_privacy',
      useCaseName: 'Hotel Guest Room Occupancy',
      hardwareConfig: {
        chipModel: 'ESP32-WROOM-32D',
        boardName: 'ESP32 DevKit v1',
        operatingVoltage: '3.3V',
        powerSource: 'MAINS',
        sensors: [
          {
            sensorType: 'MMWAVE',
            model: 'LD2410C',
            manufacturer: 'Hi-Link',
            category: 'PRESENCE_MOTION',
            interfaceType: 'UART',
            assignedPins: [16, 17],
            samplingIntervalMs: 1000,
            isMandatory: true,
          },
          {
            sensorType: 'PIR',
            model: 'EKMC',
            manufacturer: 'Panasonic',
            category: 'PRESENCE_MOTION',
            interfaceType: 'GPIO',
            assignedPins: [13],
            samplingIntervalMs: 1000,
            isMandatory: true,
          },
          {
            sensorType: 'CO2',
            model: 'SCD40',
            manufacturer: 'Sensirion',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            assignedPins: [21, 22],
            samplingIntervalMs: 5000,
            isMandatory: false,
          },
        ],
        actuators: [
          {
            actuatorType: 'RELAY',
            model: 'SRD-05VDC',
            assignedPin: 27,
            activeLevel: 'HIGH',
          },
          {
            actuatorType: 'STATUS_LED',
            model: 'ONBOARD_LED',
            assignedPin: 2,
            activeLevel: 'HIGH',
          },
        ],
        i2cBus: { sdaPin: 21, sclPin: 22, frequencyHz: 100000 },
        uart2: { rxPin: 16, txPin: 17, baudRate: 115200 },
      },
    });

    assert.ok(created.id, 'Deployment ID should be assigned');
    assert.equal(created.status, 'CONFIGURED');
    assert.equal(created.facilityName, 'Grand Horizon Resort & Spa');
    assert.equal(created.roomName, 'Presidential Suite 401');

    testDeployment = created;

    const retrieved = await DeploymentService.getDeploymentById(orgId, created.id);
    assert.equal(retrieved.id, created.id);
    assert.equal(retrieved.name, 'Suite 401 Occupancy Automation');

    const listResult = await DeploymentService.getDeployments(orgId, { industry: 'hotel' });
    assert.ok(listResult.deployments.length >= 1);
    assert.equal(listResult.total >= 1, true);
  });

  // 4. Dynamic Firmware Generation
  it('4. should generate custom modular PlatformIO project ZIP with only selected drivers', async () => {
    assert.ok(testDeployment, 'Deployment must be created');

    const artifact = await FirmwareGeneratorService.generateFirmware(
      orgId,
      testDeployment.id,
      adminId,
      '1.0.0'
    );

    assert.ok(artifact.id, 'Firmware artifact ID generated');
    assert.equal(artifact.status, 'READY');
    assert.equal(artifact.version, '1.0.0');

    const manifest = artifact.manifest;
    assert.ok(manifest, 'Firmware manifest must be present');
    assert.ok(manifest.includedDrivers.includes('hal_mmwave.cpp'), 'Must include mmWave driver');
    assert.ok(manifest.includedDrivers.includes('hal_pir.cpp'), 'Must include PIR driver');
    assert.ok(manifest.includedDrivers.includes('hal_co2.cpp'), 'Must include CO2 driver');
    assert.ok(manifest.includedDrivers.includes('hal_relay.cpp'), 'Must include Relay driver');

    // Verify excluded drivers are NOT in project
    assert.ok(manifest.excludedDrivers.includes('hal_gps.cpp'), 'GPS driver should be excluded');
    assert.ok(manifest.excludedDrivers.includes('hal_vibration.cpp'), 'Vibration driver should be excluded');

    // Verify integrity hash
    assert.ok(manifest.integrityHash && manifest.integrityHash.length === 64, 'SHA-256 integrity hash');

    // Retrieve and inspect binary ZIP buffer
    const { buffer, filename } = await FirmwareGeneratorService.getFirmwareZipBuffer(
      orgId,
      artifact.id
    );
    assert.ok(buffer.length > 500, 'Zip buffer should have valid size');
    assert.ok(filename.endsWith('.zip'), 'File extension must be .zip');

    // Test that the deployment record was updated with firmware build link
    const updatedDep = await DeploymentService.getDeploymentById(orgId, testDeployment.id);
    assert.equal(updatedDep.latestFirmwareVersion, '1.0.0');
    assert.equal(updatedDep.status, 'FIRMWARE_GENERATED');
  });

  // 5. Device Provisioning & Token Exchange
  it('5. should provision device credentials and register hardware node in database', async () => {
    assert.ok(testDeployment, 'Deployment must be created');

    const provResult = await DeploymentService.provisionDevice(
      orgId,
      testDeployment.id,
      adminId
    );

    assert.ok(provResult.device, 'Registered Device entity created');
    assert.ok(provResult.credentials, 'Preshared credentials packet generated');
    assert.ok(provResult.credentials.deviceId.startsWith('ESP32-HOTE-'), 'Device ID formatted with industry code');
    assert.ok(provResult.credentials.token.startsWith('sent_dev_'), 'Preshared token generated');

    // Verify deployment status updated to PROVISIONING
    assert.equal(provResult.deployment.status, 'PROVISIONING');
    assert.equal(provResult.deployment.deviceId, provResult.credentials.deviceId);

    testDeployment = provResult.deployment;
  });

  // 6. Hardware Diagnostic Test Scorecard & Readiness Sign-Off
  it('6. should execute 7-point diagnostic scorecard and sign off deployment for production', async () => {
    assert.ok(testDeployment, 'Deployment must be created');

    // Run diagnostics with simulation enabled
    const scorecard = await HardwareTestService.runDiagnosticTest(
      orgId,
      testDeployment.id,
      adminId,
      true // simulation mode
    );

    assert.ok(scorecard.sessionId, 'Session ID created');
    assert.equal(scorecard.overallResult, 'PASS', 'Overall result should pass');
    assert.equal(scorecard.checks.deviceConnection, 'PASS');
    assert.equal(scorecard.checks.mqttConnection, 'PASS');
    assert.equal(scorecard.checks.sensorValidation, 'PASS');
    assert.equal(scorecard.checks.telemetryReception, 'PASS');
    assert.equal(scorecard.checks.eventDetection, 'PASS');
    assert.equal(scorecard.checks.automationTrigger, 'PASS');
    assert.equal(scorecard.checks.alertDelivery, 'PASS');

    assert.ok(scorecard.sensorReadings.length >= 3, 'All 3 configured sensors should have readings');
    assert.ok(scorecard.sensorReadings.every((r) => r.status === 'WORKING'));

    // Final Sign-Off
    const signedOff = await HardwareTestService.signOffTestSession(
      orgId,
      testDeployment.id,
      scorecard.sessionId,
      adminId,
      'Approved for production guest suite occupancy monitoring.'
    );

    assert.equal(signedOff.readinessSignOff, true);

    // Verify deployment status updated to ACTIVE
    const activeDep = await DeploymentService.getDeploymentById(orgId, testDeployment.id);
    assert.equal(activeDep.status, 'ACTIVE');
    assert.equal(activeDep.isReadinessApproved, true);
  });
});
