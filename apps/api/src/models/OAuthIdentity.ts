// ─────────────────────────────────────────────
// SENTINEL API — OAuthIdentity Model (Account Linking)
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { OAuthProvider, OAuthIdentity as OAuthIdentityType } from '@sentinel/types';

export interface IOAuthIdentityDocument extends Document {
  userId: mongoose.Types.ObjectId;
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  createdAt: Date;
  toSafeIdentity(): OAuthIdentityType;
}

const oAuthIdentitySchema = new Schema<IOAuthIdentityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google'],
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index ensuring one OAuth identity per provider per providerUserId
oAuthIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

oAuthIdentitySchema.methods.toSafeIdentity = function (): OAuthIdentityType {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    provider: this.provider,
    providerUserId: this.providerUserId,
    email: this.email,
    createdAt: this.createdAt.toISOString(),
  };
};

export const OAuthIdentityModel = mongoose.model<IOAuthIdentityDocument>(
  'OAuthIdentity',
  oAuthIdentitySchema
);
