// ─────────────────────────────────────────────
// SENTINEL API — Room Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  Room,
  RoomType,
  RoomOccupancyState,
  RoomPrivacyLevel,
  HvacState,
} from '@sentinel/types';

export interface IRoomDocument extends Document {
  floorId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  roomNumber?: string;
  roomType: RoomType;
  capacity: number;
  description?: string;
  privacyLevel: RoomPrivacyLevel;
  occupancyState: RoomOccupancyState;
  estimatedOccupants: number;
  occupancyConfidence: number;
  hvacState: HvacState;
  hvacIsSimulated: boolean;
  currentTemperature?: number;
  currentHumidity?: number;
  currentCo2?: number;
  currentSoundLevel?: number;
  doorState?: 'open' | 'closed';
  hasActiveAlert?: boolean;
  activeAlertSeverity?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeRoom(): Room;
}

const RoomSchema = new Schema<IRoomDocument>(
  {
    floorId: {
      type: Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
      index: true,
    },
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
      maxlength: 200,
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: 50,
      index: true,
    },
    roomType: {
      type: String,
      enum: [
        'hotel_room',
        'hospital_room',
        'classroom',
        'office',
        'meeting_room',
        'lobby',
        'corridor',
        'restroom',
        'storage',
        'parking_zone',
        'factory_zone',
        'warehouse_zone',
        'mall_zone',
        'elevator',
        'bus',
        'general',
      ],
      default: 'general',
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    privacyLevel: {
      type: String,
      enum: ['STANDARD', 'HIGH_PRIVACY', 'RESTRICTED_ACCESS'],
      default: 'STANDARD',
    },
    occupancyState: {
      type: String,
      enum: [
        'EMPTY',
        'OCCUPIED',
        'STATIONARY_OCCUPANCY',
        'ACTIVE_OCCUPANCY',
        'HIGH_DENSITY',
        'UNKNOWN',
      ],
      default: 'EMPTY',
      index: true,
    },
    estimatedOccupants: {
      type: Number,
      default: 0,
      min: 0,
    },
    occupancyConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    hvacState: {
      type: String,
      enum: ['ECO', 'COMFORT', 'OFF', 'VENTILATION_BOOST'],
      default: 'ECO',
    },
    hvacIsSimulated: {
      type: Boolean,
      default: true,
    },
    currentTemperature: {
      type: Number,
    },
    currentHumidity: {
      type: Number,
    },
    currentCo2: {
      type: Number,
    },
    currentSoundLevel: {
      type: Number,
    },
    doorState: {
      type: String,
      enum: ['open', 'closed'],
      default: 'closed',
    },
    hasActiveAlert: {
      type: Boolean,
      default: false,
    },
    activeAlertSeverity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
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

// Compound and text indexes for global search and high-speed retrieval
RoomSchema.index({ organizationId: 1, facilityId: 1, floorId: 1 });
RoomSchema.index({ name: 'text', roomNumber: 'text', description: 'text' });

RoomSchema.methods.toSafeRoom = function (this: IRoomDocument): Room {
  return {
    id: this._id.toString(),
    floorId: this.floorId.toString(),
    facilityId: this.facilityId.toString(),
    organizationId: this.organizationId.toString(),
    name: this.name,
    roomNumber: this.roomNumber,
    roomType: this.roomType,
    capacity: this.capacity,
    description: this.description,
    privacyLevel: this.privacyLevel,
    occupancyState: this.occupancyState,
    estimatedOccupants: this.estimatedOccupants,
    occupancyConfidence: this.occupancyConfidence,
    hvacState: this.hvacState,
    hvacIsSimulated: this.hvacIsSimulated,
    currentTemperature: this.currentTemperature,
    currentHumidity: this.currentHumidity,
    currentCo2: this.currentCo2,
    currentSoundLevel: this.currentSoundLevel,
    doorState: this.doorState,
    hasActiveAlert: this.hasActiveAlert,
    activeAlertSeverity: this.activeAlertSeverity,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const RoomModel = mongoose.model<IRoomDocument>('Room', RoomSchema);
