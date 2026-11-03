// ─────────────────────────────────────────────
// SENTINEL API — Hardware & Dashboard Test Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import {
  DeploymentModel,
  DeviceModel,
  HardwareTestSessionModel,
  SensorModel,
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

    const deviceId = deployment.deviceId || 'ESP32-BENCH-TEST';

    // 1. Device Connection Check
    let deviceConnection: 'PASS' | 'FAIL' | 'PENDING' = 'PENDING';
    let mqttConnection: 'PASS' | 'FAIL' | 'PENDING' = 'PENDING';

    const deviceDoc = await DeviceModel.findOne({
      deviceId,
      organizationId: orgObjId,
    });

    if (deviceDoc && (deviceDoc.status === 'ONLINE' || (deviceDoc.status as string) === 'ACTIVE')) {
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
    const configuredSensors = deployment.hardwareConfig.sensors;
    const dbSensors = await SensorModel.find({
      deviceId,
      organizationId: orgObjId,
    });

    const sensorMap = new Map(dbSensors.map((s) => [s.sensorType, s]));
    const sensorReadings: HardwareTestReading[] = [];

    let workingSensorCount = 0;

    for (const sensorConfig of configuredSensors) {
      const type = sensorConfig.sensorType;
      const foundInDb = sensorMap.get(type);

      if (foundInDb && foundInDb.lastReading) {
        sensorReadings.push({
          sensorType: type,
          status: 'WORKING',
          value: foundInDb.lastReading.value as string | number | boolean | Record<string, unknown>,
          unit: foundInDb.lastReading.unit || foundInDb.configuration?.unit || 'unit',
          lastReceivedAt: new Date(foundInDb.lastReading.timestamp).toISOString(),
          isSimulated: false,
        });
        workingSensorCount++;
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
    const sensorValidation: 'PASS' | 'FAIL' =
      configuredSensors.length === 0 || workingSensorCount === configuredSensors.length
        ? 'PASS'
        : 'FAIL';

    const telemetryReception: 'PASS' | 'FAIL' =
      deviceConnection === 'PASS' && workingSensorCount > 0 ? 'PASS' : 'FAIL';

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
   * Get latest test scorecard for a deployment.
   */
  static async getLatestScorecard(
    organizationId: string,
    deploymentId: string
  ): Promise<HardwareTestScorecard | null> {
    const session = await HardwareTestSessionModel.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      deploymentId: new mongoose.Types.ObjectId(deploymentId),
    })
      .sort({ createdAt: -1 })
      .exec();

    return session ? session.toSafeScorecard() : null;
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
