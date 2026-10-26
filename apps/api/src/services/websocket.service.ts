// ─────────────────────────────────────────────
// SENTINEL API — Real-time Telemetry WebSocket Gateway
// ─────────────────────────────────────────────

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { telemetryBus } from './telemetry-validator.js';
import { eventBus } from './event.service.js';
import { automationBus } from './automation.service.js';
import { alertBus } from './alert.service.js';
import type {
  ValidatedTelemetry,
  AuthTokenPayload,
  SentinelEvent,
  AutomationExecution,
  Alert,
} from '@sentinel/types';

interface AuthenticatedClient extends WebSocket {
  isAlive: boolean;
  userId?: string;
  organizationId?: string;
  subscribedFacilityId?: string;
  subscribedRoomId?: string;
}

export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server mounted on the shared HTTP server.
   */
  static init(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/telemetry',
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const client = ws as AuthenticatedClient;
      client.isAlive = true;

      // Parse and verify token from URL query params
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      const requestedOrgId = url.searchParams.get('organizationId');

      if (!token) {
        client.close(4001, 'Unauthorized: Missing auth token');
        return;
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
        client.userId = decoded.userId;
        client.organizationId = requestedOrgId || undefined;
      } catch {
        client.close(4002, 'Unauthorized: Invalid token');
        return;
      }

      // Handle spatial channel subscriptions and client pings
      client.on('message', (message: string) => {
        try {
          const payload = JSON.parse(message.toString());

          if (payload.type === 'SUBSCRIBE') {
            if (payload.facilityId) client.subscribedFacilityId = payload.facilityId;
            if (payload.roomId) client.subscribedRoomId = payload.roomId;
            client.send(
              JSON.stringify({
                type: 'SUBSCRIPTION_ACK',
                facilityId: client.subscribedFacilityId,
                roomId: client.subscribedRoomId,
              })
            );
          }

          if (payload.type === 'UNSUBSCRIBE') {
            client.subscribedFacilityId = undefined;
            client.subscribedRoomId = undefined;
          }

          if (payload.type === 'PING') {
            client.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch {
          // Ignore malformed payloads
        }
      });

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('error', (err) => {
        console.error('[WebSocket] Client connection error:', err);
      });

      // Welcome handshake with connected user metadata
      client.send(
        JSON.stringify({
          type: 'CONNECTED',
          message: 'Connected to SENTINEL Real-time Streaming Gateway',
          userId: client.userId,
        })
      );
    });

    // ── Listen to Telemetry Bus ──
    telemetryBus.on('telemetry', (telemetry: ValidatedTelemetry) => {
      this.broadcast(telemetry);
    });

    // ── Listen to Event Bus ──
    eventBus.on('event', (event: SentinelEvent) => {
      this.broadcastEvent(event, 'EVENT');
    });

    eventBus.on('event:status', (event: SentinelEvent) => {
      this.broadcastEvent(event, 'EVENT_STATUS');
    });

    // ── Listen to Automation Execution Bus ──
    automationBus.on('execution', (execution: AutomationExecution) => {
      this.broadcastAutomationExecution(execution);
    });

    // ── Listen to Alert & Escalation Bus ──
    alertBus.on('alert:created', (alert: Alert) => {
      this.broadcastAlert(alert, 'ALERT_CREATED');
    });

    alertBus.on('alert:updated', (alert: Alert) => {
      this.broadcastAlert(alert, 'ALERT_UPDATED');
    });

    alertBus.on('alert:escalated', (alert: Alert) => {
      this.broadcastAlert(alert, 'ALERT_ESCALATED');
    });

    alertBus.on('alert:resolved', (alert: Alert) => {
      this.broadcastAlert(alert, 'ALERT_RESOLVED');
    });

    // Keepalive heartbeat
    this.pingInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        const client = ws as AuthenticatedClient;
        if (!client.isAlive) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  /**
   * Broadcast telemetry packet to authorized connected clients.
   */
  static broadcast(telemetry: ValidatedTelemetry): void {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type: 'TELEMETRY',
      data: telemetry,
    });

    this.wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedClient;
      if (client.readyState !== WebSocket.OPEN) return;

      // Organization boundary check
      if (client.organizationId && client.organizationId !== telemetry.organizationId) {
        return;
      }

      // Spatial filters
      if (
        client.subscribedFacilityId &&
        client.subscribedFacilityId !== telemetry.facilityId
      ) {
        return;
      }

      if (
        client.subscribedRoomId &&
        telemetry.roomId &&
        client.subscribedRoomId !== telemetry.roomId
      ) {
        return;
      }

      client.send(payload);
    });
  }

  /**
   * Broadcast event packet to authorized connected clients.
   */
  static broadcastEvent(event: SentinelEvent, messageType: string = 'EVENT'): void {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type: messageType,
      data: event,
    });

    this.wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedClient;
      if (client.readyState !== WebSocket.OPEN) return;

      // Organization boundary check
      if (client.organizationId && client.organizationId !== event.organizationId) {
        return;
      }

      // Spatial facility filter
      if (client.subscribedFacilityId && client.subscribedFacilityId !== event.facilityId) {
        return;
      }

      // Spatial room filter
      if (client.subscribedRoomId && event.roomId && client.subscribedRoomId !== event.roomId) {
        return;
      }

      client.send(payload);
    });
  }

  /**
   * Broadcast automation execution log to authorized connected clients.
   */
  static broadcastAutomationExecution(execution: AutomationExecution): void {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type: 'AUTOMATION_EXECUTION',
      data: execution,
    });

    this.wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedClient;
      if (client.readyState !== WebSocket.OPEN) return;

      // Organization boundary check
      if (client.organizationId && client.organizationId !== execution.organizationId) {
        return;
      }

      // Spatial facility filter
      if (client.subscribedFacilityId && client.subscribedFacilityId !== execution.facilityId) {
        return;
      }

      // Spatial room filter
      if (client.subscribedRoomId && execution.roomId && client.subscribedRoomId !== execution.roomId) {
        return;
      }

      client.send(payload);
    });
  }

  /**
   * Broadcast alert incident packet to authorized connected clients.
   */
  static broadcastAlert(alert: Alert, messageType: string = 'ALERT'): void {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type: messageType,
      data: alert,
    });

    this.wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedClient;
      if (client.readyState !== WebSocket.OPEN) return;

      // Organization boundary check
      if (client.organizationId && client.organizationId !== alert.organizationId) {
        return;
      }

      // Spatial facility filter
      if (client.subscribedFacilityId && client.subscribedFacilityId !== alert.facilityId) {
        return;
      }

      // Spatial room filter
      if (client.subscribedRoomId && alert.roomId && client.subscribedRoomId !== alert.roomId) {
        return;
      }

      client.send(payload);
    });
  }

  static close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
