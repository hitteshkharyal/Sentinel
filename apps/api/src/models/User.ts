// ─────────────────────────────────────────────
// SENTINEL API — User Model
// ─────────────────────────────────────────────

import mongoose, { Document, Schema } from 'mongoose';
import type { User as UserType } from '@sentinel/types';

export interface IUserDocument extends Document {
  email: string;
  displayName: string;
  passwordHash?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeUser(): UserType;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    passwordHash: {
      type: String,
      required: false, // Optional if created via Google OAuth
    },
    avatarUrl: {
      type: String,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeUser = function (): UserType {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    avatarUrl: this.avatarUrl,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
