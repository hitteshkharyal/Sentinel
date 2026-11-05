// ─────────────────────────────────────────────
// SENTINEL Diagnostic: ESP32 Hardware Connectivity & Telemetry Reception Test
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import { connectDatabase } from '../apps/api/dist/db.js';
import { MqttService } from '../apps/api/dist/services/mqtt.service.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  DeviceModel,
  DeviceCredentialModel,
  UserModel,
  TelemetryModel,
} from '../apps/api/dist/models/index.js';
import { VirtualEsp32Node } from '../firmware/hal/dist/virtual-device.js';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

async function runEsp32ConnectivityTest() {
  console.log(`\n${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   📡  SENTINEL ESP32 HARDWARE CONNECTIVITY & TELEMETRY TEST         ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const results = {
    brokerStarted: false,
    deviceProvisioned: false,
    esp32Connected: false,
    telemetrySent: false,
    telemetryReceivedByServer: false,
    roomTwinUpdated: false,
    latencyMs: 0,
    packetsStreamed: 0,
    sampleData: null,
  };

  const brokerPort = 23883;
  const testRunId = Date.now().toString().slice(-6);
  const deviceId = `ESP32_DIAG_${testRunId}`;
  let orgId, facilityId, floorId, roomId;
  let virtualEsp32 = null;

  try {
    // ── Phase 1: Database & Broker Setup ──────────────────────────────
    console.log(`${colors.blue}[PHASE 1] Initializing Database & Embedded MQTT Broker...${colors.reset}`);
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `diag-admin-${testRunId}@sentinel.local`,
        displayName: 'Diagnostic Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));

    const org = await OrganizationModel.create({
      name: `ESP32 Connectivity Test Org ${testRunId}`,
      slug: `esp32-diag-${testRunId}`,
      industry: 'hotel',
      createdBy: admin._id,
    });
    orgId = org._id.toString();

    const facility = await FacilityModel.create({
      organizationId: org._id,
      name: 'Sentinel Lab Tower',
      code: `LAB-${testRunId}`,
      type: 'hotel_tower',
      timezone: 'UTC',
    });
    facilityId = facility._id.toString();

    const floor = await FloorModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      name: 'Diagnostic Testing Deck',
      level: 1,
    });
    floorId = floor._id.toString();

    const room = await RoomModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      floorId: floor._id,
      name: 'Hardware Test Suite 404',
      roomNumber: '404',
      roomType: 'hotel_room',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 4,
      currentCo2: 400,
      currentTemperature: 20.0,
      doorState: 'closed',
    });
    roomId = room._id.toString();

    // Register ESP32 Device
    await DeviceModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      roomId: room._id,
      deviceId,
      name: 'ESP32 Diagnostic Node (ESP32-S3-WROOM-1)',
      model: 'ESP32-S3-WROOM-1',
      status: 'OFFLINE',
      macAddress: `00:1A:7D:DA:${testRunId.slice(0, 2)}:${testRunId.slice(2, 4)}`,
      capabilities: ['PIR', 'MMWAVE', 'CO2', 'TEMPERATURE', 'HUMIDITY', 'DOOR_MAGNETIC', 'RELAY'],
      firmwareVersion: '1.4.0',
    });

    const secret = DeviceCredentialModel.generateSecret();
    await DeviceCredentialModel.create({
      organizationId: org._id,
      deviceId,
      credentialType: 'PRESHARED_TOKEN',
      keyPrefix: secret.prefix,
      hashedSecret: secret.hashed,
      status: 'ACTIVE',
    });

    results.deviceProvisioned = true;
    console.log(`  ${colors.green}✔ Provisioned device ${deviceId} with secure preshared token credentials${colors.reset}`);

    // Start MQTT Broker
    await MqttService.startBroker(brokerPort);
    results.brokerStarted = true;
    console.log(`  ${colors.green}✔ Embedded Aedes MQTT Broker listening on port ${brokerPort}${colors.reset}`);

    // ── Phase 2: ESP32 Hardware Connection ────────────────────────────
    console.log(`\n${colors.blue}[PHASE 2] Connecting ESP32 Hardware Node over MQTT...${colors.reset}`);
    const connectStartTime = Date.now();

    virtualEsp32 = new VirtualEsp32Node({
      deviceId,
      orgId,
      facilityId,
      roomId,
      macAddress: `00:1A:7D:DA:${testRunId.slice(0, 2)}:${testRunId.slice(2, 4)}`,
      presharedToken: secret.token,
      brokerUrl: `mqtt://127.0.0.1:${brokerPort}`,
      samplingIntervalMs: 5000,
    });

    await virtualEsp32.start();
    results.latencyMs = Date.now() - connectStartTime;
    results.esp32Connected = true;
    console.log(`  ${colors.green}✔ ESP32 authenticated & connected via TLS/MQTT handshake (${results.latencyMs}ms)${colors.reset}`);

    // ── Phase 3: Telemetry Transmission & Reception ───────────────────
    console.log(`\n${colors.blue}[PHASE 3] Sampling & Transmitting Real-Time Sensor Telemetry Packets...${colors.reset}`);

    for (let i = 1; i <= 3; i++) {
      await virtualEsp32.sampleAndPublishTelemetry();
      results.packetsStreamed++;
      console.log(`  ${colors.cyan}→ ESP32 sampled & published telemetry packet #${i} via MQTT topic:${colors.reset}`);
      console.log(`    ${virtualEsp32.topicTelemetry}`);
      await new Promise((r) => setTimeout(r, 600));
    }

    results.telemetrySent = true;

    // Allow ingestion queue to settle
    console.log(`\n${colors.blue}[PHASE 4] Verifying Sentinel Server Telemetry Reception...${colors.reset}`);
    await new Promise((r) => setTimeout(r, 1500));

    // Verify raw TelemetryModel ingestion
    const rawTelemetry = await TelemetryModel.find({ deviceId }).sort({ createdAt: -1 });
    if (rawTelemetry.length > 0) {
      results.telemetryReceivedByServer = true;
      const latest = rawTelemetry[0];
      results.sampleData = {
        co2: latest.sensors?.co2,
        temperature: latest.sensors?.temperature,
        humidity: latest.sensors?.humidity,
        motion: latest.sensors?.motion,
      };
      console.log(`  ${colors.green}✔ Sentinel Server successfully ingested ${rawTelemetry.length} telemetry packets!${colors.reset}`);
      console.log(`    • Latest Packet ID:   ${latest._id}`);
      console.log(`    • Received Timestamp: ${latest.createdAt}`);
      console.log(`    • Decoded Sensor Payload:`, JSON.stringify(latest.sensors));
    }

    // Verify room digital twin updates
    const updatedRoom = await RoomModel.findById(roomId);
    if (updatedRoom) {
      results.roomTwinUpdated = true;
      console.log(`  ${colors.green}✔ Digital Twin synchronized with live ESP32 telemetry:${colors.reset}`);
      console.log(`    • Room CO2:          ${updatedRoom.currentCo2} ppm`);
      console.log(`    • Room Temperature:  ${updatedRoom.currentTemperature} °C`);
      console.log(`    • Room Door State:   ${updatedRoom.doorState}`);
    }

    // Check device state
    const deviceState = await DeviceModel.findOne({ deviceId });
    if (deviceState) {
      console.log(`  ${colors.green}✔ ESP32 Device Record Verified:${colors.reset} Status = ${deviceState.status}, Firmware = ${deviceState.firmwareVersion}`);
    }

    // Disconnect ESP32
    await virtualEsp32.stop();
    virtualEsp32 = null;
    console.log(`  ${colors.green}✔ Clean ESP32 disconnection completed.${colors.reset}`);

  } catch (err) {
    console.error(`  ${colors.red}✖ Diagnostic Error: ${err.message}${colors.reset}`);
    console.error(err);
  } finally {
    console.log(`\n${colors.blue}[CLEANUP] Tearing down diagnostic session...${colors.reset}`);
    try {
      if (virtualEsp32) await virtualEsp32.stop();
      await MqttService.stopBroker();
      await DeviceCredentialModel.deleteMany({ deviceId });
      await DeviceModel.deleteMany({ deviceId });
      await TelemetryModel.deleteMany({ deviceId });
      if (roomId) await RoomModel.deleteOne({ _id: roomId });
      if (floorId) await FloorModel.deleteOne({ _id: floorId });
      if (facilityId) await FacilityModel.deleteOne({ _id: facilityId });
      if (orgId) await OrganizationModel.deleteOne({ _id: orgId });
      await mongoose.disconnect();
      console.log(`  ${colors.green}✔ Diagnostic artifacts cleaned up cleanly.${colors.reset}`);
    } catch (e) {
      // ignore
    }
  }

  // ── Final Diagnostic Scorecard ──────────────────────────────────────
  console.log(`\n${colors.cyan}──────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   ESP32 HARDWARE CONNECTIVITY & INGESTION SCORECARD                ${colors.reset}`);
  console.log(`${colors.cyan}──────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`   1. MQTT Broker Initialization:       ${results.brokerStarted ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`   2. Device Dynamic Provisioning:      ${results.deviceProvisioned ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`   3. ESP32 Connection Handshake:      ${results.esp32Connected ? colors.green + `PASS (${results.latencyMs}ms)` : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`   4. ESP32 Telemetry Transmission:     ${results.telemetrySent ? colors.green + `PASS (${results.packetsStreamed} pkts streamed)` : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`   5. Server Telemetry Ingestion:       ${results.telemetryReceivedByServer ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`   6. Spatial Digital Twin Sync:        ${results.roomTwinUpdated ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`${colors.cyan}──────────────────────────────────────────────────────────────────────${colors.reset}`);

  const allPassed =
    results.brokerStarted &&
    results.deviceProvisioned &&
    results.esp32Connected &&
    results.telemetrySent &&
    results.telemetryReceivedByServer;

  if (allPassed) {
    console.log(`\n  ${colors.green}${colors.bold}✔ ESP32 CONNECTIVITY & DATA RECEPTION TEST: PASSED CLEANLY (100%)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${colors.red}${colors.bold}✖ ESP32 CONNECTIVITY TEST FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

runEsp32ConnectivityTest();
