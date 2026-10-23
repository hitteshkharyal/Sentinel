// ─────────────────────────────────────────────
// SENTINEL API — Automation Execution Audit Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  AutomationExecution,
  ExecutedAction,
  EventType,
} from '@sentinel/types';

export interface IAutomationExecutionDocument extends Document {
  automationId: mongoose.Types.ObjectId;
  ruleName?: string;
  eventId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  facilityName?: string;
  roomId?: mongoose.Types.ObjectId;
  roomName?: string;
  triggerEvent: {
    eventType: EventType;
    severity?: string;
    title?: string;
  };
  actions: ExecutedAction[];
  executedAt: Date;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  durationMs?: number;
  toSafeExecution(): AutomationExecution;
}

const ExecutedActionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    simulated: {
      type: Boolean,
      default: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    error: {
      type: String,
    },
    params: {
      type: Schema.Types.Mixed,
    },
    feedback: {
      type: String,
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AutomationExecutionSchema = new Schema<IAutomationExecutionDocument>(
  {
    automationId: {
      type: Schema.Types.ObjectId,
      ref: 'AutomationRule',
      required: true,
      index: true,
    },
    ruleName: {
      type: String,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
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
    triggerEvent: {
      eventType: { type: String, required: true },
      severity: { type: String },
      title: { type: String },
    },
    actions: {
      type: [ExecutedActionSchema],
      required: true,
    },
    executedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

// High performance audit querying indexes
AutomationExecutionSchema.index({ organizationId: 1, executedAt: -1 });
AutomationExecutionSchema.index({ organizationId: 1, automationId: 1, executedAt: -1 });
AutomationExecutionSchema.index({ organizationId: 1, roomId: 1, executedAt: -1 });

AutomationExecutionSchema.methods.toSafeExecution = function (): AutomationExecution {
  return {
    id: this._id.toString(),
    automationId: this.automationId.toString(),
    ruleName: this.ruleName,
    eventId: this.eventId.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId ? this.facilityId.toString() : undefined,
    facilityName: this.facilityName,
    roomId: this.roomId ? this.roomId.toString() : undefined,
    roomName: this.roomName,
    triggerEvent: this.triggerEvent,
    actions: (this.actions || []).map((a: ExecutedAction & { executedAt: Date | string }) => ({
      type: a.type,
      simulated: a.simulated,
      success: a.success,
      error: a.error,
      params: a.params,
      feedback: a.feedback,
      executedAt: a.executedAt ? new Date(a.executedAt).toISOString() : new Date().toISOString(),
    })),
    executedAt: this.executedAt.toISOString(),
    status: this.status,
    durationMs: this.durationMs,
  };
};

export const AutomationExecutionModel = mongoose.model<IAutomationExecutionDocument>(
  'AutomationExecution',
  AutomationExecutionSchema
);
