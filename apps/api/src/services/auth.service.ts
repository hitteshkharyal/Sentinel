// ─────────────────────────────────────────────
// SENTINEL API — Authentication Service
// ─────────────────────────────────────────────

import { UserModel, OAuthIdentityModel, RefreshTokenModel } from '../models/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
} from '../utils/jwt.js';
import { GoogleUserInfo } from '../utils/google-auth.js';
import { AppError } from '../middleware/error-handler.js';
import type { User as UserType } from '@sentinel/types';

const REFRESH_TOKEN_DAYS = 30;

export interface AuthResult {
  user: UserType;
  token: string;
  refreshToken: string;
  accountLinked?: boolean;
}

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(409, 'An account with this email address already exists.');
    }

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    const newUser = await UserModel.create({
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash,
      emailVerified: false,
    });

    const token = generateAccessToken({
      userId: newUser._id.toString(),
      email: newUser.email,
    });

    const refreshToken = await this.createRefreshToken(newUser._id.toString());

    return {
      user: newUser.toSafeUser(),
      token,
      refreshToken,
    };
  }

  /**
   * Log in an existing user with email and password
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new AppError(401, 'Invalid email or password.');
    }

    // Check if the user signed up via Google and has no password set
    if (!user.passwordHash) {
      throw new AppError(
        400,
        'This account was registered using Google. Please click "Continue with Google" to log in.'
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'Invalid email or password.');
    }

    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const refreshToken = await this.createRefreshToken(user._id.toString());

    return {
      user: user.toSafeUser(),
      token,
      refreshToken,
    };
  }

  /**
   * Google OAuth login & automatic account linking
   * Master Prompt Rule: Never duplicate accounts when verified Google email matches.
   */
  static async authenticateWithGoogle(googleUser: GoogleUserInfo): Promise<AuthResult> {
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // 1. Check if OAuth identity already exists for Google
    const existingIdentity = await OAuthIdentityModel.findOne({
      provider: 'google',
      providerUserId: googleUser.sub,
    });

    if (existingIdentity) {
      const user = await UserModel.findById(existingIdentity.userId);
      if (!user) {
        throw new AppError(404, 'Linked user profile not found.');
      }

      // Update avatar if provided
      if (googleUser.picture && !user.avatarUrl) {
        user.avatarUrl = googleUser.picture;
        await user.save();
      }

      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
      });
      const refreshToken = await this.createRefreshToken(user._id.toString());

      return {
        user: user.toSafeUser(),
        token,
        refreshToken,
        accountLinked: false,
      };
    }

    // 2. Identity does not exist: check if user with matching email already exists
    const existingUserByEmail = await UserModel.findOne({ email: normalizedEmail });

    if (existingUserByEmail) {
      // ── ACCOUNT LINKING ──
      // Link Google identity to existing account preserving userId, facilities, devices, permissions
      await OAuthIdentityModel.create({
        userId: existingUserByEmail._id,
        provider: 'google',
        providerUserId: googleUser.sub,
        email: normalizedEmail,
      });

      // Update email verified and avatar
      existingUserByEmail.emailVerified = true;
      if (!existingUserByEmail.avatarUrl && googleUser.picture) {
        existingUserByEmail.avatarUrl = googleUser.picture;
      }
      await existingUserByEmail.save();

      const token = generateAccessToken({
        userId: existingUserByEmail._id.toString(),
        email: existingUserByEmail.email,
      });
      const refreshToken = await this.createRefreshToken(existingUserByEmail._id.toString());

      return {
        user: existingUserByEmail.toSafeUser(),
        token,
        refreshToken,
        accountLinked: true,
      };
    }

    // 3. New User Registration via Google
    const newUser = await UserModel.create({
      email: normalizedEmail,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      emailVerified: true,
    });

    await OAuthIdentityModel.create({
      userId: newUser._id,
      provider: 'google',
      providerUserId: googleUser.sub,
      email: normalizedEmail,
    });

    const token = generateAccessToken({
      userId: newUser._id.toString(),
      email: newUser.email,
    });
    const refreshToken = await this.createRefreshToken(newUser._id.toString());

    return {
      user: newUser.toSafeUser(),
      token,
      refreshToken,
      accountLinked: false,
    };
  }

  /**
   * Refresh an access token using a valid refresh token
   */
  static async refreshAccessToken(
    refreshTokenString: string
  ): Promise<{ token: string; refreshToken: string }> {
    const record = await RefreshTokenModel.findOne({
      token: refreshTokenString,
      revoked: false,
    });

    if (!record || record.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token.');
    }

    const user = await UserModel.findById(record.userId);
    if (!user) {
      throw new AppError(401, 'User account no longer exists.');
    }

    // Revoke old refresh token (rotation)
    record.revoked = true;
    await record.save();

    // Issue new access and refresh tokens
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const newRefreshToken = await this.createRefreshToken(user._id.toString());

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revoke a refresh token on logout
   */
  static async revokeToken(refreshTokenString: string): Promise<void> {
    await RefreshTokenModel.updateOne(
      { token: refreshTokenString },
      { $set: { revoked: true } }
    );
  }

  /**
   * Get user profile by userId
   */
  static async getUserProfile(
    userId: string
  ): Promise<{ user: UserType; linkedProviders: string[] }> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const identities = await OAuthIdentityModel.find({ userId: user._id });
    const linkedProviders = identities.map((id) => id.provider);

    return {
      user: user.toSafeUser(),
      linkedProviders,
    };
  }

  /**
   * Internal helper to create and store a refresh token in MongoDB
   */
  private static async createRefreshToken(userId: string): Promise<string> {
    const tokenString = generateRefreshTokenString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await RefreshTokenModel.create({
      userId,
      token: tokenString,
      expiresAt,
    });

    return tokenString;
  }
}
