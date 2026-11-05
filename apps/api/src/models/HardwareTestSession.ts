// ─────────────────────────────────────────────
// SENTINEL API — Hardware Test Session & Scorecard Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { HardwareTestScorecard, HardwareTestReading } from '@sentinel/types';

export interface IHardwareTestSessionDocument extends Document {
  deploymentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  deviceId: string;
  overallResult: 'PASS' | 'FAIL' | 'IN_PROGRESS';
  checks: {
    deviceConnection: 'PASS' | 'FAIL' | 'PENDING';
    mqttConnection: 'PASS' | 'FAIL' | 'PENDING';
    sensorValidation: 'PASS' | 'FAIL' | 'PENDING';
    telemetryReception: 'PASS' | 'FAIL' | 'PENDING';
    eventDetection: 'PASS' | 'FAIL' | 'PENDING';
    automationTrigger: 'PASS' | 'FAIL' | 'PENDING';
    alertDelivery: 'PASS' | 'FAIL' | 'PENDING';
  };
  sensorReadings: HardwareTestReading[];
  readinessSignOff: boolean;
  notes?: string;
  testedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeScorecard(): HardwareTestScorecard;
}

const HardwareTestSessionSchema = new Schema<IHardwareTestSessionDocument>(
  {
    deploymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Deployment',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    overallResult: {
      type: String,
      enum: ['PASS', 'FAIL', 'IN_PROGRESS'],
      default: 'IN_PROGRESS',
      index: true,
    },
    checks: {
      deviceConnection: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      mqttConnection: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      sensorValidation: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      telemetryReception: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      eventDetection: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      automationTrigger: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
      alertDelivery: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
    },
    sensorReadings: {
      type: Schema.Types.Mixed,
      default: [],
    },
    readinessSignOff: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
    },
    testedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

HardwareTestSessionSchema.index({ deploymentId: 1, createdAt: -1 });
HardwareTestSessionSchema.index({ organizationId: 1, overallResult: 1 });

HardwareTestSessionSchema.methods.toSafeScorecard = function (
  this: IHardwareTestSessionDocument
): HardwareTestScorecard {
  return {
    sessionId: this._id.toString(),
    deploymentId: this.deploymentId.toString(),
    deviceId: this.deviceId,
    testedAt: this.createdAt.toISOString(),
    overallResult: this.overallResult,
    checks: this.checks,
    sensorReadings: this.sensorReadings,
    readinessSignOff: this.readinessSignOff,
    notes: this.notes,
  };
};

export const HardwareTestSessionModel = mongoose.model<IHardwareTestSessionDocument>(
  'HardwareTestSession',
  HardwareTestSessionSchema
);

