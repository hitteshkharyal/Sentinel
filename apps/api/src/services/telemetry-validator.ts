// ─────────────────────────────────────────────
// SENTINEL API — Authoritative Telemetry Validation Engine
// ─────────────────────────────────────────────

import {
  DeviceModel,
  RoomModel,
  SensorModel,
  TelemetryModel,
  DeploymentModel,
  ITelemetryDocument,
} from '../models/index.js';
import type {
  TelemetryMessage,
  ValidatedTelemetry,
  TelemetrySensorData,
} from '@sentinel/types';
import { EventEmitter } from 'node:events';
import { EventService } from './event.service.js';

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
    const rawTemp =
      rawSensors.temperature ??
      rawSensors.temp ??
      rawSensors.dht11_temp ??
      rawSensors.dht22_temp ??
      rawSensors.bme280_temp;
    if (rawTemp !== undefined) {
      const val = Number(rawTemp);
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
    const rawHum =
      rawSensors.humidity ??
      rawSensors.hum ??
      rawSensors.dht11_hum ??
      rawSensors.dht22_hum ??
      rawSensors.bme280_hum;
    if (rawHum !== undefined) {
      const val = Number(rawHum);
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

    // PIR Motion (boolean) - accepts raw pir, presence_detected, motion, or model name ekmc1601111
    const rawPir =
      rawSensors.pir ??
      rawSensors.ekmc1601111 ??
      rawSensors['ekmc-1601111'] ??
      rawSensors.presence_detected ??
      rawSensors.motion;
    if (rawPir !== undefined) {
      sanitizedSensors.pir = Boolean(rawPir);
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

    // Ambient Light (0 to 150,000 lux) - accepts raw light, bh1750, lux, ambient_light
    const rawLight =
      rawSensors.light ??
      rawSensors.bh1750 ??
      rawSensors.lux ??
      rawSensors.ambient_light;
    if (rawLight !== undefined) {
      const val = Number(rawLight);
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

    // Gas / VOC - accepts raw gas, or MQ analog readings (mq2, mq3, mq4, mq5, mq6, mq7, mq8, mq9, mq135)
    const rawGas =
      rawSensors.gas ??
      rawSensors.mq2 ??
      rawSensors.mq3 ??
      rawSensors.mq4 ??
      rawSensors.mq5 ??
      rawSensors.mq6 ??
      rawSensors.mq7 ??
      rawSensors.mq8 ??
      rawSensors.mq9 ??
      rawSensors.mq135;
    if (rawGas !== undefined) {
      sanitizedSensors.gas = Number(rawGas);
    }

    // Flame
    if (rawSensors.flame !== undefined) {
      sanitizedSensors.flame = Boolean(rawSensors.flame);
    }

    // Water Leak
    if (rawSensors.waterLeak !== undefined) {
      sanitizedSensors.waterLeak = Boolean(rawSensors.waterLeak);
    }

    // Ultrasonic Sonar - accepts raw ultrasonic, distance_cm, hc-sr04p, hc-sr04
    const rawUltra =
      rawSensors.ultrasonic ??
      rawSensors['hc-sr04p'] ??
      rawSensors['hc-sr04'] ??
      rawSensors.distance_cm;
    if (rawUltra !== undefined) {
      sanitizedSensors.ultrasonic = Number(rawUltra);
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
    let attachedSensors = await SensorModel.find({
      organizationId: device.organizationId,
      deviceId: device.deviceId,
      enabled: true,
    });

    if (attachedSensors.length === 0) {
      // Auto-provision sensor documents from deployment hardware config if available
      const deployment = await DeploymentModel.findOne({
        organizationId: device.organizationId,
        $or: [
          { deviceId: device.deviceId },
          { name: { $regex: device.deviceId.replace(/^SENT-/, '').slice(0, 6), $options: 'i' } },
        ],
      });
      if (deployment?.hardwareConfig?.sensors?.length) {
        for (const sCfg of deployment.hardwareConfig.sensors) {
          try {
            await SensorModel.create({
              deviceId: device.deviceId,
              name: `${sCfg.sensorType} (${sCfg.model})`,
              organizationId: deployment.organizationId,
              facilityId: deployment.facilityId,
              roomId: deployment.roomId,
              sensorType: sCfg.sensorType,
              model: sCfg.model,
              manufacturer: sCfg.manufacturer || 'Sentinel Certified',
              category: sCfg.category || 'PRESENCE_MOTION',
              interfaceType: sCfg.interfaceType || 'GPIO',
              assignedPins: sCfg.assignedPins || [],
              samplingIntervalMs: sCfg.samplingIntervalMs || 5000,
              status: 'ONLINE',
              enabled: true,
              isMandatory: sCfg.isMandatory ?? true,
              unit: sCfg.sensorType === 'ULTRASONIC' ? 'cm' : sCfg.sensorType === 'LIGHT' ? 'lux' : 'unit',
              configuration: {
                samplingIntervalMs: 5000,
                unit: sCfg.sensorType === 'ULTRASONIC' ? 'cm' : sCfg.sensorType === 'LIGHT' ? 'lux' : 'unit',
              },
            });
          } catch {
            // Sensor may have been created concurrently
          }
        }
        attachedSensors = await SensorModel.find({
          organizationId: device.organizationId,
          deviceId: device.deviceId,
          enabled: true,
        });
      }
    }

    let calibratedTemp = sanitizedSensors.temperature;
    let calibratedCo2 = sanitizedSensors.co2;

    for (const sensorDoc of attachedSensors) {
      const typeKey = sensorDoc.sensorType.toLowerCase();
      let matchedVal = sanitizedSensors[typeKey as keyof TelemetrySensorData];

      // Special alias & model mapping
      if (matchedVal === undefined) {
        const modelKey = sensorDoc.model?.toLowerCase();
        if (modelKey && rawSensors[modelKey] !== undefined) {
          matchedVal = rawSensors[modelKey];
        } else if (sensorDoc.sensorType === 'DOOR_MAGNETIC') matchedVal = sanitizedSensors.door;
        else if (sensorDoc.sensorType === 'SOUND_LEVEL') matchedVal = sanitizedSensors.soundLevel;
        else if (sensorDoc.sensorType === 'WATER_LEAK') matchedVal = sanitizedSensors.waterLeak;
        else if (sensorDoc.sensorType === 'ULTRASONIC') {
          matchedVal = sanitizedSensors.ultrasonic ?? rawSensors['hc-sr04p'] ?? rawSensors['hc-sr04'] ?? rawSensors.distance_cm;
        } else if (sensorDoc.sensorType === 'PIR') {
          matchedVal = sanitizedSensors.pir ?? rawSensors['ekmc1601111'] ?? rawSensors.presence_detected ?? rawSensors.motion;
        } else if (sensorDoc.sensorType === 'LIGHT') {
          matchedVal = sanitizedSensors.light ?? rawSensors['bh1750'] ?? rawSensors.lux ?? rawSensors.ambient_light;
        } else if (sensorDoc.sensorType === 'TEMPERATURE') {
          matchedVal = sanitizedSensors.temperature ?? rawSensors.temp ?? rawSensors.dht11_temp;
        } else if (sensorDoc.sensorType === 'HUMIDITY') {
          matchedVal = sanitizedSensors.humidity ?? rawSensors.hum ?? rawSensors.dht11_hum;
        } else if (sensorDoc.sensorType === 'GAS' || sensorDoc.sensorType === 'SMOKE') {
          matchedVal = sanitizedSensors.gas ?? sanitizedSensors.smoke ?? rawSensors.mq2 ?? rawSensors.mq3;
        }
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
          unit: sensorDoc.configuration?.unit || (sensorDoc.sensorType === 'ULTRASONIC' ? 'cm' : sensorDoc.sensorType === 'LIGHT' ? 'lux' : 'unit'),
          timestamp: message.timestamp,
        };
        sensorDoc.status = 'ONLINE';
        await sensorDoc.save();
      }
    }

    // ── 5. Persist Telemetry Entity in MongoDB ──
    const combinedSensors = {
      ...rawSensors,
      ...sanitizedSensors,
    };

    const telemetryDoc = new TelemetryModel({
      organizationId: device.organizationId,
      facilityId: device.facilityId,
      roomId: device.roomId,
      deviceId: device.deviceId,
      timestamp: isNaN(msgTime) ? new Date() : msgDate,
      receivedAt: new Date(),
      sensors: combinedSensors,
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

    // ── 9. Trigger Sensor Fusion & Event Engine ──
    if (isValid && device.roomId) {
      try {
        await EventService.evaluateTelemetry(validatedResult);
      } catch (err) {
        console.error('[TelemetryValidator] Failed to evaluate event telemetry:', err);
      }
    }

    return {
      telemetry: validatedResult,
      telemetryDoc,
    };
  }
}
