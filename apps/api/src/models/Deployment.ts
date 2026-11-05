// ─────────────────────────────────────────────
// SENTINEL API — Deployment Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type {
  Deployment,
  DeploymentStatus,
  DeploymentHardwareConfig,
  IndustryType,
} from '@sentinel/types';

export interface IDeploymentDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  facilityName?: string;
  roomId?: mongoose.Types.ObjectId;
  roomName?: string;
  deviceId?: string;
  name: string;
  description?: string;
  industry: IndustryType;
  useCaseId: string;
  useCaseName: string;
  status: DeploymentStatus;
  hardwareConfig: DeploymentHardwareConfig;
  latestFirmwareBuildId?: mongoose.Types.ObjectId;
  latestFirmwareVersion?: string;
  activeTestSessionId?: mongoose.Types.ObjectId;
  isReadinessApproved: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeDeployment(): Deployment;
}

const DeploymentSchema = new Schema<IDeploymentDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: true,
      index: true,
    },
    facilityName: { type: String, trim: true },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    roomName: { type: String, trim: true },
    deviceId: { type: String, trim: true, index: true },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    industry: {
      type: String,
      required: true,
      index: true,
    },
    useCaseId: {
      type: String,
      required: true,
      index: true,
    },
    useCaseName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'CONFIGURED',
        'FIRMWARE_GENERATED',
        'PROVISIONING',
        'TESTING',
        'ACTIVE',
        'FAILED',
        'ARCHIVED',
      ],
      default: 'CONFIGURED',
      index: true,
    },
    hardwareConfig: {
      type: Schema.Types.Mixed,
      required: true,
    },
    latestFirmwareBuildId: {
      type: Schema.Types.ObjectId,
      ref: 'FirmwareBuild',
    },
    latestFirmwareVersion: { type: String, default: '1.0.0' },
    activeTestSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'HardwareTestSession',
    },
    isReadinessApproved: {
      type: Boolean,
      default: false,
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

DeploymentSchema.index({ organizationId: 1, status: 1 });
DeploymentSchema.index({ organizationId: 1, facilityId: 1 });
DeploymentSchema.index({ organizationId: 1, industry: 1 });

DeploymentSchema.methods.toSafeDeployment = function (this: IDeploymentDocument): Deployment {
  return {
    id: this._id.toString(),
    organizationId: this.organizationId.toString(),
    facilityId: this.facilityId.toString(),
    facilityName: this.facilityName,
    roomId: this.roomId ? this.roomId.toString() : undefined,
    roomName: this.roomName,
    deviceId: this.deviceId,
    name: this.name,
    description: this.description,
    industry: this.industry,
    useCaseId: this.useCaseId,
    useCaseName: this.useCaseName,
    status: this.status,
    hardwareConfig: this.hardwareConfig,
    latestFirmwareBuildId: this.latestFirmwareBuildId ? this.latestFirmwareBuildId.toString() : undefined,
    latestFirmwareVersion: this.latestFirmwareVersion,
    activeTestSessionId: this.activeTestSessionId ? this.activeTestSessionId.toString() : undefined,
    isReadinessApproved: this.isReadinessApproved,
    createdBy: this.createdBy.toString(),
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const DeploymentModel = mongoose.model<IDeploymentDocument>(
  'Deployment',
  DeploymentSchema
);

