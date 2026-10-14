import type { Role } from './organization.js';

export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  status: UserStatus;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthIdentity {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  createdAt: string;
}

export type OAuthProvider = 'google';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface AccessRequest {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  provider: 'credentials' | 'google';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: Role;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AllowlistEntry {
  id: string;
  email: string;
  role: Role;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  notes?: string;
  displayName?: string;
  provider?: 'credentials' | 'google';
  addedBy?: string;
  createdAt: string;
  approvedAt?: string;
}

