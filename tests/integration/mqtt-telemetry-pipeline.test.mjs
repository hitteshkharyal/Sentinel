// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: MQTT Telemetry Ingestion Pipeline
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mqtt from 'mqtt';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import { MqttService } from '../../apps/api/dist/services/mqtt.service.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  DeviceModel,
  DeviceCredentialModel,
  UserModel,
  TelemetryModel,
} from '../../apps/api/dist/models/index.js';

describe('MQTT Telemetry Pipeline Integration Tests', () => {
  const brokerPort = 22883;
  let adminId;
  let orgId;
  let facilityId;
  let floorId;
  let roomId;
  let deviceId = `ESP32_TEST_${Date.now().toString().slice(-6)}`;
  let deviceToken = '';

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-mqtt-${Date.now()}@sentinel.local`,
        displayName: 'MQTT Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id;

    const org = await OrganizationModel.create({
      name: `Telemetry Pipeline Org ${Date.now()}`,
      slug: `telemetry-pipe-${Date.now()}`,
      industry: 'school',
      createdBy: adminId,
    });
    orgId = org._id.toString();

    const facility = await FacilityModel.create({
      organizationId: org._id,
      name: 'STEM Innovation Pavilion',
      code: 'STEM-01',
      type: 'academic_building',
      timezone: 'UTC',
    });
    facilityId = facility._id.toString();

    const floor = await FloorModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      name: 'Floor 1 - Robotics Lab',
      level: 1,
    });
    floorId = floor._id.toString();

    const room = await RoomModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      floorId: floor._id,
      name: 'Robotics Workshop 102',
      roomNumber: '102',
      roomType: 'classroom',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 25,
      currentCo2: 450,
      currentTemperature: 21.0,
      doorState: 'closed',
    });
    roomId = room._id.toString();

    // Create device and cryptographic credential
    await DeviceModel.create({
      organizationId: org._id,
      facilityId: facility._id,
      roomId: room._id,
      deviceId,
      name: 'STEM Lab Environmental Hub',
      model: 'ESP32-S3-WROOM-1',
      status: 'ONLINE',
      macAddress: 'CC:DD:EE:FF:11:22',
      capabilities: ['CO2', 'TEMPERATURE', 'PIR'],
    });

    const secret = DeviceCredentialModel.generateSecret();
    deviceToken = secret.token;

    await DeviceCredentialModel.create({
      organizationId: org._id,
      deviceId,
      credentialType: 'PRESHARED_TOKEN',
      keyPrefix: secret.prefix,
      hashedSecret: secret.hashed,
      status: 'ACTIVE',
    });

    await MqttService.startBroker(brokerPort);
  });

  after(async () => {
    await MqttService.stopBroker();
    await DeviceCredentialModel.deleteOne({ deviceId });
    await DeviceModel.deleteOne({ deviceId });
    await RoomModel.deleteOne({ _id: roomId });
    await FloorModel.deleteOne({ _id: floorId });
    await FacilityModel.deleteOne({ _id: facilityId });
    await OrganizationModel.deleteOne({ _id: orgId });
    await mongoose.disconnect();
  });

  it('should authenticate hardware node via MQTT and stream telemetry packet', async () => {
    const client = mqtt.connect(`mqtt://127.0.0.1:${brokerPort}`, {
      clientId: `CLIENT_${deviceId}`,
      username: deviceId,
      password: deviceToken,
      reconnectPeriod: 0,
      connectTimeout: 2000,
    });

    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('error', reject);
    });

    // Publish telemetry
    const topic = `sentinel/${orgId}/${facilityId}/${deviceId}/telemetry`;
    const telemetryPayload = {
      timestamp: new Date().toISOString(),
      sensors: {
        temperature: 24.2,
        co2: 920,
        humidity: 48,
        motion: true,
      },
    };

    await new Promise((resolve, reject) => {
      client.publish(topic, JSON.stringify(telemetryPayload), { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Allow async ingestion pipeline to process
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Verify room digital twin was updated
    const updatedRoom = await RoomModel.findById(roomId);
    assert.ok(updatedRoom);
    assert.equal(updatedRoom.currentCo2, 920);
    assert.equal(updatedRoom.currentTemperature, 24.2);

    client.end(true);
  });
});
