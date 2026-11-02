// ─────────────────────────────────────────────
// SENTINEL API — Compliance Profile Model (Day 15)
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  ComplianceProfile,
  ComplianceFramework,
  ComplianceStrictness,
  ComplianceStatus,
} from '@sentinel/types';

export interface IComplianceProfileDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  enabledFrameworks: ComplianceFramework[];
  strictness: ComplianceStrictness;
  autoRemediationEnabled: boolean;
  auditFrequencyHours: number;
  privacyLevel: 'ZERO_VIDEO' | 'AGGREGATED_ONLY' | 'ANONYMIZED';
  lastAuditedAt?: Date;
  overallScore: number;
  overallStatus: ComplianceStatus;
  createdAt: Date;
  updatedAt: Date;
  toSafeProfile(): ComplianceProfile;
}

const ComplianceProfileSchema = new Schema<IComplianceProfileDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    enabledFrameworks: {
      type: [String],
      default: ['ASHRAE_55', 'ASHRAE_62_1', 'WELL_LEED'],
    },
    strictness: {
      type: String,
      enum: ['STRICT', 'BALANCED', 'PERMISSIVE'],
      default: 'BALANCED',
    },
    autoRemediationEnabled: {
      type: Boolean,
      default: true,
    },
    auditFrequencyHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168,
    },
    privacyLevel: {
      type: String,
      enum: ['ZERO_VIDEO', 'AGGREGATED_ONLY', 'ANONYMIZED'],
      default: 'ZERO_VIDEO',
    },
    lastAuditedAt: {
      type: Date,
    },
    overallScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    overallStatus: {
      type: String,
      enum: ['COMPLIANT', 'WARNING', 'NON_COMPLIANT', 'NOT_APPLICABLE'],
      default: 'COMPLIANT',
    },
  },
  {
    timestamps: true,
  }
);

ComplianceProfileSchema.methods.toSafeProfile = function (): ComplianceProfile {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    enabledFrameworks: this.enabledFrameworks,
    strictness: this.strictness,
    autoRemediationEnabled: this.autoRemediationEnabled,
    auditFrequencyHours: this.auditFrequencyHours,
    privacyLevel: this.privacyLevel,
    lastAuditedAt: this.lastAuditedAt ? this.lastAuditedAt.toISOString() : undefined,
    overallScore: this.overallScore,
    overallStatus: this.overallStatus,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const ComplianceProfileModel = mongoose.model<IComplianceProfileDocument>(
  'ComplianceProfile',
  ComplianceProfileSchema
);
