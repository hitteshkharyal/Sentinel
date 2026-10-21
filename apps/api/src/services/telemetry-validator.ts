// ─────────────────────────────────────────────
// SENTINEL API — Authoritative Telemetry Validation Engine
// ─────────────────────────────────────────────

import {
  DeviceModel,
  RoomModel,
  SensorModel,
  TelemetryModel,
  ITelemetryDocument,
} from '../models/index.js';
import type {
  TelemetryMessage,
  ValidatedTelemetry,
  TelemetrySensorData,
} from '@sentinel/types';
import { EventEmitter } from 'node:events';

export class TelemetryEventBus extends EventEmitter {}
export const telemetryBus = new TelemetryEventBus();

// Maximum allowed time drift
const MAX_PAST_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FUTURE_MS = 5 * 60 * 1000; // 5 minutes

export class TelemetryValidator {
  /**
   * Authoritatively validate, calibrate, persist, and update spatial twin states.
   */
  static async validateAndProcess(
    message: TelemetryMessage,
    context?: {
      expectedOrgId?: string;
      expectedFacilityId?: string;
    }
  ): Promise<{
    telemetry: ValidatedTelemetry;
    telemetryDoc: ITelemetryDocument;
  }> {
    const validationErrors: string[] = [];
    const upperDeviceId = message.deviceId.trim().toUpperCase();

    // ── 1. Device Identity & Boundary Verification ──
    const device = await DeviceModel.findOne({ deviceId: upperDeviceId });
    if (!device) {
      throw new Error(`Unauthorized telemetry: Device "${upperDeviceId}" is not registered.`);
    }

    if (device.status === 'DISABLED') {
      throw new Error(`Rejected telemetry: Device "${upperDeviceId}" is disabled.`);
    }

    // Verify tenant boundary matching
    if (context?.expectedOrgId && device.organizationId.toString() !== context.expectedOrgId) {
      throw new Error(
        `Cross-tenant telemetry rejected: Device "${upperDeviceId}" belongs to organization ${device.organizationId}, not ${context.expectedOrgId}.`
      );
    }

    if (
      context?.expectedFacilityId &&
      device.facilityId.toString() !== context.expectedFacilityId
    ) {
      throw new Error(
        `Cross-facility telemetry rejected: Device "${upperDeviceId}" belongs to facility ${device.facilityId}, not ${context.expectedFacilityId}.`
      );
    }

    // ── 2. Timestamp Validity ──
    const msgDate = new Date(message.timestamp);
    const now = Date.now();
    const msgTime = msgDate.getTime();

    if (isNaN(msgTime)) {
      validationErrors.push('Invalid timestamp format: unable to parse ISO date.');
    } else if (now - msgTime > MAX_PAST_MS) {
      validationErrors.push(
        `Stale telemetry: Timestamp is older than 24 hours (${message.timestamp}).`
      );
    } else if (msgTime - now > MAX_FUTURE_MS) {
      validationErrors.push(
        `Future timestamp rejected: Clock drift exceeds 5 minutes (${message.timestamp}).`
      );
    }

    // ── 3. Sensor Data Type & Physical Range Validation ──
    const rawSensors = message.sensors || {};
    const sanitizedSensors: TelemetrySensorData = {};

    // Temperature (-50 to 125 C)
    if (rawSensors.temperature !== undefined) {
      const val = Number(rawSensors.temperature);
      if (isNaN(val) || !isFinite(val)) {
        validationErrors.push('Invalid temperature: value must be a finite number.');
      } else if (val < -50 || val > 125) {
        validationErrors.push(
          `Temperature out of physical sensor range: ${val} °C (expected -50 to 125).`
        );
      } else {
        sanitizedSensors.temperature = Math.round(val * 100) / 100;
      }
    }

    // Humidity (0 to 100 %)
    if (rawSensors.humidity !== undefined) {
      const val = Number(rawSensors.humidity);
      if (isNaN(val) || !isFinite(val) || val < 0 || val > 100) {
        validationErrors.push(
          `Humidity out of physical range: ${val} % (expected 0 to 100).`
        );
      } else {
        sanitizedSensors.humidity = Math.round(val * 10) / 10;
      }
    }

    // CO2 (300 to 10,000 ppm)
    if (rawSensors.co2 !== undefined) {
      const val = Number(rawSensors.co2);
      if (isNaN(val) || !isFinite(val) || val < 0 || val > 40000) {
        validationErrors.push(`CO2 reading out of valid range: ${val} ppm.`);
      } else {
        sanitizedSensors.co2 = Math.round(val);
      }
    }

    // Sound Level (20 to 140 dB)
    if (rawSensors.soundLevel !== undefined) {
      const val = Number(rawSensors.soundLevel);
      if (isNaN(val) || !isFinite(val) || val < 0 || val > 160) {
        validationErrors.push(`Sound level out of physical range: ${val} dB.`);
      } else {
        sanitizedSensors.soundLevel = Math.round(val * 10) / 10;
      }
    }

    // PIR Motion (boolean)
    if (rawSensors.pir !== undefined) {
      sanitizedSensors.pir = Boolean(rawSensors.pir);
    }

    // mmWave Radar (presence, count, distance, confidence)
    if (rawSensors.mmwave !== undefined) {
      const mm = rawSensors.mmwave;
      if (typeof mm !== 'object' || mm === null) {
        validationErrors.push('Invalid mmWave data structure: expected object.');
      } else {
        sanitizedSensors.mmwave = {
          presence: Boolean(mm.presence),
          count: typeof mm.count === 'number' ? Math.max(0, Math.floor(mm.count)) : undefined,
          distance:
            typeof mm.distance === 'number'
              ? Math.round(mm.distance * 100) / 100
              : undefined,
          energy: typeof mm.energy === 'number' ? Math.round(mm.energy) : undefined,
          stationaryConfidence:
            typeof mm.stationaryConfidence === 'number'
              ? Math.round(mm.stationaryConfidence)
              : undefined,
          movementConfidence:
            typeof mm.movementConfidence === 'number'
              ? Math.round(mm.movementConfidence)
              : undefined,
        };
      }
    }

    // Door Magnetic Switch ('open' | 'closed')
    if (rawSensors.door !== undefined) {
      const state = String(rawSensors.door).toLowerCase();
      if (state === 'open' || state === 'closed') {
        sanitizedSensors.door = state;
      } else {
        validationErrors.push(`Invalid door state: "${rawSensors.door}" (expected "open" | "closed").`);
      }
    }

    // Barometric Pressure (200 to 1500 hPa)
    if (rawSensors.pressure !== undefined) {
      const val = Number(rawSensors.pressure);
      if (isNaN(val) || val < 200 || val > 1500) {
        validationErrors.push(`Pressure out of valid barometric range: ${val} hPa.`);
      } else {
        sanitizedSensors.pressure = Math.round(val * 100) / 100;
      }
    }

    // Ambient Light (0 to 150,000 lux)
    if (rawSensors.light !== undefined) {
      const val = Number(rawSensors.light);
      if (isNaN(val) || val < 0) {
        validationErrors.push(`Ambient light out of range: ${val} lux.`);
      } else {
        sanitizedSensors.light = Math.round(val);
      }
    }

    // Smoke (boolean or ppm)
    if (rawSensors.smoke !== undefined) {
      sanitizedSensors.smoke =
        typeof rawSensors.smoke === 'number' ? Number(rawSensors.smoke) : Boolean(rawSensors.smoke);
    }

    // Gas / VOC
    if (rawSensors.gas !== undefined) {
      sanitizedSensors.gas = Number(rawSensors.gas);
    }

    // Flame
    if (rawSensors.flame !== undefined) {
      sanitizedSensors.flame = Boolean(rawSensors.flame);
    }

    // Water Leak
    if (rawSensors.waterLeak !== undefined) {
      sanitizedSensors.waterLeak = Boolean(rawSensors.waterLeak);
    }

    // Ultrasonic Sonar
    if (rawSensors.ultrasonic !== undefined) {
      sanitizedSensors.ultrasonic = Number(rawSensors.ultrasonic);
    }

    // Current Clamp
    if (rawSensors.current !== undefined) {
      sanitizedSensors.current = Number(rawSensors.current);
    }

    // Vibration
    if (rawSensors.vibration !== undefined) {
      sanitizedSensors.vibration = Number(rawSensors.vibration);
    }

    // GPS
    if (rawSensors.gps !== undefined && typeof rawSensors.gps === 'object' && rawSensors.gps !== null) {
      sanitizedSensors.gps = {
        latitude: Number(rawSensors.gps.latitude),
        longitude: Number(rawSensors.gps.longitude),
        speed: rawSensors.gps.speed !== undefined ? Number(rawSensors.gps.speed) : undefined,
        altitude: rawSensors.gps.altitude !== undefined ? Number(rawSensors.gps.altitude) : undefined,
        satellites: rawSensors.gps.satellites !== undefined ? Number(rawSensors.gps.satellites) : undefined,
      };
    }

    // RFID
    if (rawSensors.rfid !== undefined && typeof rawSensors.rfid === 'object' && rawSensors.rfid !== null) {
      sanitizedSensors.rfid = {
        uid: String(rawSensors.rfid.uid),
        tagType: rawSensors.rfid.tagType ? String(rawSensors.rfid.tagType) : undefined,
      };
    }

    const isValid = validationErrors.length === 0;

    // ── 4. Apply Calibration to Configured Peripherals ──
    const attachedSensors = await SensorModel.find({
      organizationId: device.organizationId,
      deviceId: device.deviceId,
      enabled: true,
    });

    let calibratedTemp = sanitizedSensors.temperature;
    let calibratedCo2 = sanitizedSensors.co2;

    for (const sensorDoc of attachedSensors) {
      const typeKey = sensorDoc.sensorType.toLowerCase();
      let matchedVal = sanitizedSensors[typeKey as keyof TelemetrySensorData];

      // Special alias mapping
      if (matchedVal === undefined) {
        if (sensorDoc.sensorType === 'DOOR_MAGNETIC') matchedVal = sanitizedSensors.door;
        if (sensorDoc.sensorType === 'SOUND_LEVEL') matchedVal = sanitizedSensors.soundLevel;
        if (sensorDoc.sensorType === 'WATER_LEAK') matchedVal = sanitizedSensors.waterLeak;
      }

      if (matchedVal !== undefined) {
        let finalValue = matchedVal;

        // Apply linear calibration formula if numerical
        if (
          typeof matchedVal === 'number' &&
          sensorDoc.calibration &&
          (sensorDoc.calibration.multiplier !== 1 ||
            sensorDoc.calibration.offset !== 0 ||
            sensorDoc.calibration.baseline !== 0)
        ) {
          const { baseline = 0, multiplier = 1, offset = 0, noiseFloor } = sensorDoc.calibration;
          let calVal = (matchedVal - baseline) * multiplier + offset;
          if (noiseFloor !== undefined && Math.abs(calVal) < noiseFloor) {
            calVal = 0;
          }
          finalValue = Math.round(calVal * 100) / 100;
        }

        if (sensorDoc.sensorType === 'TEMPERATURE' && typeof finalValue === 'number') {
          calibratedTemp = finalValue;
        }
        if (sensorDoc.sensorType === 'CO2' && typeof finalValue === 'number') {
          calibratedCo2 = finalValue;
        }

        // Update sensor document's lastReading
        sensorDoc.lastReading = {
          value: finalValue as number | string | boolean | Record<string, unknown>,
          unit: sensorDoc.configuration?.unit,
          timestamp: message.timestamp,
        };
        sensorDoc.status = 'ONLINE';
        await sensorDoc.save();
      }
    }

    // ── 5. Persist Telemetry Entity in MongoDB ──
    const telemetryDoc = new TelemetryModel({
      organizationId: device.organizationId,
      facilityId: device.facilityId,
      roomId: device.roomId,
      deviceId: device.deviceId,
      timestamp: isNaN(msgTime) ? new Date() : msgDate,
      receivedAt: new Date(),
      sensors: sanitizedSensors,
      valid: isValid,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      metadata: message.metadata || {},
    });

    await telemetryDoc.save();

    // ── 6. Update Spatial Room State (Digital Twin Synchronization) ──
    if (device.roomId) {
      const roomUpdate: Record<string, unknown> = {
        lastTelemetryReceivedAt: new Date(),
      };

      if (calibratedTemp !== undefined) {
        roomUpdate.currentTemperature = calibratedTemp;
      }
      if (sanitizedSensors.humidity !== undefined) {
        roomUpdate.currentHumidity = sanitizedSensors.humidity;
      }
      if (calibratedCo2 !== undefined) {
        roomUpdate.currentCo2 = calibratedCo2;
      }
      if (sanitizedSensors.soundLevel !== undefined) {
        roomUpdate.currentSoundLevel = sanitizedSensors.soundLevel;
      }
      if (sanitizedSensors.door !== undefined) {
        roomUpdate.doorState = sanitizedSensors.door;
      }

      // Preliminary presence state update (fused in Day 9)
      if (sanitizedSensors.mmwave) {
        if (sanitizedSensors.mmwave.presence) {
          roomUpdate.occupancyState = 'OCCUPIED';
          roomUpdate.estimatedOccupants = Math.max(1, sanitizedSensors.mmwave.count || 1);
          roomUpdate.occupancyConfidence = Math.max(
            85,
            sanitizedSensors.mmwave.stationaryConfidence || 90
          );
        } else if (sanitizedSensors.pir === false) {
          roomUpdate.occupancyState = 'EMPTY';
          roomUpdate.estimatedOccupants = 0;
          roomUpdate.occupancyConfidence = 95;
        }
      }

      await RoomModel.updateOne({ _id: device.roomId }, { $set: roomUpdate });
    }

    // ── 7. Update Microcontroller State ──
    const deviceUpdate: Record<string, unknown> = {
      status: 'ONLINE',
      lastSeenAt: new Date(),
      lastHeartbeatAt: new Date(),
      lastError: undefined,
    };

    if (message.metadata) {
      deviceUpdate['metadata.wifiRssiDbm'] = message.metadata.wifiRssiDbm ?? device.metadata?.wifiRssiDbm;
      deviceUpdate['metadata.freeHeapBytes'] = message.metadata.freeHeapBytes ?? device.metadata?.freeHeapBytes;
      deviceUpdate['metadata.uptimeSeconds'] = message.metadata.uptimeSeconds ?? device.metadata?.uptimeSeconds;
      deviceUpdate['metadata.batteryPercent'] = message.metadata.batteryPercent ?? device.metadata?.batteryPercent;
      if (message.metadata.ipAddress) {
        deviceUpdate.ipAddress = String(message.metadata.ipAddress);
      }
    }

    await DeviceModel.updateOne({ _id: device._id }, { $set: deviceUpdate });

    // ── 8. Emit to Real-time Stream & WebSockets ──
    const validatedResult: ValidatedTelemetry = {
      id: telemetryDoc._id.toString(),
      organizationId: device.organizationId.toString(),
      facilityId: device.facilityId.toString(),
      roomId: device.roomId ? device.roomId.toString() : undefined,
      deviceId: device.deviceId,
      timestamp: message.timestamp,
      receivedAt: telemetryDoc.receivedAt.toISOString(),
      sensors: sanitizedSensors,
      valid: isValid,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      metadata: message.metadata,
    };

    telemetryBus.emit('telemetry', validatedResult);

    return {
      telemetry: validatedResult,
      telemetryDoc,
    };
  }
}
