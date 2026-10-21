// ─────────────────────────────────────────────
// SENTINEL API — Telemetry Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { TelemetryEntity, TelemetrySensorData, TelemetryDeviceMetadata } from '@sentinel/types';

export interface ITelemetryDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  deviceId: string;
  timestamp: Date;
  receivedAt: Date;
  sensors: TelemetrySensorData;
  valid: boolean;
  validationErrors?: string[];
  metadata?: TelemetryDeviceMetadata;
  createdAt: Date;
  updatedAt: Date;
  toSafeTelemetry(): TelemetryEntity;
}

const TelemetrySchema = new Schema<ITelemetryDocument>(
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
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sensors: {
      type: Schema.Types.Mixed,
      required: true,
    },
    valid: {
      type: Boolean,
      default: true,
      index: true,
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes for High-Throughput Spatial Time-Series Queries ──
TelemetrySchema.index({ organizationId: 1, timestamp: -1 });
TelemetrySchema.index({ organizationId: 1, facilityId: 1, roomId: 1, timestamp: -1 });
TelemetrySchema.index({ organizationId: 1, deviceId: 1, timestamp: -1 });
TelemetrySchema.index({ deviceId: 1, timestamp: -1 });

TelemetrySchema.methods.toSafeTelemetry = function (
  this: ITelemetryDocument
): TelemetryEntity {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId.toString(),
    roomId: this.roomId ? this.roomId.toString() : undefined,
    deviceId: this.deviceId,
    timestamp: this.timestamp.toISOString(),
    receivedAt: this.receivedAt.toISOString(),
    sensors: this.sensors || {},
    valid: this.valid,
    validationErrors: this.validationErrors && this.validationErrors.length > 0 ? this.validationErrors : undefined,
    metadata: this.metadata,
    createdAt: this.createdAt.toISOString(),
  };
};

export const TelemetryModel = mongoose.model<ITelemetryDocument>(
  'Telemetry',
  TelemetrySchema
);
