// ─────────────────────────────────────────────
// SENTINEL API — Deployment Service
// ─────────────────────────────────────────────

import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {
  DeploymentModel,
  FacilityModel,
  RoomModel,
  SensorModel,
  DeviceModel,
} from '../models/index.js';
import { DeviceService } from './device.service.js';
import type {
  CreateDeploymentDTO,
  Deployment,
  DeploymentHardwareConfig,
  DeploymentStatus,
  HardwareValidationIssue,
  HardwareValidationResult,
  PinConflict,
  SensorInterface,
  UpdateDeploymentDTO,
  Device,
  DeviceRegistrationCredentials,
} from '@sentinel/types';

export class DeploymentService {
  /**
   * Validate hardware configuration for ESP32 constraints, pin conflicts, and voltage/power compatibility.
   */
  static validateHardwareConfig(
    hardwareConfig: DeploymentHardwareConfig
  ): HardwareValidationResult {
    const conflicts: PinConflict[] = [];
    const issues: HardwareValidationIssue[] = [];
    const assignedPinsMap = new Map<number, string[]>();
    const requiredInterfaces = new Set<SensorInterface>();

    // 1. ESP32 Reserved & Input-Only GPIO sets
    const FLASH_SPI_PINS = new Set([6, 7, 8, 9, 10, 11]);
    const INPUT_ONLY_PINS = new Set([34, 35, 36, 39]);
    const STRAPPING_PINS = new Set([0, 2, 12, 15]);
    const ADC2_PINS = new Set([0, 2, 4, 12, 13, 14, 15, 25, 26, 27]);

    const sdaPin = hardwareConfig.i2cBus?.sdaPin ?? 21;
    const sclPin = hardwareConfig.i2cBus?.sclPin ?? 22;

    let basePowerMa = 160; // ESP32 base active Wi-Fi current

    // Map sensors to assigned pins
    for (const sensor of hardwareConfig.sensors) {
      requiredInterfaces.add(sensor.interfaceType);

      // Power estimation per sensor
      switch (sensor.sensorType) {
        case 'MMWAVE':
          basePowerMa += 80;
          break;
        case 'CO2':
          basePowerMa += 45;
          break;
        case 'TEMPERATURE':
        case 'HUMIDITY':
          basePowerMa += 3;
          break;
        case 'PIR':
          basePowerMa += 1;
          break;
        case 'SOUND_LEVEL':
          basePowerMa += 5;
          break;
        case 'DOOR_MAGNETIC':
          basePowerMa += 1;
          break;
        case 'PRESSURE':
          basePowerMa += 15;
          break;
        case 'LIGHT':
          basePowerMa += 2;
          break;
        case 'SMOKE':
        case 'GAS':
          basePowerMa += 150; // MQ heater element
          break;
        case 'FLAME':
          basePowerMa += 15;
          break;
        case 'VIBRATION':
          basePowerMa += 5;
          break;
        case 'ULTRASONIC':
          basePowerMa += 20;
          break;
        case 'CURRENT':
          basePowerMa += 10;
          break;
        case 'GPS':
          basePowerMa += 60;
          break;
        default:
          basePowerMa += 10;
      }

      // Special dependency checks
      if (sensor.sensorType === 'PRESSURE' && !sensor.requiredAmplifierModule) {
        issues.push({
          severity: 'WARNING',
          code: 'AMPLIFIER_RECOMMENDED',
          message: `Pressure sensor (${sensor.model}) may require an HX711 or instrumentation amplifier for accurate ADC readings.`,
          suggestedAction: 'Add an HX711 amplifier module or verify sensor internal signal conditioning.',
        });
      }

      if (
        (sensor.sensorType === 'CURRENT' || sensor.sensorType === 'GAS') &&
        sensor.isolatedInterfaceRequired
      ) {
        issues.push({
          severity: 'INFO',
          code: 'GALVANIC_ISOLATION_REQUIRED',
          message: `Sensor ${sensor.model} operates in high-noise/high-voltage industrial domain. Ensure optocoupler or level-shifter is used.`,
        });
      }

      // Check pin assignments for this sensor
      for (const pin of sensor.assignedPins) {
        // Reserved SPI flash
        if (FLASH_SPI_PINS.has(pin)) {
          issues.push({
            severity: 'ERROR',
            code: 'FLASH_SPI_PIN_CONFLICT',
            message: `GPIO ${pin} is hard-wired to internal SPI flash on ESP32. Using this pin will cause immediate boot crashes.`,
            suggestedAction: 'Select an available general purpose GPIO (e.g., 4, 13, 14, 18, 19, 23, 25, 26, 27).',
          });
        }

        // ADC2 conflict with Wi-Fi
        if (sensor.interfaceType === 'ADC' && ADC2_PINS.has(pin)) {
          issues.push({
            severity: 'WARNING',
            code: 'ADC2_WIFI_CONFLICT',
            message: `GPIO ${pin} is on ADC2. ESP32 hardware disables ADC2 when Wi-Fi is active, leading to corrupted readings.`,
            suggestedAction: 'Move analog sensor to an ADC1 pin (GPIO 32, 33, 34, 35, 36, or 39).',
          });
        }

        // Strapping pin warning
        if (STRAPPING_PINS.has(pin)) {
          issues.push({
            severity: 'WARNING',
            code: 'STRAPPING_PIN_USED',
            message: `GPIO ${pin} is an ESP32 strapping pin. Ensure external pull-up or pull-down does not prevent normal boot.`,
          });
        }

        // Non-I2C pin conflicts
        const isI2CPin =
          sensor.interfaceType === 'I2C' && (pin === sdaPin || pin === sclPin);
        if (!isI2CPin) {
          const existing = assignedPinsMap.get(pin) || [];
          existing.push(`${sensor.sensorType} (${sensor.model})`);
          assignedPinsMap.set(pin, existing);
        }
      }
    }

    // Map actuators to assigned pins
    for (const actuator of hardwareConfig.actuators) {
      basePowerMa += actuator.actuatorType === 'RELAY' ? 70 : 30;
      const pin = actuator.assignedPin;

      if (FLASH_SPI_PINS.has(pin)) {
        issues.push({
          severity: 'ERROR',
          code: 'FLASH_SPI_PIN_CONFLICT',
          message: `GPIO ${pin} assigned to actuator ${actuator.actuatorType} is reserved for internal SPI flash.`,
        });
      }

      if (INPUT_ONLY_PINS.has(pin)) {
        issues.push({
          severity: 'ERROR',
          code: 'INPUT_ONLY_PIN_FOR_OUTPUT',
          message: `GPIO ${pin} is an input-only pin (GPI) on ESP32 and cannot drive actuators (${actuator.actuatorType}).`,
          suggestedAction: 'Assign an output-capable GPIO such as 2, 4, 13, 14, 25, 26, or 27.',
        });
      }

      const existing = assignedPinsMap.get(pin) || [];
      existing.push(`Actuator ${actuator.actuatorType} (${actuator.model})`);
      assignedPinsMap.set(pin, existing);
    }

    // Evaluate pin conflicts
    for (const [pinNumber, users] of assignedPinsMap.entries()) {
      if (users.length > 1) {
        conflicts.push({
          pinNumber,
          conflictingSensors: users,
          reason: `Multiple hardware devices are assigned to GPIO ${pinNumber}: ${users.join(', ')}.`,
        });
      }
    }

    // Power check
    if (basePowerMa > 480) {
      issues.push({
        severity: 'WARNING',
        code: 'HIGH_CURRENT_DRAW',
        message: `Estimated peak current draw is ${basePowerMa} mA. Standard USB 2.0 ports (500mA limit) may experience brown-out resets.`,
        suggestedAction: 'Recommend powering via 5V/2A external adapter or dedicated terminal block power supply.',
      });
    }

    const hasErrors =
      conflicts.length > 0 ||
      issues.some((issue) => issue.severity === 'ERROR');

    return {
      valid: !hasErrors,
      conflicts,
      issues,
      totalPowerEstMa: basePowerMa,
      requiredInterfaces: Array.from(requiredInterfaces),
    };
  }

