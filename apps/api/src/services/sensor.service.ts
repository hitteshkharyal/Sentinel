// ─────────────────────────────────────────────
// SENTINEL API — Sensor Service & Hardware Catalog
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import { SensorModel } from '../models/Sensor.js';
import { RoomModel } from '../models/Room.js';
import { FacilityModel } from '../models/Facility.js';
import { SENSOR_CATALOG } from './sensor-catalog.data.js';
import { AppError } from '../middleware/error-handler.js';
import type {
  SensorEntity,
  SensorCatalogItem,
  SensorCategory,
  SensorType,
  CreateSensorDTO,
  UpdateSensorDTO,
  ConfigureSensorDTO,
  CalibrateSensorDTO,
  SensorFilterQuery,
} from '@sentinel/types';

export class SensorService {
  // ─────────────────────────────────────────────
  // CATALOG OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Retrieve sensor catalog items with optional filtering
   */
  static getCatalog(category?: SensorCategory, sensorType?: SensorType): SensorCatalogItem[] {
    let items = SENSOR_CATALOG;
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    if (sensorType) {
      items = items.filter((item) => item.sensorType === sensorType);
    }
    return items;
  }

  /**
   * Get single catalog item by ID or sensor type
   */
  static getCatalogItem(idOrType: string): SensorCatalogItem | undefined {
    return SENSOR_CATALOG.find(
      (item) => item.id === idOrType || item.sensorType === idOrType || item.model.toLowerCase() === idOrType.toLowerCase()
    );
  }

  // ─────────────────────────────────────────────
  // SENSOR INSTANCE OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Register a new sensor instance under an organization
   */
  static async createSensor(
    orgId: string,
    userId: string,
    dto: CreateSensorDTO
  ): Promise<SensorEntity> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    let facilityObjectId: mongoose.Types.ObjectId | undefined;
    let roomObjectId: mongoose.Types.ObjectId | undefined;

    // Verify facility belongs to organization if provided
    if (dto.facilityId) {
      const facility = await FacilityModel.findOne({
        _id: new mongoose.Types.ObjectId(dto.facilityId),
        organizationId: orgObjectId,
      });
      if (!facility) {
        throw new AppError(404, 'Facility not found in this organization.');
      }
      facilityObjectId = facility._id as mongoose.Types.ObjectId;
    }

    // Verify room belongs to organization and facility if provided
    if (dto.roomId) {
      const room = await RoomModel.findOne({
        _id: new mongoose.Types.ObjectId(dto.roomId),
        organizationId: orgObjectId,
      });
      if (!room) {
        throw new AppError(404, 'Room not found in this organization.');
      }
      roomObjectId = room._id as mongoose.Types.ObjectId;
      if (!facilityObjectId) {
        facilityObjectId = room.facilityId;
      }
    }

    // Lookup catalog specs to provide intelligent hardware defaults
    const catalogItem = this.getCatalogItem(dto.model || dto.sensorType) || this.getCatalogItem(dto.sensorType);

    const model = dto.model?.trim() || catalogItem?.model || 'Generic Module';
    const manufacturer = dto.manufacturer?.trim() || catalogItem?.manufacturer || 'OEM';
    const category: SensorCategory = catalogItem?.category || 'ENVIRONMENTAL';

    const defaultSamplingInterval = catalogItem?.defaultSamplingIntervalMs ?? 5000;
    const defaultUnit = catalogItem?.unit ?? '';
    const defaultPin = catalogItem?.defaultPin;
    const defaultI2c = catalogItem?.defaultI2cAddress;

