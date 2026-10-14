// ─────────────────────────────────────────────
// SENTINEL API — Authentication Service
// ─────────────────────────────────────────────

import {
  UserModel,
  OAuthIdentityModel,
  RefreshTokenModel,
  AllowedEmailModel,
} from '../models/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
} from '../utils/jwt.js';
import { GoogleUserInfo } from '../utils/google-auth.js';
import { AppError } from '../middleware/error-handler.js';
import { config } from '../config.js';
import type {
  User as UserType,
  AllowlistEntry,
  Role,
  UserStatus,
} from '@sentinel/types';

const REFRESH_TOKEN_DAYS = 30;

export interface AuthResult {
  user: UserType;
  token: string;
  refreshToken: string;
  accountLinked?: boolean;
}

export class AuthService {
  /**
   * Evaluate whether an email is allowed to access the system
   * Checks bootstrap admin emails, database allowlist, and first-user status
   */
  private static async evaluateEmailAccess(
    email: string,
    displayName?: string,
    avatarUrl?: string,
    provider: 'credentials' | 'google' = 'credentials'
  ): Promise<{ allowed: boolean; role: Role; status: UserStatus }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Is this an explicit bootstrap admin email from .env?
    if (config.accessControl.adminEmails.includes(normalizedEmail)) {
      // Ensure it is recorded as APPROVED in the allowlist
      await AllowedEmailModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            role: 'SUPER_ADMIN',
            status: 'APPROVED',
            displayName,
            avatarUrl,
            provider,
            notes: 'Bootstrap Superadmin (.env)',
            approvedAt: new Date(),
          },
        },
        { upsert: true }
      );
      return { allowed: true, role: 'SUPER_ADMIN', status: 'ACTIVE' };
    }

    // 2. Is this the very first user registering on this instance?
    const totalUsers = await UserModel.countDocuments();
    if (totalUsers === 0) {
      await AllowedEmailModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            role: 'SUPER_ADMIN',
            status: 'APPROVED',
            displayName,
            avatarUrl,
            provider,
            notes: 'Initial instance administrator',
            approvedAt: new Date(),
          },
        },
        { upsert: true }
      );
      return { allowed: true, role: 'SUPER_ADMIN', status: 'ACTIVE' };
    }

    // 3. Check if email is in the AllowedEmail collection and APPROVED
    const allowRecord = await AllowedEmailModel.findOne({ email: normalizedEmail });
    if (allowRecord && allowRecord.status === 'APPROVED') {
      return { allowed: true, role: allowRecord.role || 'OPERATOR', status: 'ACTIVE' };
    }

    // 4. Not in allowlist: If admin approval is required, register as PENDING
    if (config.accessControl.requireAdminApproval) {
      if (!allowRecord) {
        await AllowedEmailModel.create({
          email: normalizedEmail,
          role: 'OPERATOR',
          status: 'PENDING',
          displayName,
          avatarUrl,
          provider,
          notes: 'Self-registration request',
        });
      }
      return { allowed: false, role: 'OPERATOR', status: 'PENDING_APPROVAL' };
    }

    // 5. Open enrollment if requireAdminApproval is explicitly false
    return { allowed: true, role: 'OPERATOR', status: 'ACTIVE' };
  }

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
      if (existingUser.status === 'PENDING_APPROVAL') {
        throw new AppError(
          403,
          'Your registration request is already submitted and pending administrator approval. An administrator must approve your email before access is granted.',
          'ACCOUNT_PENDING_APPROVAL'
        );
      }
      throw new AppError(409, 'An account with this email address already exists.');
    }

    // Check hardware access control policy
    const access = await this.evaluateEmailAccess(
      normalizedEmail,
      displayName.trim(),
      undefined,
      'credentials'
    );

    // Hash password securely with bcrypt
    const passwordHash = await hashPassword(password);

    if (!access.allowed) {
      // User is not allowed yet — create pending record and reject admission
      await UserModel.create({
        email: normalizedEmail,
        displayName: displayName.trim(),
        passwordHash,
        emailVerified: false,
        status: 'PENDING_APPROVAL',
        role: 'OPERATOR',
      });

      throw new AppError(
        403,
        'Registration submitted successfully. Sentinel is an enterprise IoT hardware perimeter — your email requires administrator authorization before you can log in.',
        'ACCOUNT_PENDING_APPROVAL'
      );
    }

    // User is authorized
    const newUser = await UserModel.create({
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash,
      emailVerified: false,
      status: 'ACTIVE',
      role: access.role,
    });

    const token = generateAccessToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
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

    // Check access approval status
    if (user.status === 'PENDING_APPROVAL') {
      // Re-verify if an admin approved this email since their registration
      const allowRecord = await AllowedEmailModel.findOne({
        email: normalizedEmail,
        status: 'APPROVED',
      });
      const isBootstrapAdmin = config.accessControl.adminEmails.includes(normalizedEmail);

      if (allowRecord || isBootstrapAdmin) {
        user.status = 'ACTIVE';
        if (isBootstrapAdmin) user.role = 'SUPER_ADMIN';
        else if (allowRecord?.role) user.role = allowRecord.role;
        await user.save();
      } else {
        throw new AppError(
          403,
          'Your account is pending administrator approval. Sentinel is restricted to authorized personnel.',
          'ACCOUNT_PENDING_APPROVAL'
        );
      }
    } else if (user.status === 'REJECTED') {
      throw new AppError(
        403,
        'Your registration request was rejected by an administrator. Please contact your facility administrator.',
        'ACCOUNT_REJECTED'
      );
    } else if (user.status === 'SUSPENDED') {
      throw new AppError(
        403,
        'This account has been suspended by an administrator.',
        'ACCOUNT_SUSPENDED'
      );
    }

    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
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
   * Master Prompt Rule #25: Never duplicate accounts when verified Google email matches.
   * Access Rule: Restrict access to admin-approved emails only.
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

      // Check approval status
      if (user.status === 'PENDING_APPROVAL') {
        const allowRecord = await AllowedEmailModel.findOne({
          email: normalizedEmail,
          status: 'APPROVED',
        });
        const isBootstrapAdmin = config.accessControl.adminEmails.includes(normalizedEmail);

        if (allowRecord || isBootstrapAdmin) {
          user.status = 'ACTIVE';
          if (isBootstrapAdmin) user.role = 'SUPER_ADMIN';
          else if (allowRecord?.role) user.role = allowRecord.role;
          await user.save();
        } else {
          throw new AppError(
            403,
            `Access restricted: Your Google account (${normalizedEmail}) has been registered and is pending administrator authorization.`,
            'ACCOUNT_PENDING_APPROVAL'
          );
        }
      } else if (user.status === 'REJECTED') {
        throw new AppError(
          403,
          'Your registration request was rejected by an administrator.',
          'ACCOUNT_REJECTED'
        );
      } else if (user.status === 'SUSPENDED') {
        throw new AppError(
          403,
          'This account has been suspended by an administrator.',
          'ACCOUNT_SUSPENDED'
        );
      }

      // Update avatar if provided
      if (googleUser.picture && !user.avatarUrl) {
        user.avatarUrl = googleUser.picture;
        await user.save();
      }

      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
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

      // Check status
      if (existingUserByEmail.status === 'PENDING_APPROVAL') {
        const allowRecord = await AllowedEmailModel.findOne({
          email: normalizedEmail,
          status: 'APPROVED',
        });
        const isBootstrapAdmin = config.accessControl.adminEmails.includes(normalizedEmail);

        if (allowRecord || isBootstrapAdmin) {
          existingUserByEmail.status = 'ACTIVE';
          if (isBootstrapAdmin) existingUserByEmail.role = 'SUPER_ADMIN';
          else if (allowRecord?.role) existingUserByEmail.role = allowRecord.role;
        } else {
          await existingUserByEmail.save();
          throw new AppError(
            403,
            `Access restricted: Your Google account (${normalizedEmail}) is linked but pending administrator approval.`,
            'ACCOUNT_PENDING_APPROVAL'
          );
        }
      } else if (existingUserByEmail.status === 'REJECTED') {
        await existingUserByEmail.save();
        throw new AppError(
          403,
          'Your registration request was rejected by an administrator.',
          'ACCOUNT_REJECTED'
        );
      } else if (existingUserByEmail.status === 'SUSPENDED') {
        await existingUserByEmail.save();
        throw new AppError(
          403,
          'This account has been suspended by an administrator.',
          'ACCOUNT_SUSPENDED'
        );
      }

      await existingUserByEmail.save();

      const token = generateAccessToken({
        userId: existingUserByEmail._id.toString(),
        email: existingUserByEmail.email,
        role: existingUserByEmail.role,
        status: existingUserByEmail.status,
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
    const access = await this.evaluateEmailAccess(
      normalizedEmail,
      googleUser.name,
      googleUser.picture,
      'google'
    );

    if (!access.allowed) {
      // User is not pre-authorized — create pending user and link OAuth identity
      const pendingUser = await UserModel.create({
        email: normalizedEmail,
        displayName: googleUser.name,
        avatarUrl: googleUser.picture,
        emailVerified: true,
        status: 'PENDING_APPROVAL',
        role: 'OPERATOR',
      });

      await OAuthIdentityModel.create({
        userId: pendingUser._id,
        provider: 'google',
        providerUserId: googleUser.sub,
        email: normalizedEmail,
      });

      throw new AppError(
        403,
        `Access restricted: Sentinel is a private hardware IoT platform. Your Google account (${normalizedEmail}) has been registered and is pending administrator authorization.`,
        'ACCOUNT_PENDING_APPROVAL'
      );
    }

    // Authorized Google User
    const newUser = await UserModel.create({
      email: normalizedEmail,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      emailVerified: true,
      status: 'ACTIVE',
      role: access.role,
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
      role: newUser.role,
      status: newUser.status,
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

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, `Account status: ${user.status}. Access denied.`);
    }

    // Revoke old refresh token (rotation)
    record.revoked = true;
    await record.save();

    // Issue new access and refresh tokens
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
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
   * Admin: Retrieve all access requests & allowlist entries
   */
  static async getAccessRequests(): Promise<{
    pending: AllowlistEntry[];
    approved: AllowlistEntry[];
    rejected: AllowlistEntry[];
  }> {
    const records = await AllowedEmailModel.find().sort({ createdAt: -1 });

    return {
      pending: records.filter((r) => r.status === 'PENDING').map((r) => r.toEntry()),
      approved: records.filter((r) => r.status === 'APPROVED').map((r) => r.toEntry()),
      rejected: records.filter((r) => r.status === 'REJECTED').map((r) => r.toEntry()),
    };
  }

  /**
   * Admin: Add an email to the approved allowlist (pre-authorize)
   */
  static async addToAllowlist(
    email: string,
    role: Role = 'OPERATOR',
    notes?: string,
    adminUserId?: string
  ): Promise<AllowlistEntry> {
    const normalizedEmail = email.toLowerCase().trim();

    const entry = await AllowedEmailModel.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          role,
          status: 'APPROVED',
          notes: notes || 'Pre-authorized by administrator',
          approvedAt: new Date(),
          approvedBy: adminUserId,
        },
      },
      { upsert: true, new: true }
    );

    // If a user account already exists in PENDING_APPROVAL, immediately activate it!
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.status === 'PENDING_APPROVAL') {
      existingUser.status = 'ACTIVE';
      existingUser.role = role;
      await existingUser.save();
    }

    return entry.toEntry();
  }

  /**
   * Admin: Approve a pending access request
   */
  static async approveAccessRequest(
    id: string,
    role?: Role,
    notes?: string,
    adminUserId?: string
  ): Promise<AllowlistEntry> {
    const entry = await AllowedEmailModel.findById(id);
    if (!entry) {
      throw new AppError(404, 'Access request not found.');
    }

    entry.status = 'APPROVED';
    if (role) entry.role = role;
    if (notes) entry.notes = notes;
    entry.approvedAt = new Date();
    if (adminUserId) entry.approvedBy = adminUserId as unknown as typeof entry.approvedBy;
    await entry.save();

    // Activate the user in the database
    const user = await UserModel.findOne({ email: entry.email });
    if (user) {
      user.status = 'ACTIVE';
      user.role = entry.role;
      await user.save();
    }

    return entry.toEntry();
  }

  /**
   * Admin: Reject a pending access request
   */
  static async rejectAccessRequest(
    id: string,
    notes?: string,
    adminUserId?: string
  ): Promise<AllowlistEntry> {
    const entry = await AllowedEmailModel.findById(id);
    if (!entry) {
      throw new AppError(404, 'Access request not found.');
    }

    entry.status = 'REJECTED';
    if (notes) entry.notes = notes;
    entry.approvedAt = new Date();
    if (adminUserId) entry.approvedBy = adminUserId as unknown as typeof entry.approvedBy;
    await entry.save();

    // Update user status
    const user = await UserModel.findOne({ email: entry.email });
    if (user) {
      user.status = 'REJECTED';
      await user.save();
    }

    return entry.toEntry();
  }

  /**
   * Admin: Revoke access / delete allowlist entry
   */
  static async revokeAllowlistEntry(id: string): Promise<void> {
    const entry = await AllowedEmailModel.findById(id);
    if (!entry) {
      throw new AppError(404, 'Allowlist entry not found.');
    }

    const email = entry.email;
    await AllowedEmailModel.findByIdAndDelete(id);

    // Also suspend or set to pending for user
    const user = await UserModel.findOne({ email });
    if (user) {
      user.status = 'SUSPENDED';
      await user.save();
    }
  }

  /**
   * Public check for a user to see if their email is approved
   */
  static async checkEmailStatus(email: string): Promise<{
    email: string;
    status: UserStatus | 'NOT_REQUESTED';
    role?: Role;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (user) {
      return {
        email: normalizedEmail,
        status: user.status,
        role: user.role,
      };
    }

    const allowRecord = await AllowedEmailModel.findOne({ email: normalizedEmail });
    if (allowRecord) {
      return {
        email: normalizedEmail,
        status: allowRecord.status === 'APPROVED' ? 'ACTIVE' : 'PENDING_APPROVAL',
        role: allowRecord.role,
      };
    }

    return {
      email: normalizedEmail,
      status: 'NOT_REQUESTED',
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
