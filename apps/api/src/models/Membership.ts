// ─────────────────────────────────────────────
// SENTINEL API — Membership & RBAC Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Membership as MembershipType, Role } from '@sentinel/types';

export interface IMembershipDocument extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: Role;
  facilityIds?: mongoose.Types.ObjectId[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  invitedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeMembership(): MembershipType;
}

const membershipSchema = new Schema<IMembershipDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
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
    facilityIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Facility',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INVITED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee a user has only one membership record per organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

membershipSchema.methods.toSafeMembership = function (): MembershipType {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    organizationId: this.organizationId.toString(),
    role: this.role,
    facilityIds: this.facilityIds?.map((id: mongoose.Types.ObjectId) => id.toString()),
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const MembershipModel = mongoose.model<IMembershipDocument>(
  'Membership',
  membershipSchema
);
