// ─────────────────────────────────────────────
// SENTINEL API — Device Credential Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'node:crypto';
import type { CredentialType, CredentialStatus, DeviceCredential } from '@sentinel/types';

export interface IDeviceCredentialDocument extends Document {
  deviceId: string;
  organizationId: mongoose.Types.ObjectId;
  credentialType: CredentialType;
  keyPrefix: string;
  hashedSecret: string;
  status: CredentialStatus;
  lastRotatedAt: Date;
  expiresAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  verifySecret(plainSecret: string): boolean;
  toSafeCredential(): DeviceCredential;
}

export interface IDeviceCredentialModel extends mongoose.Model<IDeviceCredentialDocument> {
  generateSecret(): { token: string; prefix: string; hashed: string };
  hashSecret(plainSecret: string): string;
}

const DeviceCredentialSchema = new Schema<IDeviceCredentialDocument, IDeviceCredentialModel>(
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
    credentialType: {
      type: String,
      enum: ['API_KEY', 'HMAC_KEY', 'PRESHARED_TOKEN'],
      default: 'PRESHARED_TOKEN',
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hashedSecret: {
      type: String,
      required: true,
      select: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    lastRotatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Indexes ──
DeviceCredentialSchema.index({ organizationId: 1, deviceId: 1 });
DeviceCredentialSchema.index({ deviceId: 1, status: 1 });

/**
 * Generate cryptographically secure device token.
 * Format: sent_dev_<32_hex_chars>
 */
DeviceCredentialSchema.statics.generateSecret = function (): {
  token: string;
  prefix: string;
  hashed: string;
} {
  const randomHex = crypto.randomBytes(24).toString('hex');
  const token = `sent_dev_${randomHex}`;
  const prefix = token.substring(0, 15); // e.g. "sent_dev_a1b2c3"
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  return { token, prefix, hashed };
};

DeviceCredentialSchema.statics.hashSecret = function (plainSecret: string): string {
  return crypto.createHash('sha256').update(plainSecret).digest('hex');
};

DeviceCredentialSchema.methods.verifySecret = function (
  this: IDeviceCredentialDocument,
  plainSecret: string
): boolean {
  if (this.status !== 'ACTIVE') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  const hash = crypto.createHash('sha256').update(plainSecret).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(this.hashedSecret), Buffer.from(hash));
  } catch {
    return false;
  }
};

DeviceCredentialSchema.methods.toSafeCredential = function (
  this: IDeviceCredentialDocument
): DeviceCredential {
  return {
    id: this._id.toString(),
    deviceId: this.deviceId,
    credentialType: this.credentialType,
    keyPrefix: this.keyPrefix,
    lastRotatedAt: this.lastRotatedAt.toISOString(),
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : undefined,
    status: this.status,
  };
};

export const DeviceCredentialModel = mongoose.model<
  IDeviceCredentialDocument,
  IDeviceCredentialModel
>('DeviceCredential', DeviceCredentialSchema);
