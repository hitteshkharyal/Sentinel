// ─────────────────────────────────────────────
// SENTINEL API — Database Connection (Mongoose)
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import { config } from './config.js';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose | null> {
  if (isConnected) return mongoose;

  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log(`[Database] MongoDB connected successfully to ${config.mongodb.uri}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection failed: ${(error as Error).message}`);
    // In development, do not crash the server if DB is temporarily unreachable
    if (config.env === 'development') {
      console.warn('[Database] Running in disconnected development mode.');
      return null;
    }
    throw error;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
