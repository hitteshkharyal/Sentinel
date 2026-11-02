// ─────────────────────────────────────────────
// SENTINEL Tests — Integration: Spatial Digital Twin Hierarchy
// ─────────────────────────────────────────────

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../../apps/api/dist/db.js';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  SensorModel,
  UserModel,
} from '../../apps/api/dist/models/index.js';

describe('Spatial Digital Twin Integration Tests', () => {
  let adminId;
  let orgId;
  let facilityId;
  let floorId;
  let roomId;
  let sensorId;

  before(async () => {
    await connectDatabase();

    const admin =
      (await UserModel.findOne({ role: 'SUPER_ADMIN' })) ||
      (await UserModel.create({
        email: `admin-twin-${Date.now()}@sentinel.local`,
        displayName: 'Twin Admin',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }));
    adminId = admin._id;
  });

  after(async () => {
    if (sensorId) await SensorModel.deleteOne({ _id: sensorId });
    if (roomId) await RoomModel.deleteOne({ _id: roomId });
    if (floorId) await FloorModel.deleteOne({ _id: floorId });
    if (facilityId) await FacilityModel.deleteOne({ _id: facilityId });
    if (orgId) await OrganizationModel.deleteOne({ _id: orgId });
    await mongoose.disconnect();
  });

  it('should establish complete spatial hierarchy: Org -> Facility -> Floor -> Room', async () => {
    const org = await OrganizationModel.create({
      name: `Spatial Twin Testing Org ${Date.now()}`,
      slug: `spatial-twin-${Date.now()}`,
      industry: 'hospital',
      createdBy: adminId,
    });
    orgId = org._id;

    const facility = await FacilityModel.create({
      organizationId: orgId,
      name: 'St. Jude Acute Care Tower',
      code: 'STJ-ACT',
      type: 'hospital_wing',
      timezone: 'UTC',
    });
    facilityId = facility._id;

    const floor = await FloorModel.create({
      organizationId: orgId,
      facilityId,
      name: 'Level 3 - Critical Recovery',
      level: 3,
    });
    floorId = floor._id;

    const room = await RoomModel.create({
      organizationId: orgId,
      facilityId,
      floorId,
      name: 'Patient Room 304 - Cardiac Monitoring',
      roomNumber: '304',
      roomType: 'hospital_room',
      privacyLevel: 'HIGH_PRIVACY',
      capacity: 1,
      currentTemperature: 21.5,
      currentCo2: 520,
      currentHumidity: 45,
      occupancyState: 'OCCUPIED',
      doorState: 'closed',
    });
    roomId = room._id;

    assert.ok(room._id);
    assert.equal(room.privacyLevel, 'HIGH_PRIVACY');
  });

  it('should attach calibrated sensor to room and synchronize live twin metrics', async () => {
    const sensor = await SensorModel.create({
      organizationId: orgId,
      facilityId,
      roomId,
      deviceId: `DEV_${Date.now()}`,
      name: 'Sensirion Photoacoustic CO2 Node',
      sensorType: 'CO2',
      model: 'SCD41',
      manufacturer: 'Sensirion',
      category: 'ENVIRONMENTAL',
      interfaceType: 'I2C',
      status: 'ONLINE',
      calibration: {
        offset: 0,
        multiplier: 1.0,
        baseline: 0,
      },
      lastReading: {
        value: 580,
        unit: 'ppm',
        timestamp: new Date().toISOString(),
      },
    });
    sensorId = sensor._id;

    // Simulate incoming telemetry twin update on RoomModel
    const updatedRoom = await RoomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          currentCo2: 740,
          currentTemperature: 22.8,
          currentSoundLevel: 42.5,
          lastTelemetryAt: new Date(),
        },
      },
      { new: true }
    );

    assert.ok(updatedRoom);
    assert.equal(updatedRoom.currentCo2, 740);
    assert.equal(updatedRoom.currentTemperature, 22.8);
    assert.equal(updatedRoom.currentSoundLevel, 42.5);
  });
});
