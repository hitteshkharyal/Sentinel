// ─────────────────────────────────────────────
// SENTINEL API — Real-time Telemetry WebSocket Gateway
// ─────────────────────────────────────────────

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { telemetryBus } from './telemetry-validator.js';
import { eventBus } from './event.service.js';
import type { ValidatedTelemetry, AuthTokenPayload, SentinelEvent } from '@sentinel/types';

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
   * Attach WebSocket server to existing HTTP server.
   */
  static init(server: Server): void {
    if (this.wss) return;

    const wss = new WebSocketServer({
      server,
      path: '/ws/telemetry',
    });
    this.wss = wss;

    wss.on('connection', (ws: WebSocket, req) => {
      const client = ws as AuthenticatedClient;
      client.isAlive = true;

      // Extract auth token from URL query string ?token=...
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      const orgIdParam = url.searchParams.get('organizationId');

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
          client.userId = decoded.userId;
          if (orgIdParam) {
            client.organizationId = orgIdParam;
          }
        } catch {
          // Token invalid; client remains unauthenticated until auth message
        }
      }

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('message', (messageBuffer: Buffer) => {
        try {
          const msg = JSON.parse(messageBuffer.toString('utf-8'));
          if (msg.type === 'AUTH') {
            if (msg.token) {
              const decoded = jwt.verify(msg.token, config.jwt.secret) as AuthTokenPayload;
              client.userId = decoded.userId;
              if (msg.organizationId) {
                client.organizationId = msg.organizationId;
              }
              client.send(
                JSON.stringify({
                  type: 'AUTH_SUCCESS',
                  organizationId: client.organizationId,
                })
              );
            }
          } else if (msg.type === 'SUBSCRIBE') {
            client.subscribedFacilityId = msg.facilityId;
            client.subscribedRoomId = msg.roomId;
            client.send(
              JSON.stringify({
                type: 'SUBSCRIBED',
                facilityId: msg.facilityId,
                roomId: msg.roomId,
              })
            );
          }
        } catch {
          // Ignore malformed control frames
        }
      });
    });

    // ── Listen to Telemetry Validation Event Bus ──
    telemetryBus.on('telemetry', (telemetry: ValidatedTelemetry) => {
      this.broadcast(telemetry);
    });

    // ── Listen to Event Intelligence Bus ──
    eventBus.on('event', (event: SentinelEvent) => {
      this.broadcastEvent(event, 'EVENT');
    });

    eventBus.on('event:status', (event: SentinelEvent) => {
      this.broadcastEvent(event, 'EVENT_STATUS');
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
   * Broadcast Sentinel event or status update to authorized connected clients.
   */
  static broadcastEvent(event: SentinelEvent, type: 'EVENT' | 'EVENT_STATUS' = 'EVENT'): void {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type,
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
