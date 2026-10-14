// ─────────────────────────────────────────────
// SENTINEL API — JWT Token Utilities
// ─────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';
import type { AuthTokenPayload } from '@sentinel/types';

export function generateAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}
