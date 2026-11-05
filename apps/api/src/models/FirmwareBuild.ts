// ─────────────────────────────────────────────
// SENTINEL API — Firmware Build & Manifest Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { FirmwareBuildArtifact, FirmwareManifest } from '@sentinel/types';

export interface IFirmwareBuildDocument extends Document {
  deploymentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  version: string;
  status: 'PENDING' | 'BUILDING' | 'READY' | 'FAILED';
  manifest: FirmwareManifest;
  sourceZipBase64?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeArtifact(): FirmwareBuildArtifact;
}

const FirmwareBuildSchema = new Schema<IFirmwareBuildDocument>(
  {
    deploymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Deployment',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    status: {
      type: String,
      enum: ['PENDING', 'BUILDING', 'READY', 'FAILED'],
      default: 'READY',
      index: true,
    },
    manifest: {
      type: Schema.Types.Mixed,
      required: true,
    },
    sourceZipBase64: {
      type: String,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
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

FirmwareBuildSchema.index({ deploymentId: 1, version: 1 }, { unique: true });
FirmwareBuildSchema.index({ organizationId: 1, createdAt: -1 });

FirmwareBuildSchema.methods.toSafeArtifact = function (this: IFirmwareBuildDocument): FirmwareBuildArtifact {
  return {
    id: this._id.toString(),
    deploymentId: this.deploymentId.toString(),
    organizationId: this.organizationId.toString(),
    version: this.version,
    status: this.status,
    manifest: this.manifest,
    downloadUrl: `/api/v1/deployments/${this.deploymentId}/firmware/download?version=${this.version}`,
    fileSizeBytes: this.fileSizeBytes,
    errorMessage: this.errorMessage,
    createdAt: this.createdAt.toISOString(),
  };
};

export const FirmwareBuildModel = mongoose.model<IFirmwareBuildDocument>(
  'FirmwareBuild',
  FirmwareBuildSchema
);

