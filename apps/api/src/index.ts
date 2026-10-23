// ─────────────────────────────────────────────
// SENTINEL API — Server Entry Point
// ─────────────────────────────────────────────

import http from 'node:http';
import { app } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import { MqttService } from './services/mqtt.service.js';
import { WebSocketService } from './services/websocket.service.js';
import { AutomationService } from './services/automation.service.js';

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    // Initialize real-time WebSocket telemetry & event gateway
    WebSocketService.init(server);

    // Initialize autonomous policy engine
    AutomationService.init();

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
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start SENTINEL API server:', error);
    process.exit(1);
  }
}

startServer();
