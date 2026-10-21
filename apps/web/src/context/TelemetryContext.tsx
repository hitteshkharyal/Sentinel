// ─────────────────────────────────────────────
// SENTINEL Web — Real-Time Telemetry & MQTT Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  TelemetryEntity,
  TelemetryStats,
  TelemetryFilterQuery,
  TelemetryMessage,
  ValidatedTelemetry,
  DeviceCommandResponse,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

export interface LatestSensorSnapshot {
  _id: string;
  deviceId: string;
  sensorType: string;
  model: string;
  interfaceType: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'CALIBRATING';
  facilityId: string;
  roomId?: string;
  lastReading?: {
    value: unknown;
    timestamp: string;
    unit?: string;
    raw?: unknown;
  };
}

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface TelemetryContextType {
  telemetryLogs: ValidatedTelemetry[];
  stats: TelemetryStats | null;
  latestSensors: LatestSensorSnapshot[];
  connectionStatus: WsConnectionStatus;
  isConnected: boolean;
  filter: TelemetryFilterQuery;
  isLoadingLogs: boolean;
  isLoadingStats: boolean;
  error: string | null;
  setFilter: (newFilter: Partial<TelemetryFilterQuery>) => void;
  fetchTelemetryLogs: (customFilter?: TelemetryFilterQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchLatestSensors: () => Promise<void>;
  simulateTelemetry: (
    message: TelemetryMessage,
    token: string
  ) => Promise<ValidatedTelemetry>;
  sendCommand: (payload: {
    deviceId: string;
    command: string;
    params?: Record<string, unknown>;
  }) => Promise<DeviceCommandResponse>;
  clearLogs: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [telemetryLogs, setTelemetryLogs] = useState<ValidatedTelemetry[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [latestSensors, setLatestSensors] = useState<LatestSensorSnapshot[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<WsConnectionStatus>('disconnected');
  const [filter, setFilterState] = useState<TelemetryFilterQuery>({ limit: 50 });
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper for authenticated HTTP headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(currentOrganization ? { 'X-Organization-Id': currentOrganization.id } : {}),
    };
  }, [token, currentOrganization]);

  // ── 1. Fetch Historical Telemetry Logs ──
  const fetchTelemetryLogs = useCallback(
    async (customFilter?: TelemetryFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoadingLogs(true);
      setError(null);
      try {
        const activeFilter = customFilter || filter;
        const queryParams = new URLSearchParams();
        if (activeFilter.facilityId) queryParams.set('facilityId', activeFilter.facilityId);
        if (activeFilter.roomId) queryParams.set('roomId', activeFilter.roomId);
        if (activeFilter.deviceId) queryParams.set('deviceId', activeFilter.deviceId);
        if (activeFilter.validOnly !== undefined)
          queryParams.set('validOnly', String(activeFilter.validOnly));
        if (activeFilter.limit) queryParams.set('limit', String(activeFilter.limit));
        if (activeFilter.page) queryParams.set('page', String(activeFilter.page));

        const res = await fetch(`${API_BASE}/telemetry?${queryParams.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to fetch telemetry logs: ${res.statusText}`);
        }

        const data = await res.json();
        const items: TelemetryEntity[] = data.data || [];

        // Map TelemetryEntity to ValidatedTelemetry structure
        const mappedLogs: ValidatedTelemetry[] = items.map((item) => ({
          id: item.id,
          deviceId: item.deviceId,
          organizationId: item.organizationId,
          facilityId: item.facilityId,
          roomId: item.roomId,
          timestamp: item.timestamp,
          receivedAt: item.receivedAt,
          sensors: item.sensors,
          valid: item.valid,
          validationErrors: item.validationErrors,
          metadata: item.metadata,
        }));

        setTelemetryLogs(mappedLogs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching telemetry';
        setError(msg);
      } finally {
        setIsLoadingLogs(false);
      }
    },
    [token, currentOrganization, filter, getAuthHeaders]
  );

  // ── 2. Fetch Throughput Stats ──
  const fetchStats = useCallback(async () => {
    if (!token || !currentOrganization) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/telemetry/stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch telemetry stats');
      const data = await res.json();
      setStats(data.data);
    } catch {
      // Non-critical, ignore transient stat errors
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, currentOrganization, getAuthHeaders]);

  // ── 3. Fetch Latest Sensor Snapshots ──
  const fetchLatestSensors = useCallback(async () => {
    if (!token || !currentOrganization) return;
    try {
      const res = await fetch(`${API_BASE}/telemetry/latest`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch latest sensors');
      const data = await res.json();
      setLatestSensors(data.data || []);
    } catch {
      // Non-critical
    }
  }, [token, currentOrganization, getAuthHeaders]);

  // ── 4. Direct HTTP Telemetry Ingest (Simulation & Edge Ingest) ──
  const simulateTelemetry = useCallback(
    async (message: TelemetryMessage, deviceToken: string): Promise<ValidatedTelemetry> => {
      const res = await fetch(`${API_BASE}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': deviceToken,
        },
        body: JSON.stringify(message),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to inject telemetry: ${res.statusText}`);
      }

      const validated: ValidatedTelemetry = body.data;

      // Optimistically push into local logs if not already via WS
      setTelemetryLogs((prev) => {
        if (prev.some((p) => p.id === validated.id)) return prev;
        return [validated, ...prev].slice(0, 200);
      });

      // Update counters
      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalMessages: prev.totalMessages + 1,
          validMessages: validated.valid ? prev.validMessages + 1 : prev.validMessages,
          invalidMessages: validated.valid ? prev.invalidMessages : prev.invalidMessages + 1,
          lastMessageAt: validated.receivedAt || new Date().toISOString(),
        };
      });

      return validated;
    },
    []
  );

  // ── 5. Dispatch Cloud Actuator / Configuration Command via MQTT ──
  const sendCommand = useCallback(
    async (payload: {
      deviceId: string;
      command: string;
      params?: Record<string, unknown>;
    }): Promise<DeviceCommandResponse> => {
      const res = await fetch(`${API_BASE}/telemetry/command`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to send command: ${res.statusText}`);
      }

      return body.data;
    },
    [getAuthHeaders]
  );

  // ── 6. Update Filter and WebSocket Subscription ──
  const setFilter = useCallback((newFilter: Partial<TelemetryFilterQuery>) => {
    setFilterState((prev) => {
      const updated = { ...prev, ...newFilter };
      // If WebSocket is open, send updated subscription filter
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'SUBSCRIBE',
            facilityId: updated.facilityId,
            roomId: updated.roomId,
          })
        );
      }
      return updated;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setTelemetryLogs([]);
  }, []);

  // ── 7. WebSocket Gateway Lifecycle ──
  useEffect(() => {
    if (!isAuthenticated || !token || !currentOrganization) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    let isSubscribed = true;

    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');

        // Resolve WS protocol & host from API_BASE or window location
        let wsHost = window.location.host;
        let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        try {
          const parsedApi = new URL(API_BASE);
          wsHost = parsedApi.host;
          wsProtocol = parsedApi.protocol === 'https:' ? 'wss:' : 'ws:';
        } catch {
          // Fall back to window location
        }

        const wsUrl = `${wsProtocol}//${wsHost}/ws/telemetry?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnectionStatus('connected');

          // Send initial spatial subscription matching active filter
          ws.send(
            JSON.stringify({
              type: 'SUBSCRIBE',
              facilityId: filter.facilityId,
              roomId: filter.roomId,
            })
          );

          // Ping interval to keep connection alive
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 30_000);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'TELEMETRY' && parsed.data) {
              const incoming: ValidatedTelemetry = parsed.data;

              // Prepend to telemetry logs (rolling buffer limit 200)
              setTelemetryLogs((prev) => {
                if (prev.some((p) => p.id === incoming.id)) return prev;
                return [incoming, ...prev].slice(0, 200);
              });

              // Dynamically update stats
              setStats((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  totalMessages: prev.totalMessages + 1,
                  validMessages: incoming.valid ? prev.validMessages + 1 : prev.validMessages,
                  invalidMessages: incoming.valid ? prev.invalidMessages : prev.invalidMessages + 1,
                  lastMessageAt: incoming.receivedAt || new Date().toISOString(),
                };
              });

              // Dynamically update sensor snapshot if sensor values present
              if (incoming.sensors) {
                setLatestSensors((prevSensors) =>
                  prevSensors.map((s) => {
                    if (s.deviceId === incoming.deviceId) {
                      // Find matching sensor reading
                      const val = incoming.sensors[s.sensorType as keyof typeof incoming.sensors];
                      if (val !== undefined) {
                        return {
                          ...s,
                          status: 'ONLINE',
                          lastReading: {
                            value: val,
                            timestamp: incoming.timestamp,
                          },
                        };
                      }
                    }
                    return s;
                  })
                );
              }
            }
          } catch {
            // Ignore malformed WS frames
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnectionStatus('error');
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnectionStatus('disconnected');
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Auto-reconnect after 4s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed && isAuthenticated && token) {
              connectWebSocket();
            }
          }, 4000);
        };
      } catch {
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    // Initial load of historical logs, stats, and sensor snapshots
    fetchTelemetryLogs();
    fetchStats();
    fetchLatestSensors();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    token,
    currentOrganization,
    fetchTelemetryLogs,
    fetchStats,
    fetchLatestSensors,
    filter.facilityId,
    filter.roomId,
  ]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetryLogs,
        stats,
        latestSensors,
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        filter,
        isLoadingLogs,
        isLoadingStats,
        error,
        setFilter,
        fetchTelemetryLogs,
        fetchStats,
        fetchLatestSensors,
        simulateTelemetry,
        sendCommand,
        clearLogs,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
