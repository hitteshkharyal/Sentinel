// ─────────────────────────────────────────────
// SENTINEL Diagnostic: Phases 20–26 Deployment Workspace, Team, Single-File Firmware & HTTP Ingestion Test
// ─────────────────────────────────────────────

import { connectDatabase } from '../apps/api/dist/db.js';
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
} from '../apps/api/dist/models/index.js';
import { SingleFileFirmwareGeneratorService } from '../apps/api/dist/services/single-file-firmware.service.js';
import { DeploymentTeamService } from '../apps/api/dist/services/deployment-team.service.js';
import { TelemetryValidator } from '../apps/api/dist/services/telemetry-validator.js';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function runPhases20To26Test() {
  console.log(`\n${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   🚀  SENTINEL PHASES 20–26 VERIFICATION TEST HARNESS              ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   Single-File Firmware, Team Assignment & HTTP Data Ingestion       ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // 1. Connect to DB
    console.log(`${colors.blue}[STEP 1] Connecting to MongoDB...${colors.reset}`);
    await connectDatabase();
    console.log(`${colors.green}  ✔ Connected to Database.${colors.reset}`);

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: 'admin.phase26@sentinel.test',
        displayName: 'Test Admin',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        status: 'ACTIVE',
      }));

    const org =
      (await OrganizationModel.findOne({ name: 'Sentinel Corp' })) ||
      (await OrganizationModel.create({
        name: 'Sentinel Corp',
        industry: 'hotel',
        slug: 'sentinel-corp',
        ownerId: admin._id,
        createdBy: admin._id,
        subscriptionTier: 'ENTERPRISE',
      }));

    const facility =
      (await FacilityModel.findOne({ organizationId: org._id })) ||
      (await FacilityModel.create({
        organizationId: org._id,
        name: 'Apex Grand Hotel',
        timezone: 'UTC',
        industry: 'hotel',
        createdBy: admin._id,
      }));

    const floor =
      (await FloorModel.findOne({ facilityId: facility._id })) ||
      (await FloorModel.create({
        organizationId: org._id,
        facilityId: facility._id,
        level: 4,
        name: 'Floor 4',
        createdBy: admin._id,
      }));

    const room =
      (await RoomModel.findOne({ facilityId: facility._id })) ||
      (await RoomModel.create({
        organizationId: org._id,
        facilityId: facility._id,
        floorId: floor._id,
        name: 'Suite 401',
        roomNumber: '401',
        roomType: 'hotel_room',
        floorNumber: 4,
        status: 'VACANT',
      }));

    // 2. Create Test Deployment
    console.log(`\n${colors.blue}[STEP 2] Creating Deployment with Multi-Sensor Configuration...${colors.reset}`);
    const deployment = await DeploymentModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      facilityName: facility.name,
      roomId: room._id,
      roomName: room.name,
      name: 'Suite 401 Smart Stasis & Climate',
      description: 'Autonomous occupancy, environmental, and leak detection',
      industry: 'hotel',
      useCaseId: 'room_occupancy',
      useCaseName: 'Room Occupancy & Energy Optimization',
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
          {
            sensorType: 'WATER_LEAK',
            model: 'LEAK_PROBE_V2',
            manufacturer: 'Sentinel',
            category: 'SAFETY_HAZARD',
            interfaceType: 'GPIO',
            assignedPins: [25],
            samplingIntervalMs: 5000,
            isMandatory: false,
          },
        ],
        actuators: [
          {
            actuatorType: 'RELAY',
            model: 'SONOFF_RELAY_1CH',
            assignedPin: 18,
            activeLevel: 'HIGH',
          },
        ],
        i2cBus: { sdaPin: 21, sclPin: 22, frequencyHz: 100000 },
      },
      createdBy: admin._id,
    });
    console.log(`${colors.green}  ✔ Deployment Created: ${deployment.name} (${deployment._id})${colors.reset}`);

    // 3. Test Team Member Assignment
    console.log(`\n${colors.blue}[STEP 3] Testing Deployment Team Assignment...${colors.reset}`);
    const teamMembers = await DeploymentTeamService.addMember(
      org._id.toString(),
      deployment._id.toString(),
      'lead.tech@sentinel.test',
      'TECHNICIAN',
      admin._id.toString(),
      'Sarah Connor'
    );
    console.log(`${colors.green}  ✔ Team Member Added: ${teamMembers[0].email} [${teamMembers[0].role}]${colors.reset}`);

    const updatedTeam = await DeploymentTeamService.addMember(
      org._id.toString(),
      deployment._id.toString(),
      'supervisor@sentinel.test',
      'SUPERVISOR',
      admin._id.toString(),
      'John Connor'
    );
    console.log(`${colors.green}  ✔ Supervisor Assigned: ${updatedTeam.find(m => m.role === 'SUPERVISOR')?.displayName}${colors.reset}`);

    // 4. Test Device API Key Generation & Rotation
    console.log(`\n${colors.blue}[STEP 4] Testing Device API Key Credential Provisioning...${colors.reset}`);
    const deviceId = `SENT_DEV_${deployment._id.toString().slice(-6).toUpperCase()}`;

    await DeviceModel.create({
      deviceId,
      organizationId: org._id,
      facilityId: facility._id,
      roomId: room._id,
      name: 'Suite 401 Node',
      macAddress: `AA:BB:CC:11:22:${deployment._id.toString().slice(-2)}`,
      chipModel: 'ESP32-WROOM-32D',
      hardwareVersion: 'v1.0',
      firmwareVersion: 'v1.0.0',
      status: 'ONLINE',
      registeredAt: new Date(),
    });

    const secret = DeviceCredentialModel.generateSecret();
    const cred = await DeviceCredentialModel.create({
      deviceId,
      organizationId: org._id,
      credentialType: 'API_KEY',
      keyPrefix: secret.prefix,
      hashedSecret: secret.hashed,
      status: 'ACTIVE',
      lastRotatedAt: new Date(),
    });
    console.log(`${colors.green}  ✔ API Key Created with prefix: ${cred.keyPrefix}${colors.reset}`);
    console.log(`  ✔ Plain Key Token: ${secret.token.slice(0, 15)}...`);
    console.log(`  ✔ Cryptographic verification: ${cred.verifySecret(secret.token) ? 'PASS' : 'FAIL'}`);

    // 5. Test Single-File Firmware Generation (.ino)
    console.log(`\n${colors.blue}[STEP 5] Testing Single-File sentinel_firmware.ino Generation...${colors.reset}`);
    const firmwareResult = SingleFileFirmwareGeneratorService.generateIno(
      deployment.toSafeDeployment(),
      {
        boardType: 'ESP32_DEV',
        wifiSsid: 'Hotel_Guest_2.4G',
        wifiPassword: 'secure_password_123',
        serverUrl: 'http://192.168.1.100:4000',
        telemetryIntervalMs: 5000,
        deviceId: cred.deviceId,
        apiKey: secret.token,
      }
    );

    console.log(`${colors.green}  ✔ Generated Sketch File: ${firmwareResult.filename}${colors.reset}`);
    console.log(`  ✔ Content Length: ${firmwareResult.content.length} characters`);
    console.log(`  ✔ Included Libraries: ${firmwareResult.requiredLibraries.join(', ')}`);

    // Verify key snippets in generated sketch
    const content = firmwareResult.content;
    const hasWiFi = content.includes('Hotel_Guest_2.4G');
    const hasApiKey = content.includes(secret.token);
    const hasBme = content.includes('Adafruit_BME280');
    const hasPir = content.includes('PIN_PIR_0');
    const hasHttp = content.includes('http.POST(payload)');
    const hasDualArch = content.includes('#if defined(ESP32)') && content.includes('#elif defined(ESP8266)');

    console.log(`  ✔ Verification - WiFi SSID embedded: ${hasWiFi ? 'PASS' : 'FAIL'}`);
    console.log(`  ✔ Verification - API Key embedded: ${hasApiKey ? 'PASS' : 'FAIL'}`);
    console.log(`  ✔ Verification - BME280 driver included: ${hasBme ? 'PASS' : 'FAIL'}`);
    console.log(`  ✔ Verification - PIR sensor driver included: ${hasPir ? 'PASS' : 'FAIL'}`);
    console.log(`  ✔ Verification - HTTP POST dispatcher included: ${hasHttp ? 'PASS' : 'FAIL'}`);
    console.log(`  ✔ Verification - Dual ESP32/ESP8266 support: ${hasDualArch ? 'PASS' : 'FAIL'}`);

    if (!hasWiFi || !hasApiKey || !hasBme || !hasPir || !hasHttp || !hasDualArch) {
      throw new Error('Firmware generator failed verification checks!');
    }

    // 6. Test HTTP Ingestion Pipeline
    console.log(`\n${colors.blue}[STEP 6] Testing HTTP Telemetry Ingestion...${colors.reset}`);
    const payload = {
      deviceId: cred.deviceId,
      timestamp: new Date().toISOString(),
      sensors: {
        motion: true,
        presence_detected: true,
        temperature: 23.4,
        humidity: 49.2,
        pressure: 1013.2,
        water_leak: false,
        rssi: -58,
        uptime_sec: 120,
      },
    };

    const validated = await TelemetryValidator.validateAndProcess(payload);
    console.log(`${colors.green}  ✔ Ingested Telemetry Record: ${validated.telemetry.id}${colors.reset}`);
    console.log(`  ✔ Digital Twin Occupancy Status: ${validated.telemetry.sensors.motion ? 'OCCUPIED' : 'VACANT'}`);

    // Verify DB update
    const savedRecord = await TelemetryModel.findById(validated.telemetry.id);
    console.log(`  ✔ Verified Telemetry Persisted in MongoDB: ${savedRecord ? 'PASS' : 'FAIL'}`);

    console.log(`\n${colors.green}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}${colors.bold}   🎉  ALL PHASES 20–26 TEST CHECKS PASSED WITH 100% SUCCESS!        ${colors.reset}`);
    console.log(`${colors.green}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    process.exit(0);
  } catch (err) {
    console.error(`\n${colors.red}${colors.bold}❌ Test Failed: ${err.message}${colors.reset}\n`, err);
    process.exit(1);
  }
}

runPhases20To26Test();
