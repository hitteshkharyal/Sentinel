// ─────────────────────────────────────────────
// SENTINEL API — Device Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Device, DeviceStatus, ChipModel, PowerSource } from '@sentinel/types';

export interface IDeviceDocument extends Document {
  deviceId: string;
  organizationId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  name: string;
  macAddress: string;
  chipModel: ChipModel;
  hardwareVersion: string;
  firmwareVersion: string;
  status: DeviceStatus;
  ipAddress?: string;
  metadata: {
    flashSizeBytes?: number;
    freeHeapBytes?: number;
    wifiRssiDbm?: number;
    cpuFreqMhz?: number;
    powerSource?: PowerSource;
    batteryPercent?: number;
    uptimeSeconds?: number;
    lastResetReason?: string;
    [key: string]: unknown;
  };
  assignedSensorsCount: number;
  lastSeenAt?: Date;
  lastHeartbeatAt?: Date;
  lastError?: string;
  registeredAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeDevice(): Device;
}

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    macAddress: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    chipModel: {
      type: String,
      enum: [
        'ESP32-WROOM-32D',
        'ESP32-WROOM-32U',
        'ESP32-S3-WROOM-1',
        'ESP32-C3-MINI',
        'ESP32-CAM',
        'ESP32-GENERIC',
      ],
      default: 'ESP32-WROOM-32D',
      required: true,
    },
    hardwareVersion: {
      type: String,
      required: true,
      trim: true,
      default: 'v3.2',
    },
    firmwareVersion: {
      type: String,
      required: true,
      trim: true,
      default: 'v1.0.0',
    },
    status: {
      type: String,
      enum: [
        'UNREGISTERED',
        'PROVISIONING',
        'ONLINE',
        'OFFLINE',
        'ERROR',
        'UPDATING',
        'DISABLED',
      ],
      default: 'UNREGISTERED',
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    metadata: {
      flashSizeBytes: { type: Number },
      freeHeapBytes: { type: Number },
      wifiRssiDbm: { type: Number },
      cpuFreqMhz: { type: Number, default: 240 },
      powerSource: {
        type: String,
        enum: ['MAINS', 'BATTERY', 'POE', 'USB'],
        default: 'MAINS',
      },
      batteryPercent: { type: Number, min: 0, max: 100 },
      uptimeSeconds: { type: Number, min: 0 },
      lastResetReason: { type: String },
    },
    assignedSensorsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSeenAt: {
      type: Date,
    },
    lastHeartbeatAt: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes ──
DeviceSchema.index({ organizationId: 1, deviceId: 1 }, { unique: true });
DeviceSchema.index({ organizationId: 1, facilityId: 1, roomId: 1 });
DeviceSchema.index({ organizationId: 1, status: 1 });
DeviceSchema.index({ macAddress: 1 });

DeviceSchema.methods.toSafeDevice = function (this: IDeviceDocument): Device {
  return {
    id: this._id.toString(),
    deviceId: this.deviceId,
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId.toString(),
    roomId: this.roomId ? this.roomId.toString() : undefined,
    name: this.name,
    macAddress: this.macAddress,
    chipModel: this.chipModel,
    hardwareVersion: this.hardwareVersion,
    firmwareVersion: this.firmwareVersion,
    status: this.status,
    ipAddress: this.ipAddress,
    metadata: this.metadata || {},
    assignedSensorsCount: this.assignedSensorsCount || 0,
    lastSeenAt: this.lastSeenAt ? this.lastSeenAt.toISOString() : undefined,
    lastHeartbeatAt: this.lastHeartbeatAt ? this.lastHeartbeatAt.toISOString() : undefined,
    lastError: this.lastError,
    registeredAt: this.registeredAt.toISOString(),
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const DeviceModel = mongoose.model<IDeviceDocument>('Device', DeviceSchema);