  /**
   * Create a new deployment within an organization.
   */
  static async createDeployment(
    organizationId: string,
    userId: string,
    dto: CreateDeploymentDTO
  ): Promise<Deployment> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const facilityObjId = new mongoose.Types.ObjectId(dto.facilityId);

    // Verify facility
    const facility = await FacilityModel.findOne({
      _id: facilityObjId,
      organizationId: orgObjId,
    });
    if (!facility) {
      throw new Error('Facility not found or does not belong to this organization.');
    }

    let roomName: string | undefined;
    let roomObjId: mongoose.Types.ObjectId | undefined;
    if (dto.roomId) {
      roomObjId = new mongoose.Types.ObjectId(dto.roomId);
      const room = await RoomModel.findOne({
        _id: roomObjId,
        facilityId: facilityObjId,
        organizationId: orgObjId,
      });
      if (!room) {
        throw new Error('Room not found or does not belong to the selected facility.');
      }
      roomName = room.name;
    }

    // Run hardware validation
    const validation = this.validateHardwareConfig(dto.hardwareConfig);
    if (!validation.valid) {
      const errorDetails = validation.conflicts
        .map((c) => c.reason)
        .concat(
          validation.issues
            .filter((i) => i.severity === 'ERROR')
            .map((i) => i.message)
        )
        .join('; ');
      throw new Error(`Hardware configuration validation failed: ${errorDetails}`);
    }

