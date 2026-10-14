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

    // Ensure bootstrap admin exists with known credentials in development
    await seedBootstrapAdmin();

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

async function seedBootstrapAdmin(): Promise<void> {
  try {
    const { UserModel, AllowedEmailModel } = await import('./models/index.js');
    const { hashPassword } = await import('./utils/password.js');
    const adminEmail = 'admin@sentinel.local';
    const passwordHash = await hashPassword('SentinelAdmin2026!');

    await UserModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          displayName: 'System Superadmin',
          passwordHash,
          status: 'ACTIVE',
          role: 'SUPER_ADMIN',
          emailVerified: true,
        },
      },
      { upsert: true, new: true }
    );

    await AllowedEmailModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          role: 'SUPER_ADMIN',
          status: 'APPROVED',
          notes: 'Bootstrap default superadmin',
          approvedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (seedErr) {
    console.error('[Database] Failed to seed bootstrap admin:', seedErr);
  }
}


export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
