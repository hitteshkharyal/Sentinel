// ─────────────────────────────────────────────
// SENTINEL API — Server Entry Point
// ─────────────────────────────────────────────

import { app } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

async function startServer() {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.warn(`
╔══════════════════════════════════════════════╗
║            SENTINEL API SERVER               ║
║──────────────────────────────────────────────║
║  Status:      RUNNING                        ║
║  Port:        ${String(config.port).padEnd(30)}║
║  Environment: ${config.env.padEnd(30)}║
║  API:         /api/v1                        ║
║  Health:      /api/v1/health                 ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start SENTINEL API server:', error);
    process.exit(1);
  }
}

startServer();
