// ─────────────────────────────────────────────
// SENTINEL API — Compliance Audit Log Model (Day 15)
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  ComplianceAuditResult,
  ComplianceStatus,
  FrameworkScore,
  ComplianceViolation,
} from '@sentinel/types';

export interface IComplianceAuditLogDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  auditedAt: Date;
  overallScore: number;
  overallStatus: ComplianceStatus;
  frameworkScores: FrameworkScore[];
  violations: ComplianceViolation[];
  recommendations: string[];
  stats: {
    evaluatedRooms: number;
    activeRules: number;
    activeDevices: number;
    openViolations: number;
  };
  createdAt: Date;
  toSafeResult(): ComplianceAuditResult;
}

const ComplianceAuditLogSchema = new Schema<IComplianceAuditLogDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    auditedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overallStatus: {
      type: String,
      enum: ['COMPLIANT', 'WARNING', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
      required: true,
    },
    frameworkScores: {
      type: Schema.Types.Mixed,
      required: true,
    },
    violations: {
      type: Schema.Types.Mixed,
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    stats: {
      evaluatedRooms: { type: Number, default: 0 },
      activeRules: { type: Number, default: 0 },
      activeDevices: { type: Number, default: 0 },
      openViolations: { type: Number, default: 0 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ComplianceAuditLogSchema.methods.toSafeResult = function (): ComplianceAuditResult {
  return {
    organizationId: this.organizationId.toString(),
    auditedAt: this.auditedAt.toISOString(),
    overallScore: this.overallScore,
    overallStatus: this.overallStatus,
    frameworkScores: this.frameworkScores,
    violations: this.violations,
    recommendations: this.recommendations,
    stats: this.stats,
  };
};

export const ComplianceAuditLogModel = mongoose.model<IComplianceAuditLogDocument>(
  'ComplianceAuditLog',
  ComplianceAuditLogSchema
);
