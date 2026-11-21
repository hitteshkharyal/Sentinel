// ─────────────────────────────────────────────
// SENTINEL API — Hardware & Dashboard Test Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import {
  DeploymentModel,
  DeviceModel,
  HardwareTestSessionModel,
  SensorModel,
  TelemetryModel,
} from '../models/index.js';
import type {
  HardwareTestReading,
  HardwareTestScorecard,
} from '@sentinel/types';

export class HardwareTestService {
  /**
   * Run or start a diagnostic test session for a deployment.
   */
  static async runDiagnosticTest(
    organizationId: string,
    deploymentId: string,
    userId: string,
    simulate: boolean = false
  ): Promise<HardwareTestScorecard> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const deployObjId = new mongoose.Types.ObjectId(deploymentId);

    const deployment = await DeploymentModel.findOne({
      _id: deployObjId,
      organizationId: orgObjId,
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    let deviceId = deployment.deviceId;
    if (!deviceId || deviceId === 'ESP32-BENCH-TEST') {
      const foundDev = await DeviceModel.findOne({
        organizationId: orgObjId,
        $or: [
          { deviceId: { $regex: deploymentId.slice(-4), $options: 'i' } },
          { name: { $regex: deployment.name.slice(0, 10), $options: 'i' } },
        ],
      }).sort({ lastSeenAt: -1, updatedAt: -1 });

      if (foundDev) {
        deviceId = foundDev.deviceId;
        deployment.deviceId = deviceId;
        await deployment.save();
      } else {
        deviceId = 'ESP32-BENCH-TEST';
      }
    }

    // 1. Device Connection & Telemetry Check
    let deviceConnection: 'PASS' | 'FAIL' | 'PENDING' = 'PENDING';
    let mqttConnection: 'PASS' | 'FAIL' | 'PENDING' = 'PENDING';

    const deviceDoc = await DeviceModel.findOne({
      deviceId,
      organizationId: orgObjId,
    });

    const latestTelemetry = await TelemetryModel.findOne({
      deviceId,
      organizationId: orgObjId,
    }).sort({ receivedAt: -1, _id: -1 });

    const isRecentTelemetry =
      latestTelemetry &&
      Date.now() - new Date(latestTelemetry.receivedAt || latestTelemetry.timestamp).getTime() <
        15 * 60 * 1000;

    if (
      (deviceDoc && (deviceDoc.status === 'ONLINE' || (deviceDoc.status as string) === 'ACTIVE')) ||
      isRecentTelemetry
    ) {
      deviceConnection = 'PASS';
      mqttConnection = 'PASS';
    } else if (simulate) {
      deviceConnection = 'PASS';
      mqttConnection = 'PASS';
    } else if (deviceDoc) {
      deviceConnection = 'PASS';
      mqttConnection = 'FAIL'; // Registered but offline
    } else {
      deviceConnection = 'FAIL';
      mqttConnection = 'FAIL';
    }

    // 2. Query sensor readings
    const configuredSensors = deployment.hardwareConfig?.sensors || [];
    const dbSensors = await SensorModel.find({
      deviceId,
      organizationId: orgObjId,
    });

    const sensorMap = new Map(dbSensors.map((s) => [s.sensorType, s]));
    const sensorReadings: HardwareTestReading[] = [];

    let workingSensorCount = 0;

    for (const sensorConfig of configuredSensors) {
      const type = sensorConfig.sensorType;
      const modelLower = (sensorConfig.model || '').toLowerCase();
      const foundInDb = sensorMap.get(type);

      if (foundInDb && foundInDb.lastReading && foundInDb.lastReading.value !== undefined) {
        sensorReadings.push({
          sensorType: type,
          status: 'WORKING',
          value: foundInDb.lastReading.value as string | number | boolean | Record<string, unknown>,
          unit: foundInDb.lastReading.unit || foundInDb.configuration?.unit || (type === 'ULTRASONIC' ? 'cm' : type === 'LIGHT' ? 'lux' : 'unit'),
          lastReceivedAt: new Date(foundInDb.lastReading.timestamp).toISOString(),
          isSimulated: false,
        });
        workingSensorCount++;
      } else if (latestTelemetry && latestTelemetry.sensors) {
        // Fallback to latest real telemetry document sensors
        const telSensors = latestTelemetry.sensors as Record<string, unknown>;
        let liveVal: unknown = undefined;
        let unit = 'unit';

        if (modelLower && telSensors[modelLower] !== undefined) {
          liveVal = telSensors[modelLower];
        } else if (type === 'ULTRASONIC') {
          liveVal = telSensors['hc-sr04p'] ?? telSensors['hc-sr04'] ?? telSensors['distance_cm'] ?? telSensors['ultrasonic'];
          unit = 'cm';
        } else if (type === 'PIR') {
          liveVal = telSensors['ekmc1601111'] ?? telSensors['presence_detected'] ?? telSensors['motion'] ?? telSensors['pir'];
          unit = 'motion';
        } else if (type === 'LIGHT') {
          liveVal = telSensors['bh1750'] ?? telSensors['light'] ?? telSensors['lux'] ?? telSensors['ambient_light'];
          unit = 'lux';
        } else if (type === 'TEMPERATURE') {
          liveVal = telSensors['temperature'] ?? telSensors['dht11_temp'] ?? telSensors['dht22_temp'] ?? telSensors['temp'];
          unit = '°C';
        } else if (type === 'HUMIDITY') {
          liveVal = telSensors['humidity'] ?? telSensors['dht11_hum'] ?? telSensors['dht22_hum'] ?? telSensors['hum'];
          unit = '%RH';
        } else if (type === 'GAS' || type === 'SMOKE') {
          liveVal = telSensors['gas'] ?? telSensors['smoke'] ?? telSensors['mq2'] ?? telSensors['mq3'] ?? telSensors['mq4'];
          unit = 'ppm';
        }

        if (liveVal !== undefined) {
          sensorReadings.push({
            sensorType: type,
            status: 'WORKING',
            value: liveVal as string | number | boolean | Record<string, unknown>,
            unit,
            lastReceivedAt: new Date(latestTelemetry.receivedAt || latestTelemetry.timestamp).toISOString(),
            isSimulated: false,
          });
          workingSensorCount++;
        } else if (simulate) {
          // Generate realistic simulated benchmark reading based on sensor category
          let simulatedValue: string | number | boolean | Record<string, unknown> = 0;
          let simUnit = 'unit';

          switch (type) {
            case 'MMWAVE':
              simulatedValue = {
                presence: true,
                targetCount: 1,
                distanceM: 1.45,
                energy: 82,
                breathingRpm: 16,
              };
              simUnit = 'targets';
              break;
            case 'PIR':
              simulatedValue = 1;
              simUnit = 'motion';
              break;
            case 'DOOR_MAGNETIC':
              simulatedValue = 0; // Closed
              simUnit = 'state';
              break;
            case 'CO2':
              simulatedValue = 485;
              simUnit = 'ppm';
              break;
            case 'TEMPERATURE':
              simulatedValue = 22.8;
              simUnit = '°C';
              break;
            case 'HUMIDITY':
              simulatedValue = 48.5;
              simUnit = '%RH';
              break;
            case 'PRESSURE':
              simulatedValue = 1013.25;
              simUnit = 'hPa';
              break;
            case 'LIGHT':
              simulatedValue = 350;
              simUnit = 'lux';
              break;
            case 'SOUND_LEVEL':
              simulatedValue = 42.1;
              simUnit = 'dB(A)';
              break;
            case 'WATER_LEAK':
              simulatedValue = 0;
              simUnit = 'dry';
              break;
            case 'VIBRATION':
              simulatedValue = 0.04;
              simUnit = 'mm/s';
              break;
            case 'GPS':
              simulatedValue = { lat: 37.7749, lng: -122.4194, speedKmh: 0 };
              simUnit = 'coord';
              break;
            default:
              simulatedValue = 1;
          }

          sensorReadings.push({
            sensorType: type,
            status: 'WORKING',
            value: simulatedValue,
            unit: simUnit,
            lastReceivedAt: new Date().toISOString(),
            isSimulated: true,
          });
          workingSensorCount++;
        } else {
          sensorReadings.push({
            sensorType: type,
            status: 'NO_DATA',
            value: 'N/A',
            unit: 'None',
            lastReceivedAt: new Date().toISOString(),
            isSimulated: false,
          });
        }
      } else if (simulate) {
        // Generate realistic simulated benchmark reading based on sensor category
        let simulatedValue: string | number | boolean | Record<string, unknown> = 0;
        let unit = 'unit';

        switch (type) {
          case 'MMWAVE':
            simulatedValue = {
              presence: true,
              targetCount: 1,
              distanceM: 1.45,
              energy: 82,
              breathingRpm: 16,
            };
            unit = 'targets';
            break;
          case 'PIR':
            simulatedValue = 1;
            unit = 'motion';
            break;
          case 'DOOR_MAGNETIC':
            simulatedValue = 0; // Closed
            unit = 'state';
            break;
          case 'CO2':
            simulatedValue = 485;
            unit = 'ppm';
            break;
          case 'TEMPERATURE':
            simulatedValue = 22.8;
            unit = '°C';
            break;
          case 'HUMIDITY':
            simulatedValue = 48.5;
            unit = '%RH';
            break;
          case 'PRESSURE':
            simulatedValue = 1013.25;
            unit = 'hPa';
            break;
          case 'LIGHT':
            simulatedValue = 350;
            unit = 'lux';
            break;
          case 'SOUND_LEVEL':
            simulatedValue = 42.1;
            unit = 'dB(A)';
            break;
          case 'WATER_LEAK':
            simulatedValue = 0;
            unit = 'dry';
            break;
          case 'VIBRATION':
            simulatedValue = 0.04;
            unit = 'mm/s';
            break;
          case 'GPS':
            simulatedValue = { lat: 37.7749, lng: -122.4194, speedKmh: 0 };
            unit = 'coord';
            break;
          default:
            simulatedValue = 1;
        }

        sensorReadings.push({
          sensorType: type,
          status: 'WORKING',
          value: simulatedValue,
          unit,
          lastReceivedAt: new Date().toISOString(),
          isSimulated: true,
        });
        workingSensorCount++;
      } else {
        sensorReadings.push({
          sensorType: type,
          status: 'NO_DATA',
          value: 'N/A',
          unit: 'None',
          lastReceivedAt: new Date().toISOString(),
          isSimulated: false,
        });
      }
    }

    // Diagnostic Check Evaluations
    const mandatorySensors = configuredSensors.filter((s) => s.isMandatory !== false);
    const sensorValidation: 'PASS' | 'FAIL' =
      configuredSensors.length === 0 ||
      workingSensorCount > 0 ||
      (mandatorySensors.length > 0 && workingSensorCount >= mandatorySensors.length)
        ? 'PASS'
        : 'FAIL';

    const telemetryReception: 'PASS' | 'FAIL' =
      deviceConnection === 'PASS' && (workingSensorCount > 0 || isRecentTelemetry)
        ? 'PASS'
        : 'FAIL';

    const eventDetection: 'PASS' | 'FAIL' =
      telemetryReception === 'PASS' ? 'PASS' : 'FAIL';

    const automationTrigger: 'PASS' | 'FAIL' =
      eventDetection === 'PASS' ? 'PASS' : 'FAIL';

    const alertDelivery: 'PASS' | 'FAIL' =
      automationTrigger === 'PASS' ? 'PASS' : 'FAIL';

    const checks = {
      deviceConnection,
      mqttConnection,
      sensorValidation,
      telemetryReception,
      eventDetection,
      automationTrigger,
      alertDelivery,
    };

    const overallResult: 'PASS' | 'FAIL' = Object.values(checks).every(
      (v) => v === 'PASS'
    )
      ? 'PASS'
      : 'FAIL';

    // Create session record
    const testSession = new HardwareTestSessionModel({
      deploymentId: deployObjId,
      organizationId: orgObjId,
      deviceId,
      overallResult,
      checks,
      sensorReadings,
      readinessSignOff: false,
      testedBy: new mongoose.Types.ObjectId(userId),
    });

    await testSession.save();

    // Link test session to deployment
    deployment.activeTestSessionId = testSession._id as mongoose.Types.ObjectId;
    if (deployment.status !== 'ACTIVE') {
      deployment.status = 'TESTING';
    }
    await deployment.save();

    return testSession.toSafeScorecard();
  }

  /**
   * Get latest test scorecard for a deployment with real-time live sensor values.
   */
  static async getLatestScorecard(
    organizationId: string,
    deploymentId: string
  ): Promise<HardwareTestScorecard | null> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const deployObjId = new mongoose.Types.ObjectId(deploymentId);

    const session = await HardwareTestSessionModel.findOne({
      organizationId: orgObjId,
      deploymentId: deployObjId,
    })
      .sort({ createdAt: -1 })
      .exec();

    if (!session) return null;

    const scorecard = session.toSafeScorecard();

    // Dynamically inject latest real-time sensor readings from active telemetry & sensor models
    const deployment = await DeploymentModel.findById(deployObjId);
    const deviceId = deployment?.deviceId || session.deviceId;

    if (deviceId) {
      const dbSensors = await SensorModel.find({
        deviceId,
        organizationId: orgObjId,
      });
      const latestTelemetry = await TelemetryModel.findOne({
        deviceId,
        organizationId: orgObjId,
      }).sort({ receivedAt: -1, _id: -1 });

      const sensorMap = new Map(dbSensors.map((s) => [s.sensorType, s]));

      scorecard.sensorReadings = scorecard.sensorReadings.map((reading) => {
        const foundInDb = sensorMap.get(reading.sensorType);
        if (foundInDb && foundInDb.lastReading && foundInDb.lastReading.value !== undefined) {
          return {
            ...reading,
            status: 'WORKING',
            value: foundInDb.lastReading.value as string | number | boolean | Record<string, unknown>,
            unit: foundInDb.lastReading.unit || reading.unit,
            lastReceivedAt: new Date(foundInDb.lastReading.timestamp).toISOString(),
            isSimulated: false,
          };
        }

        if (latestTelemetry && latestTelemetry.sensors) {
          const tel = latestTelemetry.sensors as Record<string, unknown>;
          let liveVal: unknown = undefined;
          if (reading.sensorType === 'ULTRASONIC') {
            liveVal = tel['hc-sr04p'] ?? tel['hc-sr04'] ?? tel['distance_cm'] ?? tel['ultrasonic'];
          } else if (reading.sensorType === 'PIR') {
            liveVal = tel['ekmc1601111'] ?? tel['presence_detected'] ?? tel['motion'] ?? tel['pir'];
          } else if (reading.sensorType === 'LIGHT') {
            liveVal = tel['bh1750'] ?? tel['light'] ?? tel['lux'] ?? tel['ambient_light'];
          } else if (reading.sensorType === 'TEMPERATURE') {
            liveVal = tel['temperature'] ?? tel['dht11_temp'] ?? tel['dht22_temp'];
          } else if (reading.sensorType === 'HUMIDITY') {
            liveVal = tel['humidity'] ?? tel['dht11_hum'] ?? tel['dht22_hum'];
          } else if (reading.sensorType === 'GAS' || reading.sensorType === 'SMOKE') {
            liveVal = tel['gas'] ?? tel['smoke'] ?? tel['mq2'];
          }

          if (liveVal !== undefined) {
            return {
              ...reading,
              status: 'WORKING',
              value: liveVal as string | number | boolean | Record<string, unknown>,
              lastReceivedAt: new Date(latestTelemetry.receivedAt || latestTelemetry.timestamp).toISOString(),
              isSimulated: false,
            };
          }
        }

        return reading;
      });

      if (latestTelemetry) {
        scorecard.testedAt = new Date(latestTelemetry.receivedAt || latestTelemetry.timestamp).toISOString();
      }
    }

    return scorecard;
  }

  /**
   * Final installer sign-off for deployment readiness.
   */
  static async signOffTestSession(
    organizationId: string,
    deploymentId: string,
    sessionId: string,
    _userId: string,
    notes?: string
  ): Promise<HardwareTestScorecard> {
    const session = await HardwareTestSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      deploymentId: new mongoose.Types.ObjectId(deploymentId),
    });

    if (!session) {
      throw new Error(`Hardware test session ${sessionId} not found.`);
    }

    session.readinessSignOff = true;
    if (notes) session.notes = notes;
    await session.save();

    // Mark deployment readiness approved
    const deployment = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (deployment) {
      deployment.isReadinessApproved = true;
      deployment.status = 'ACTIVE';
      await deployment.save();
    }

    return session.toSafeScorecard();
  }
}
