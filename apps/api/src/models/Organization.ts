// ─────────────────────────────────────────────
// SENTINEL API — Organization Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Organization as OrgType, IndustryType } from '@sentinel/types';

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  industry: IndustryType;
  description?: string;
  contactEmail?: string;
  address?: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeOrg(): OrgType;
}

const organizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        'hotel',
        'hospital',
        'school',
        'transport',
        'office',
        'mall',
        'factory',
        'warehouse',
        'parking',
        'public_facility',
        'general',
      ],
      default: 'general',
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      maxlength: 500,
    },
    logoUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
      default: 'ACTIVE',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.methods.toSafeOrg = function (): OrgType {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    industry: this.industry,
    description: this.description,
    contactEmail: this.contactEmail,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const OrganizationModel = mongoose.model<IOrganizationDocument>(
  'Organization',
  organizationSchema
);