    const deployment = new DeploymentModel({
      organizationId: orgObjId,
      facilityId: facilityObjId,
      facilityName: facility.name,
      roomId: roomObjId,
      roomName,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      industry: dto.industry,
      useCaseId: dto.useCaseId,
      useCaseName: dto.useCaseName,
      status: 'CONFIGURED',
      hardwareConfig: dto.hardwareConfig,
      isReadinessApproved: false,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await deployment.save();
    return deployment.toSafeDeployment();
  }

  /**
   * Retrieve list of deployments with filtering and pagination.
   */
  static async getDeployments(
    organizationId: string,
    filter: {
      industry?: string;
      status?: DeploymentStatus;
      facilityId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ deployments: Deployment[]; total: number }> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const query: Record<string, unknown> = { organizationId: orgObjId };

    if (filter.industry) {
      query.industry = filter.industry;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.facilityId) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: regex }, { useCaseName: regex }, { deviceId: regex }];
    }

    const limit = Math.min(Math.max(filter.limit || 50, 1), 100);
    const offset = Math.max(filter.offset || 0, 0);

    const [docs, total] = await Promise.all([
      DeploymentModel.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      DeploymentModel.countDocuments(query).exec(),
    ]);

    return {
      deployments: docs.map((doc) => doc.toSafeDeployment()),
      total,
    };
  }

  /**
   * Get single deployment by ID.
   */
  static async getDeploymentById(
    organizationId: string,
    deploymentId: string
  ): Promise<Deployment> {
    const doc = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).exec();

    if (!doc) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    return doc.toSafeDeployment();
  }

  /**
   * Update deployment configuration.
   */
  static async updateDeployment(
    organizationId: string,
    deploymentId: string,
    dto: UpdateDeploymentDTO
  ): Promise<Deployment> {
    const doc = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    if (dto.name) doc.name = dto.name.trim();
    if (dto.description !== undefined) doc.description = dto.description?.trim();
    if (dto.status) doc.status = dto.status;

    if (dto.facilityId) {
      const facility = await FacilityModel.findOne({
        _id: new mongoose.Types.ObjectId(dto.facilityId),
        organizationId: doc.organizationId,
      });
      if (!facility) throw new Error('Facility not found.');
      doc.facilityId = facility._id as mongoose.Types.ObjectId;
      doc.facilityName = facility.name;
    }

    if (dto.roomId !== undefined) {
      if (dto.roomId) {
        const room = await RoomModel.findOne({
          _id: new mongoose.Types.ObjectId(dto.roomId),
          facilityId: doc.facilityId,
          organizationId: doc.organizationId,
        });
        if (!room) throw new Error('Room not found.');
        doc.roomId = room._id as mongoose.Types.ObjectId;
        doc.roomName = room.name;
      } else {
        doc.roomId = undefined;
        doc.roomName = undefined;
      }
    }

    if (dto.hardwareConfig) {
      const validation = this.validateHardwareConfig(dto.hardwareConfig);
      if (!validation.valid) {
        throw new Error('Hardware configuration contains invalid pin assignments or conflicts.');
      }
      doc.hardwareConfig = dto.hardwareConfig;
    }

    await doc.save();
    return doc.toSafeDeployment();
  }

  /**
   * Delete deployment.
   */
  static async deleteDeployment(
    organizationId: string,
    deploymentId: string
  ): Promise<{ success: boolean }> {
    const result = await DeploymentModel.deleteOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (result.deletedCount === 0) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    return { success: true };
  }

  /**
   * Update deployment status.
   */
  static async updateStatus(
    organizationId: string,
    deploymentId: string,
    status: DeploymentStatus
  ): Promise<Deployment> {
    const doc = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) throw new Error('Deployment not found.');
    doc.status = status;
    await doc.save();
    return doc.toSafeDeployment();
  }

  /**
   * Provision hardware device for deployment with generated credentials and sensor catalog entries.
   */
  static async provisionDevice(
    organizationId: string,
    deploymentId: string,
    userId: string
  ): Promise<{
    deployment: Deployment;
    device: Device;
    credentials: DeviceRegistrationCredentials;
  }> {
    const deploymentDoc = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!deploymentDoc) {
      throw new Error(`Deployment ${deploymentId} not found.`);
    }

    // Determine deviceId
    const indCode = deploymentDoc.industry.substring(0, 4).toUpperCase();
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const generatedDeviceId = `ESP32-${indCode}-${randSuffix}`;
    const generatedMac = `24:6F:28:${crypto.randomBytes(3).toString('hex').toUpperCase().match(/.{1,2}/g)?.join(':') || '11:22:33'}`;

    // Register via DeviceService
    const regResult = await DeviceService.registerDevice(
      organizationId,
      {
        deviceId: generatedDeviceId,
        facilityId: deploymentDoc.facilityId.toString(),
        roomId: deploymentDoc.roomId?.toString(),
        name: `${deploymentDoc.name} Node`,
        macAddress: generatedMac,
        chipModel: deploymentDoc.hardwareConfig.chipModel || 'ESP32-WROOM-32D',
        hardwareVersion: 'v3.2',
        firmwareVersion: deploymentDoc.latestFirmwareVersion || 'v1.0.0',
        powerSource: deploymentDoc.hardwareConfig.powerSource || 'MAINS',
      },
      userId
    );

    // Register each sensor configured in hardwareConfig
    for (const sensorConfig of deploymentDoc.hardwareConfig.sensors) {
      try {
        const sensorDoc = new SensorModel({
          deviceId: generatedDeviceId,
          name: `${sensorConfig.sensorType} (${sensorConfig.model})`,
          organizationId: deploymentDoc.organizationId,
          facilityId: deploymentDoc.facilityId,
          roomId: deploymentDoc.roomId,
          sensorType: sensorConfig.sensorType,
          model: sensorConfig.model,
          manufacturer: sensorConfig.manufacturer || 'Sensirion / Hi-Link / Sentinel',
          category: sensorConfig.category,
          interfaceType: sensorConfig.interfaceType,
          assignedPins: sensorConfig.assignedPins,
          samplingIntervalMs: sensorConfig.samplingIntervalMs || 5000,
          status: 'UNPROVISIONED',
          isMandatory: sensorConfig.isMandatory,
          unit: 'units',
          calibration: {
            zeroOffset: 0,
            scaleFactor: 1.0,
            lastCalibratedAt: new Date(),
          },
        });
        await sensorDoc.save();
      } catch (err) {
        // If sensor duplicate or warning, continue gracefully
        console.warn('Sensor initialization warning during provisioning:', err);
      }
    }

    // Update deployment record
    deploymentDoc.deviceId = generatedDeviceId;
    deploymentDoc.status = 'PROVISIONING';
    await deploymentDoc.save();

    return {
      deployment: deploymentDoc.toSafeDeployment(),
      device: regResult.device,
      credentials: regResult.credentials,
    };
  }

  /**
   * Final production sign-off for deployment.
   */
  static async approveReadiness(
    organizationId: string,
    deploymentId: string,
    _approvedByUserId: string
  ): Promise<Deployment> {
    const doc = await DeploymentModel.findOne({
      _id: new mongoose.Types.ObjectId(deploymentId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) throw new Error('Deployment not found.');

    doc.isReadinessApproved = true;
    doc.status = 'ACTIVE';

    // If device exists, update device status to ONLINE / ACTIVE
    if (doc.deviceId) {
      await DeviceModel.updateOne(
        { deviceId: doc.deviceId, organizationId: doc.organizationId },
        { status: 'ONLINE', lastSeenAt: new Date() }
      );
    }

    await doc.save();
    return doc.toSafeDeployment();
  }
}
