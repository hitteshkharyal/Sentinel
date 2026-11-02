// ─────────────────────────────────────────────
// SENTINEL API — Security Audit Log Model (Day 16)
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  SecurityAction,
  SecuritySeverity,
  SecurityActorType,
  SecurityEventStatus,
  SecurityAuditLog,
} from '@sentinel/types';

export interface ISecurityAuditLogDocument extends Document {
  organizationId?: mongoose.Types.ObjectId;
  action: SecurityAction;
  severity: SecuritySeverity;
  actorType: SecurityActorType;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  status: SecurityEventStatus;
  details: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  toSafeAuditLog(): SecurityAuditLog;
}

const SecurityAuditLogSchema = new Schema<ISecurityAuditLogDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: false,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'AUTH_SUCCESS',
        'AUTH_FAILURE',
        'AUTH_LOCKOUT',
        'TOKEN_ROTATED',
        'TOKEN_REVOKED',
        'TOKEN_REUSE_DETECTED',
        'ROGUE_DEVICE_BLOCKED',
        'DEVICE_CREDENTIAL_ROTATED',
        'CROSS_TENANT_ACCESS_DENIED',
        'UNAUTHORIZED_SUBSCRIBE_ATTEMPT',
        'UNAUTHORIZED_PUBLISH_ATTEMPT',
        'RATE_LIMIT_EXCEEDED',
        'SUSPICIOUS_PAYLOAD_BLOCKED',
        'SECURITY_SCAN_EXECUTED',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'INFO',
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['USER', 'DEVICE', 'SYSTEM', 'ANONYMOUS'],
      default: 'ANONYMOUS',
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      trim: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    resource: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'BLOCKED', 'FLAGGED'],
      default: 'SUCCESS',
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput security queries
SecurityAuditLogSchema.index({ organizationId: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ action: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ severity: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ status: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ createdAt: -1 });

SecurityAuditLogSchema.methods.toSafeAuditLog = function (
  this: ISecurityAuditLogDocument
): SecurityAuditLog {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId ? this.organizationId.toString() : undefined,
    action: this.action,
    severity: this.severity,
    actorType: this.actorType,
    actorId: this.actorId,
    actorEmail: this.actorEmail,
    ipAddress: this.ipAddress,
    userAgent: this.userAgent,
    resource: this.resource,
    status: this.status,
    details: this.details || {},
    timestamp: this.createdAt.toISOString(),
  };
};

export const SecurityAuditLogModel = mongoose.model<ISecurityAuditLogDocument>(
  'SecurityAuditLog',
  SecurityAuditLogSchema
);

