// ─────────────────────────────────────────────
// @sentinel/types — User & Authentication
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
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
  iat: number;
  exp: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}
