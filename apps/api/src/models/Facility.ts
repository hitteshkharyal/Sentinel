// ─────────────────────────────────────────────
// SENTINEL API — Facility Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Facility, FacilityStatus, FacilityType } from '@sentinel/types';

export interface IFacilityDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  type?: FacilityType;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  status: FacilityStatus;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeFacility(): Facility;
}

const FacilitySchema = new Schema<IFacilityDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    code: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: [
        'hospital_wing',
        'hotel_tower',
        'academic_building',
        'transit_depot',
        'corporate_tower',
        'manufacturing_plant',
        'logistics_hub',
        'retail_center',
        'parking_structure',
        'civic_center',
        'general',
      ],
      default: 'general',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
      index: true,
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

// Unique facility name per organization
FacilitySchema.index({ organizationId: 1, name: 1 }, { unique: true });

FacilitySchema.methods.toSafeFacility = function (this: IFacilityDocument): Facility {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    name: this.name,
    code: this.code,
    type: this.type,
    address: this.address,
    city: this.city,
    country: this.country,
    latitude: this.latitude,
    longitude: this.longitude,
    timezone: this.timezone,
    status: this.status,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const FacilityModel = mongoose.model<IFacilityDocument>(
  'Facility',
  FacilitySchema
);