    const sensor = await SensorModel.create({
      organizationId: orgObjectId,
      facilityId: facilityObjectId,
      roomId: roomObjectId,
      deviceId: dto.deviceId?.trim(),
      name: dto.name.trim(),
      sensorType: dto.sensorType,
      model,
      manufacturer,
      category,
      interfaceType: dto.interfaceType,
      status: 'ONLINE',
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      configuration: {
        gpioPin: dto.configuration?.gpioPin ?? defaultPin,
        i2cAddress: dto.configuration?.i2cAddress ?? defaultI2c,
        baudRate: dto.configuration?.baudRate ?? catalogItem?.baudRate,
        samplingIntervalMs: dto.configuration?.samplingIntervalMs ?? defaultSamplingInterval,
        unit: dto.configuration?.unit ?? defaultUnit,
        minValue: dto.configuration?.minValue ?? catalogItem?.measurementRange.min,
        maxValue: dto.configuration?.maxValue ?? catalogItem?.measurementRange.max,
        thresholds: dto.configuration?.thresholds ?? [],
        filterWindowSize: dto.configuration?.filterWindowSize ?? 5,
        debounceMs: dto.configuration?.debounceMs ?? 200,
      },
      calibration: {
        offset: dto.calibration?.offset ?? 0,
        multiplier: dto.calibration?.multiplier ?? 1,
        baseline: dto.calibration?.baseline ?? 0,
        noiseFloor: dto.calibration?.noiseFloor,
        calibratedAt: new Date(),
        calibratedBy: new mongoose.Types.ObjectId(userId),
      },
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return sensor.toSafeSensor();
  }

  /**
   * Query organization sensors with filters
   */
  static async getSensors(orgId: string, filter: SensorFilterQuery): Promise<SensorEntity[]> {
    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(orgId),
    };

    if (filter.facilityId) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.roomId) {
      query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    }
    if (filter.deviceId) {
      query.deviceId = filter.deviceId;
    }
    if (filter.sensorType) {
      query.sensorType = filter.sensorType;
    }
    if (filter.interfaceType) {
      query.interfaceType = filter.interfaceType;
    }
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.enabled !== undefined) {
      query.enabled = filter.enabled;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.q) {
      const q = filter.q.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
      ];
    }

    const sensors = await SensorModel.find(query).sort({ createdAt: -1 });
    return sensors.map((s) => s.toSafeSensor());
  }

  /**
   * Get single sensor by ID
   */
  static async getSensorById(orgId: string, sensorId: string): Promise<SensorEntity> {
    const sensor = await SensorModel.findOne({
      _id: new mongoose.Types.ObjectId(sensorId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!sensor) {
      throw new AppError(404, 'Sensor not found.');
    }

    return sensor.toSafeSensor();
  }

  /**
   * Update sensor metadata
   */
  static async updateSensor(
    orgId: string,
    sensorId: string,
    dto: UpdateSensorDTO
  ): Promise<SensorEntity> {
    const sensor = await SensorModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(sensorId),
        organizationId: new mongoose.Types.ObjectId(orgId),
      },
      {
        $set: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.facilityId !== undefined && {
            facilityId: dto.facilityId ? new mongoose.Types.ObjectId(dto.facilityId) : null,
          }),
          ...(dto.roomId !== undefined && {
            roomId: dto.roomId ? new mongoose.Types.ObjectId(dto.roomId) : null,
          }),
          ...(dto.deviceId !== undefined && { deviceId: dto.deviceId.trim() }),
          ...(dto.enabled !== undefined && { enabled: dto.enabled }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      },
      { new: true }
    );

    if (!sensor) {
      throw new AppError(404, 'Sensor not found.');
    }

    return sensor.toSafeSensor();
  }

  /**
   * Configure sensor hardware parameters (pins, I2C address, intervals, thresholds)
   */
  static async configureSensor(
    orgId: string,
    sensorId: string,
    dto: ConfigureSensorDTO
  ): Promise<SensorEntity> {
    const sensor = await SensorModel.findOne({
      _id: new mongoose.Types.ObjectId(sensorId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!sensor) {
      throw new AppError(404, 'Sensor not found.');
    }

    if (dto.gpioPin !== undefined) sensor.configuration.gpioPin = dto.gpioPin;
    if (dto.i2cAddress !== undefined) sensor.configuration.i2cAddress = dto.i2cAddress.trim();
    if (dto.baudRate !== undefined) sensor.configuration.baudRate = dto.baudRate;
    if (dto.samplingIntervalMs !== undefined)
      sensor.configuration.samplingIntervalMs = dto.samplingIntervalMs;
    if (dto.unit !== undefined) sensor.configuration.unit = dto.unit.trim();
    if (dto.minValue !== undefined) sensor.configuration.minValue = dto.minValue;
    if (dto.maxValue !== undefined) sensor.configuration.maxValue = dto.maxValue;
    if (dto.thresholds !== undefined) sensor.configuration.thresholds = dto.thresholds;
    if (dto.filterWindowSize !== undefined)
      sensor.configuration.filterWindowSize = dto.filterWindowSize;
    if (dto.debounceMs !== undefined) sensor.configuration.debounceMs = dto.debounceMs;

    await sensor.save();
    return sensor.toSafeSensor();
  }

  /**
   * Calibrate sensor hardware offsets & baselines
   */
  static async calibrateSensor(
    orgId: string,
    sensorId: string,
    userId: string,
    dto: CalibrateSensorDTO
  ): Promise<SensorEntity> {
    const sensor = await SensorModel.findOne({
      _id: new mongoose.Types.ObjectId(sensorId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!sensor) {
      throw new AppError(404, 'Sensor not found.');
    }

    if (dto.offset !== undefined) sensor.calibration.offset = dto.offset;
    if (dto.multiplier !== undefined) sensor.calibration.multiplier = dto.multiplier;
    if (dto.baseline !== undefined) sensor.calibration.baseline = dto.baseline;
    if (dto.noiseFloor !== undefined) sensor.calibration.noiseFloor = dto.noiseFloor;

    sensor.calibration.calibratedAt = new Date();
    sensor.calibration.calibratedBy = new mongoose.Types.ObjectId(userId);
    sensor.status = 'ONLINE';

    await sensor.save();
    return sensor.toSafeSensor();
  }

  /**
   * Delete sensor instance
   */
  static async deleteSensor(orgId: string, sensorId: string): Promise<void> {
    const result = await SensorModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(sensorId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!result) {
      throw new AppError(404, 'Sensor not found.');
    }
  }

  /**
   * Seed default representative sensor suites for seeded rooms
   */
  static async seedDefaultSensorsForRoom(
    orgId: string,
    facilityId: string,
    roomId: string,
    roomType: string
  ): Promise<void> {
    const existing = await SensorModel.countDocuments({ roomId: new mongoose.Types.ObjectId(roomId) });
    if (existing > 0) return;

    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const facilityObjectId = new mongoose.Types.ObjectId(facilityId);
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    const sensorsToSeed: Array<{
      name: string;
      sensorType: SensorType;
      model: string;
      manufacturer: string;
      category: SensorCategory;
      interfaceType: 'GPIO' | 'ADC' | 'I2C' | 'UART' | 'SPI';
      configuration: Record<string, unknown>;
      lastReading: { value: number | string | boolean | Record<string, unknown>; unit: string; timestamp: string; confidence?: number };
    }> = [];

    switch (roomType) {
      case 'hospital_room': {
        sensorsToSeed.push(
          {
            name: 'Inpatient mmWave Radar Suite',
            sensorType: 'MMWAVE',
            model: 'LD2410C',
            manufacturer: 'Hi-Link',
            category: 'PRESENCE_MOTION',
            interfaceType: 'UART',
            configuration: { baudRate: 256000, gpioPin: 18, samplingIntervalMs: 1000, unit: 'presence' },
            lastReading: { value: { presence: true, count: 1, posture: 'stationary_floor' }, unit: 'status', timestamp: new Date().toISOString(), confidence: 96 },
          },
          {
            name: 'Acoustic Shock & Spike Detector',
            sensorType: 'SOUND_LEVEL',
            model: 'MAX9814',
            manufacturer: 'Maxim Integrated',
            category: 'ENVIRONMENTAL',
            interfaceType: 'ADC',
            configuration: { gpioPin: 34, samplingIntervalMs: 250, unit: 'dB' },
            lastReading: { value: 68.4, unit: 'dB', timestamp: new Date().toISOString() },
          },
          {
            name: 'Indoor NDIR CO2 Monitor',
            sensorType: 'CO2',
            model: 'SCD40',
            manufacturer: 'Sensirion',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            configuration: { i2cAddress: '0x62', samplingIntervalMs: 5000, unit: 'ppm' },
            lastReading: { value: 540, unit: 'ppm', timestamp: new Date().toISOString() },
          },
          {
            name: 'Precision Temperature & Humidity',
            sensorType: 'TEMPERATURE',
            model: 'SHT31-DIS',
            manufacturer: 'Sensirion',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            configuration: { i2cAddress: '0x44', samplingIntervalMs: 5000, unit: '°C' },
            lastReading: { value: 21.8, unit: '°C', timestamp: new Date().toISOString() },
          }
        );
        break;
      }

      case 'bus': {
        sensorsToSeed.push(
          {
            name: 'Child-Left-Behind mmWave Radar Array',
            sensorType: 'MMWAVE',
            model: 'LD2410C',
            manufacturer: 'Hi-Link',
            category: 'PRESENCE_MOTION',
            interfaceType: 'UART',
            configuration: { baudRate: 256000, gpioPin: 18, samplingIntervalMs: 500, unit: 'presence' },
            lastReading: { value: { presence: false, count: 0 }, unit: 'targets', timestamp: new Date().toISOString(), confidence: 99 },
          },
          {
            name: 'Transit Fleet GNSS Positioning Engine',
            sensorType: 'GPS',
            model: 'NEO-6M',
            manufacturer: 'u-blox',
            category: 'ACCESS_TELEMETRY',
            interfaceType: 'UART',
            configuration: { baudRate: 9600, gpioPin: 16, samplingIntervalMs: 2000, unit: 'coords' },
            lastReading: { value: { lat: 40.7128, lng: -74.006, speedKmh: 42.5 }, unit: 'coords', timestamp: new Date().toISOString() },
          },
          {
            name: 'Passenger Entry Door Reed Switch',
            sensorType: 'DOOR_MAGNETIC',
            model: 'DC-1561',
            manufacturer: 'Aleph',
            category: 'ACCESS_TELEMETRY',
            interfaceType: 'GPIO',
            configuration: { gpioPin: 19, samplingIntervalMs: 200, unit: 'state' },
            lastReading: { value: 'closed', unit: 'state', timestamp: new Date().toISOString() },
          }
        );
        break;
      }

      case 'classroom': {
        sensorsToSeed.push(
          {
            name: 'Classroom NDIR CO2 & Air Health',
            sensorType: 'CO2',
            model: 'SCD40',
            manufacturer: 'Sensirion',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            configuration: { i2cAddress: '0x62', samplingIntervalMs: 5000, unit: 'ppm' },
            lastReading: { value: 720, unit: 'ppm', timestamp: new Date().toISOString() },
          },
          {
            name: 'STEM Science Multi-Gas Detector',
            sensorType: 'GAS',
            model: 'MQ-135',
            manufacturer: 'Winsen Electronics',
            category: 'SAFETY_HAZARD',
            interfaceType: 'ADC',
            configuration: { gpioPin: 32, samplingIntervalMs: 2000, unit: 'ppm_voc' },
            lastReading: { value: 45, unit: 'ppm_voc', timestamp: new Date().toISOString() },
          },
          {
            name: 'Daylight Harvesting Ambient Lux',
            sensorType: 'LIGHT',
            model: 'BH1750FVI',
            manufacturer: 'ROHM Semiconductor',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            configuration: { i2cAddress: '0x23', samplingIntervalMs: 3000, unit: 'lux' },
            lastReading: { value: 480, unit: 'lux', timestamp: new Date().toISOString() },
          }
        );
        break;
      }

      default: {
        sensorsToSeed.push(
          {
            name: 'Presence mmWave Sensor',
            sensorType: 'MMWAVE',
            model: 'LD2410C',
            manufacturer: 'Hi-Link',
            category: 'PRESENCE_MOTION',
            interfaceType: 'UART',
            configuration: { baudRate: 256000, gpioPin: 18, samplingIntervalMs: 1000, unit: 'presence' },
            lastReading: { value: { presence: true, count: 1 }, unit: 'presence', timestamp: new Date().toISOString(), confidence: 95 },
          },
          {
            name: 'Environmental Climate Node',
            sensorType: 'TEMPERATURE',
            model: 'SHT31-DIS',
            manufacturer: 'Sensirion',
            category: 'ENVIRONMENTAL',
            interfaceType: 'I2C',
            configuration: { i2cAddress: '0x44', samplingIntervalMs: 5000, unit: '°C' },
            lastReading: { value: 22.0, unit: '°C', timestamp: new Date().toISOString() },
          }
        );
      }
    }

    for (const s of sensorsToSeed) {
      await SensorModel.create({
        organizationId: orgObjectId,
        facilityId: facilityObjectId,
        roomId: roomObjectId,
        name: s.name,
        sensorType: s.sensorType,
        model: s.model,
        manufacturer: s.manufacturer,
        category: s.category,
        interfaceType: s.interfaceType,
        status: 'ONLINE',
        enabled: true,
        configuration: s.configuration,
        calibration: { offset: 0, multiplier: 1, baseline: 0 },
        lastReading: s.lastReading,
      });
    }
  }
}
