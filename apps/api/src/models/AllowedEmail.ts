// ─────────────────────────────────────────────
// SENTINEL API — AllowedEmail & Access Request Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Role, AllowlistEntry } from '@sentinel/types';

export interface IAllowedEmailDocument extends Document {
  email: string;
  role: Role;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  displayName?: string;
  avatarUrl?: string;
  provider?: 'credentials' | 'google';
  notes?: string;
  addedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toEntry(): AllowlistEntry;
}

const allowedEmailSchema = new Schema<IAllowedEmailDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'ORGANIZATION_ADMIN',
        'FACILITY_ADMIN',
        'MANAGER',
        'OPERATOR',
        'SECURITY',
        'TECHNICIAN',
        'VIEWER',
      ],
      default: 'OPERATOR',
    },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'google',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

allowedEmailSchema.methods.toEntry = function (): AllowlistEntry {
  return {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    status: this.status,
    notes: this.notes,
    displayName: this.displayName,
    provider: this.provider,
    addedBy: this.addedBy?.toString(),
    createdAt: this.createdAt.toISOString(),
    approvedAt: this.approvedAt?.toISOString(),
  };
};

export const AllowedEmailModel = mongoose.model<IAllowedEmailDocument>(
  'AllowedEmail',
  allowedEmailSchema
);
