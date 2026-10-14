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

