// ─────────────────────────────────────────────
// SENTINEL API — Alert & Incident Lifecycle Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  Alert,
  AlertStatus,
  AlertSeverity,
  AlertHistoryEntry,
} from '@sentinel/types';

export interface IAlertDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  facilityName?: string;
  roomId?: mongoose.Types.ObjectId;
  roomName?: string;
  deviceId?: string;
  eventId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  assignedTo?: mongoose.Types.ObjectId;
  sensorEvidence: Record<string, unknown>;
  recommendedAction?: string;
  escalationLevel: number;
  isEscalated: boolean;
  slaDeadline?: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  history: AlertHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  toSafeAlert(): Alert;
}

const AlertHistoryEntrySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlertDocument>(
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
    facilityName: {
      type: String,
      trim: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    roomName: {
      type: String,
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
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
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
      default: 'WARNING',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 90,
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'ACKNOWLEDGED',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'DISMISSED',
      ],
      default: 'CREATED',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sensorEvidence: {
      type: Schema.Types.Mixed,
      default: {},
    },
    recommendedAction: {
      type: String,
      trim: true,
    },
    escalationLevel: {
      type: Number,
      default: 1,
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    slaDeadline: {
      type: Date,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    history: {
      type: [AlertHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast operational and SLA queries
AlertSchema.index({ organizationId: 1, status: 1 });
AlertSchema.index({ organizationId: 1, severity: 1 });
AlertSchema.index({ organizationId: 1, facilityId: 1, status: 1 });
AlertSchema.index({ organizationId: 1, createdAt: -1 });
AlertSchema.index({ organizationId: 1, isEscalated: 1 });

AlertSchema.methods.toSafeAlert = function (this: IAlertDocument): Alert {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId.toString(),
    facilityName: this.facilityName,
    roomId: this.roomId?.toString(),
    roomName: this.roomName,
    deviceId: this.deviceId,
    eventId: this.eventId?.toString(),
    title: this.title,
    description: this.description,
    severity: this.severity,
    confidence: this.confidence,
    status: this.status,
    assignedTo: this.assignedTo?.toString(),
    sensorEvidence: this.sensorEvidence || {},
    recommendedAction: this.recommendedAction,
    escalationLevel: this.escalationLevel || 0,
    isEscalated: this.isEscalated || false,
    slaDeadline: this.slaDeadline?.toISOString(),
    createdAt: this.createdAt.toISOString(),
    acknowledgedAt: this.acknowledgedAt?.toISOString(),
    resolvedAt: this.resolvedAt?.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
    history: (this.history || []).map((h) => ({
      action: h.action,
      userId: h.userId ? h.userId.toString() : undefined,
      userName: h.userName,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note,
    })),
  };
};

export const AlertModel = mongoose.model<IAlertDocument>('Alert', AlertSchema);
