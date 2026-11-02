// ─────────────────────────────────────────────
// SENTINEL API — Application Configuration
// ─────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinel',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/api/v1/auth/google/callback',
  },

  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  accessControl: {
    adminEmails: (process.env.ADMIN_EMAILS || 'admin@sentinel.local')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    requireAdminApproval: process.env.REQUIRE_ADMIN_APPROVAL !== 'false',
  },
} as const;

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates critical production security requirements and environment sanity.
 */
export function validateProductionConfig(customConfig?: Partial<typeof config>): ConfigValidationResult {
  const cfg = { ...config, ...customConfig };
  const errors: string[] = [];
  const warnings: string[] = [];

  if (cfg.env === 'production') {
    if (!cfg.jwt.secret || cfg.jwt.secret === 'CHANGE_ME_IN_PRODUCTION') {
      errors.push('JWT_SECRET must be configured with a cryptographically secure key in production.');
    } else if (cfg.jwt.secret.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for high cryptographic entropy.');
    }

    if (!cfg.mongodb.uri) {
      errors.push('MONGODB_URI must be provided in production.');
    } else if (cfg.mongodb.uri.includes('localhost')) {
      warnings.push('MONGODB_URI points to localhost; ensure containerized cluster or replica set endpoint is used in production.');
    }

    if (cfg.cors.origin === '*') {
      errors.push('Wildcard CORS_ORIGIN is prohibited in production; specify authoritative domain.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
