// ─────────────────────────────────────────────
// SENTINEL API — Server Entry Point
// ─────────────────────────────────────────────

import http from 'node:http';
import { app } from './app.js';
import { config, validateProductionConfig } from './config.js';
import { connectDatabase } from './db.js';
import { MqttService } from './services/mqtt.service.js';
import { WebSocketService } from './services/websocket.service.js';
import { AutomationService } from './services/automation.service.js';
import { AlertService } from './services/alert.service.js';

async function startServer() {
  try {
    // ── 1. Production Configuration Guard ──
    const configCheck = validateProductionConfig();
    if (!configCheck.valid) {
      console.error('[Config] Insecure production configuration detected:');
      configCheck.errors.forEach((e) => console.error(`  - ${e}`));
      if (config.env === 'production') {
        console.error('[Config] Server terminating due to production security violations.');
        process.exit(1);
      }
    }
    if (configCheck.warnings.length > 0) {
      configCheck.warnings.forEach((w) => console.warn(`[Config] Security Warning: ${w}`));
    }

    await connectDatabase();

    const server = http.createServer(app);

    // Initialize real-time WebSocket telemetry & event gateway
    WebSocketService.init(server);

    // Initialize autonomous policy engine
    AutomationService.init();

    // Initialize alert and escalation matrix engine
    AlertService.init();

    // Initialize embedded MQTT broker (falls back gracefully if port is occupied)
    const mqttPort = Number(process.env.MQTT_PORT) || 1883;
    await MqttService.startBroker(mqttPort);

    server.listen(config.port, () => {
      const mqttStatus = MqttService.getStatus();
      console.warn(`
╔══════════════════════════════════════════════╗
║            SENTINEL IOT PLATFORM             ║
║──────────────────────────────────────────────║
║  API Status:  RUNNING                        ║
║  HTTP Port:   ${String(config.port).padEnd(30)}║
║  MQTT Broker: ${String(mqttStatus.isRunning ? `ONLINE (port ${mqttStatus.port})` : 'STANDALONE / EXTERNAL').padEnd(30)}║
║  WebSocket:   ws://localhost:${String(config.port)}/ws/telemetry  ║
║  Environment: ${config.env.padEnd(30)}║
║  API Base:    /api/v1                        ║
║  Health:      /api/v1/health                 ║
║  Liveness:    /api/v1/health/live            ║
║  Readiness:   /api/v1/health/ready           ║
╚══════════════════════════════════════════════╝
      `);
    });

    // ── 2. Production Graceful Shutdown Lifecycle ──
    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.warn(`\n[Shutdown] Received ${signal}. Initiating graceful shutdown...`);

      // Force exit fallback timeout (10 seconds)
      const forceTimer = setTimeout(() => {
        console.error('[Shutdown] Forcefully shutting down after timeout expired.');
        process.exit(1);
      }, 10000);
      forceTimer.unref();

      try {
        // Stop accepting new HTTP requests
        await new Promise<void>((resolve) => {
          server.close((err) => {
            if (err) console.error('[Shutdown] HTTP server close error:', err);
            else console.warn('[Shutdown] HTTP server closed to new connections.');
            resolve();
          });
        });

        // Close active WebSocket connections
        WebSocketService.close();
        console.warn('[Shutdown] WebSocket gateway terminated.');

        // Stop MQTT broker
        await MqttService.stopBroker();
        console.warn('[Shutdown] MQTT broker stopped.');

        // Disconnect database connection
        const { default: mongoose } = await import('mongoose');
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
          console.warn('[Shutdown] Database connection closed.');
        }

        console.warn('[Shutdown] All subsystem shutdown routines completed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown] Error occurred during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start SENTINEL API server:', error);
    process.exit(1);
  }
}

startServer();
