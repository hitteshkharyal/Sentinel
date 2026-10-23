// ─────────────────────────────────────────────
// SENTINEL API — Event Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { SentinelEvent, EventType, EventStatus } from '@sentinel/types';
import type { AlertSeverity } from '@sentinel/types';

export interface IEventDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  deviceId?: string;
  facilityName?: string;
  roomName?: string;
  deviceName?: string;
  eventType: EventType;
  severity: AlertSeverity;
  confidence: number;
  timestamp: Date;
  title: string;
  description: string;
  recommendation?: string;
  inputSignals: Record<string, unknown>;
  status: EventStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  toSafeEvent(): SentinelEvent;
}

const EventSchema = new Schema<IEventDocument>(
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
      trim: true,
      uppercase: true,
      index: true,
    },
    facilityName: {
      type: String,
      trim: true,
    },
    roomName: {
      type: String,
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'ROOM_OCCUPIED',
        'ROOM_VACANT',
        'HIGH_CO2',
        'HIGH_TEMPERATURE',
        'LOW_TEMPERATURE',
        'ABNORMAL_ACTIVITY',
        'ASSISTANCE_INDICATION',
        'PROLONGED_INACTIVITY',
        'AFTER_HOURS_PRESENCE',
        'OVERCAPACITY',
        'PERSON_LEFT_BEHIND',
        'DEVICE_OFFLINE',
        'SENSOR_ERROR',
        'ENVIRONMENTAL_ANOMALY',
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'LOW', 'MEDIUM', 'WARNING', 'HIGH', 'CRITICAL'],
      default: 'INFO',
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 80,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    recommendation: {
      type: String,
      trim: true,
    },
    inputSignals: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED', 'DISMISSED'],
      default: 'ACTIVE',
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Indexes for Fast Filter, Deduplication & Analytics ──
EventSchema.index({ organizationId: 1, timestamp: -1 });
EventSchema.index({ organizationId: 1, status: 1, timestamp: -1 });
EventSchema.index({ organizationId: 1, severity: 1, timestamp: -1 });
EventSchema.index({ organizationId: 1, facilityId: 1, roomId: 1, status: 1 });
EventSchema.index({ organizationId: 1, roomId: 1, eventType: 1, status: 1 });
EventSchema.index({ eventType: 1, timestamp: -1 });

EventSchema.methods.toSafeEvent = function (this: IEventDocument): SentinelEvent {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId.toString(),
    roomId: this.roomId ? this.roomId.toString() : undefined,
    deviceId: this.deviceId,
    facilityName: this.facilityName,
    roomName: this.roomName,
    deviceName: this.deviceName,
    eventType: this.eventType,
    severity: this.severity,
    confidence: this.confidence,
    timestamp: this.timestamp.toISOString(),
    inputSignals: this.inputSignals || {},
    status: this.status,
    title: this.title,
    description: this.description,
    recommendation: this.recommendation,
    acknowledgedAt: this.acknowledgedAt ? this.acknowledgedAt.toISOString() : undefined,
    acknowledgedBy: this.acknowledgedBy ? this.acknowledgedBy.toString() : undefined,
    resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : undefined,
    resolvedBy: this.resolvedBy ? this.resolvedBy.toString() : undefined,
    resolutionNotes: this.resolutionNotes,
    metadata: this.metadata,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const EventModel = mongoose.model<IEventDocument>('Event', EventSchema);
