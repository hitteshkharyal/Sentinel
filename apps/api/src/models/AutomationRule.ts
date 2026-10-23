// ─────────────────────────────────────────────
// SENTINEL API — Automation Rule Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  AutomationRule,
  AutomationCondition,
  AutomationAction,
  EventType,
} from '@sentinel/types';

export interface IAutomationRuleDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  facilityName?: string;
  roomId?: mongoose.Types.ObjectId;
  roomName?: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerEventType: EventType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMs: number;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeRule(): AutomationRule;
}

const AutomationConditionSchema = new Schema(
  {
    field: { type: String, required: true, trim: true },
    operator: {
      type: String,
      required: true,
      enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in'],
    },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const AutomationActionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'HVAC_ECO',
        'HVAC_COMFORT',
        'LIGHT_ON',
        'LIGHT_OFF',
        'VENTILATION_INCREASE',
        'VENTILATION_NORMAL',
        'CREATE_ALERT',
        'SEND_NOTIFICATION',
        'ESCALATE_ALERT',
        'BUZZER',
        'RELAY',
      ],
    },
    params: { type: Schema.Types.Mixed, default: {} },
    simulated: { type: Boolean, default: true },
    targetDeviceId: { type: String, trim: true },
  },
  { _id: false }
);

const AutomationRuleSchema = new Schema<IAutomationRuleDocument>(
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    triggerEventType: {
      type: String,
      required: true,
      index: true,
    },
    conditions: {
      type: [AutomationConditionSchema],
      default: [],
    },
    actions: {
      type: [AutomationActionSchema],
      required: true,
      validate: [(val: AutomationAction[]) => val.length > 0, 'At least one action is required.'],
    },
    cooldownMs: {
      type: Number,
      default: 60000,
      min: 0,
      max: 86400000,
    },
    lastExecutedAt: {
      type: Date,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid matching during real-time event ingestion
AutomationRuleSchema.index({ organizationId: 1, enabled: 1, triggerEventType: 1 });
AutomationRuleSchema.index({ organizationId: 1, facilityId: 1, enabled: 1 });
AutomationRuleSchema.index({ organizationId: 1, roomId: 1, enabled: 1 });

AutomationRuleSchema.methods.toSafeRule = function (): AutomationRule {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId ? this.facilityId.toString() : undefined,
    facilityName: this.facilityName,
    roomId: this.roomId ? this.roomId.toString() : undefined,
    roomName: this.roomName,
    name: this.name,
    description: this.description,
    enabled: this.enabled,
    triggerEventType: this.triggerEventType,
    conditions: this.conditions || [],
    actions: this.actions || [],
    cooldownMs: this.cooldownMs,
    lastExecutedAt: this.lastExecutedAt ? this.lastExecutedAt.toISOString() : undefined,
    executionCount: this.executionCount || 0,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const AutomationRuleModel = mongoose.model<IAutomationRuleDocument>(
  'AutomationRule',
  AutomationRuleSchema
);
