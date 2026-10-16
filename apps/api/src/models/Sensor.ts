// ─────────────────────────────────────────────
// SENTINEL API — Sensor Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  SensorEntity,
  SensorType,
  SensorInterface,
  SensorStatus,
  SensorCategory,
  SensorDetailedConfig,
  SensorReading,
} from '@sentinel/types';

export interface ISensorDocument extends Omit<Document, 'model'> {
  organizationId: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  deviceId?: string;
  name: string;
  sensorType: SensorType;
  model: string;
  manufacturer: string;
  category: SensorCategory;
  interfaceType: SensorInterface;
  status: SensorStatus;
  enabled: boolean;
  configuration: SensorDetailedConfig;
  calibration: {
    offset: number;
    multiplier: number;
    baseline: number;
    noiseFloor?: number;
    calibratedAt?: Date;
    calibratedBy?: mongoose.Types.ObjectId;
  };
  lastReading?: SensorReading;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeSensor(): SensorEntity;
}

const SensorThresholdSchema = new Schema(
  {
    name: { type: String, required: true },
    operator: {
      type: String,
      enum: ['gt', 'gte', 'lt', 'lte', 'eq'],
      required: true,
    },
    value: { type: Number, required: true },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
      required: true,
    },
  },
  { _id: false }
);

const SensorDetailedConfigSchema = new Schema(
  {
    gpioPin: { type: Number, min: 0, max: 48 },
    i2cAddress: { type: String, trim: true },
    baudRate: { type: Number },
    samplingIntervalMs: { type: Number, default: 5000, min: 50, max: 86400000 },
    unit: { type: String, trim: true },
    minValue: { type: Number },
    maxValue: { type: Number },
    thresholds: [SensorThresholdSchema],
    filterWindowSize: { type: Number, min: 1, max: 100 },
    debounceMs: { type: Number, min: 0, max: 60000 },
  },
  { _id: false }
);

const SensorCalibrationSchema = new Schema(
  {
    offset: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1 },
    baseline: { type: Number, default: 0 },
    noiseFloor: { type: Number },
    calibratedAt: { type: Date },
    calibratedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const SensorReadingSchema = new Schema(
  {
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true },
    timestamp: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const SensorSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    deviceId: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    sensorType: {
      type: String,
      required: true,
      enum: [
        'PIR',
        'MMWAVE',
        'CO2',
        'TEMPERATURE',
        'HUMIDITY',
        'SOUND_LEVEL',
        'DOOR_MAGNETIC',
        'PRESSURE',
        'LIGHT',
        'SMOKE',
        'GAS',
        'FLAME',
        'WATER_LEAK',
        'VIBRATION',
        'ULTRASONIC',
        'CURRENT',
        'GPS',
        'RFID',
      ],
      index: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'PRESENCE_MOTION',
        'ENVIRONMENTAL',
        'SAFETY_HAZARD',
        'STRUCTURAL_POWER',
        'ACCESS_TELEMETRY',
      ],
      index: true,
    },
    interfaceType: {
      type: String,
      required: true,
      enum: ['GPIO', 'ADC', 'PWM', 'I2C', 'SPI', 'UART', 'WIFI', 'MQTT'],
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'CALIBRATING', 'ERROR', 'UNPROVISIONED'],
      default: 'UNPROVISIONED',
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    configuration: {
      type: SensorDetailedConfigSchema,
      default: () => ({ samplingIntervalMs: 5000 }),
    },
    calibration: {
      type: SensorCalibrationSchema,
      default: () => ({ offset: 0, multiplier: 1, baseline: 0 }),
    },
    lastReading: {
      type: SensorReadingSchema,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for multi-tenant querying & performance
SensorSchema.index({ organizationId: 1, sensorType: 1 });
SensorSchema.index({ organizationId: 1, facilityId: 1, roomId: 1 });
SensorSchema.index({ organizationId: 1, enabled: 1, status: 1 });
SensorSchema.index({ name: 'text', model: 'text', manufacturer: 'text' });

SensorSchema.methods.toSafeSensor = function (this: ISensorDocument): SensorEntity {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId ? this.facilityId.toString() : undefined,
    roomId: this.roomId ? this.roomId.toString() : undefined,
    deviceId: this.deviceId,
    name: this.name,
    sensorType: this.sensorType,
    model: String(this.model),
    manufacturer: this.manufacturer,
    category: this.category,
    interfaceType: this.interfaceType,
    status: this.status,
    enabled: this.enabled,
    configuration: {
      gpioPin: this.configuration?.gpioPin,
      i2cAddress: this.configuration?.i2cAddress,
      baudRate: this.configuration?.baudRate,
      samplingIntervalMs: this.configuration?.samplingIntervalMs ?? 5000,
      unit: this.configuration?.unit,
      minValue: this.configuration?.minValue,
      maxValue: this.configuration?.maxValue,
      thresholds: this.configuration?.thresholds,
      filterWindowSize: this.configuration?.filterWindowSize,
      debounceMs: this.configuration?.debounceMs,
    },
    calibration: {
      offset: this.calibration?.offset ?? 0,
      multiplier: this.calibration?.multiplier ?? 1,
      baseline: this.calibration?.baseline ?? 0,
      noiseFloor: this.calibration?.noiseFloor,
      calibratedAt:
        this.calibration?.calibratedAt instanceof Date
          ? this.calibration.calibratedAt.toISOString()
          : this.calibration?.calibratedAt
          ? String(this.calibration.calibratedAt)
          : undefined,
      calibratedBy: this.calibration?.calibratedBy?.toString(),
    },
    lastReading: this.lastReading
      ? {
          value: this.lastReading.value,
          unit: this.lastReading.unit,
          timestamp: this.lastReading.timestamp,
          confidence: this.lastReading.confidence,
        }
      : undefined,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const SensorModel = mongoose.model<ISensorDocument>('Sensor', SensorSchema);
