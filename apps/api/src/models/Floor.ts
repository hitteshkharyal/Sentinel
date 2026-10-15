// ─────────────────────────────────────────────
// SENTINEL API — Floor Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { Floor } from '@sentinel/types';

export interface IFloorDocument extends Document {
  facilityId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  level: number;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeFloor(roomCount?: number): Floor;
}

const FloorSchema = new Schema<IFloorDocument>(
  {
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
      index: true,
    },
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
      maxlength: 100,
    },
    level: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
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

// Unique level per facility
FloorSchema.index({ facilityId: 1, level: 1 }, { unique: true });

FloorSchema.methods.toSafeFloor = function (
  this: IFloorDocument,
  roomCount?: number
): Floor {
  return {
    id: this._id.toString(),
    facilityId: this.facilityId.toString(),
    organizationId: this.organizationId.toString(),
    name: this.name,
    level: this.level,
    roomCount,
    description: this.description,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const FloorModel = mongoose.model<IFloorDocument>('Floor', FloorSchema);
