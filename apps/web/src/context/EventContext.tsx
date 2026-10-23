// ─────────────────────────────────────────────
// SENTINEL Web — Real-Time Sensor Fusion & Event Intelligence Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  SentinelEvent,
  EventStats,
  EventFilterQuery,
  EventStatus,
  OccupancySnapshot,
  TelemetrySensorData,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

export type EventConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface EventContextType {
  events: SentinelEvent[];
  stats: EventStats | null;
  totalEvents: number;
  page: number;
  totalPages: number;
  connectionStatus: EventConnectionStatus;
  isConnected: boolean;
  filter: EventFilterQuery;
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;
  setFilter: (newFilter: Partial<EventFilterQuery>) => void;
  fetchEvents: (customFilter?: EventFilterQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  acknowledgeEvent: (id: string, notes?: string) => Promise<SentinelEvent>;
  resolveEvent: (id: string, notes?: string) => Promise<SentinelEvent>;
  dismissEvent: (id: string, notes?: string) => Promise<SentinelEvent>;
  evaluateSimulation: (
    roomId: string,
    signals: TelemetrySensorData,
    deviceId?: string
  ) => Promise<{ occupancy: OccupancySnapshot; events: SentinelEvent[] }>;
  clearFilters: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [events, setEvents] = useState<SentinelEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<EventConnectionStatus>('disconnected');
  const [filter, setFilterState] = useState<EventFilterQuery>({ limit: 50, page: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // ── 1. Fetch Paginated Events ──
  const fetchEvents = useCallback(
    async (customFilter?: EventFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoading(true);
      setError(null);

      const activeFilter = customFilter || filter;
      const params = new URLSearchParams();

      if (activeFilter.facilityId) params.append('facilityId', activeFilter.facilityId);
      if (activeFilter.roomId) params.append('roomId', activeFilter.roomId);
      if (activeFilter.deviceId) params.append('deviceId', activeFilter.deviceId);
      if (activeFilter.eventType) params.append('eventType', activeFilter.eventType);
      if (activeFilter.severity) params.append('severity', activeFilter.severity);
      if (activeFilter.status) params.append('status', activeFilter.status);
      if (activeFilter.startTime) params.append('startTime', activeFilter.startTime);
      if (activeFilter.endTime) params.append('endTime', activeFilter.endTime);
      if (activeFilter.search) params.append('search', activeFilter.search);
      if (activeFilter.page) params.append('page', String(activeFilter.page));
      if (activeFilter.limit) params.append('limit', String(activeFilter.limit));

      try {
        const res = await fetch(`${API_BASE}/events?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch events (${res.status})`);
        }

        const data = await res.json();
        const payload = data.data;

        setEvents(payload.events || []);
        setTotalEvents(payload.total || 0);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching events';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [token, currentOrganization, filter, getAuthHeaders]
  );

  // ── 2. Fetch Aggregate Stats ──
  const fetchStats = useCallback(async () => {
    if (!token || !currentOrganization) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/events/stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch event stats');
      const data = await res.json();
      setStats(data.data);
    } catch {
      // Non-critical, ignore transient stat errors
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, currentOrganization, getAuthHeaders]);

  // ── 3. Mutate Event Lifecycle (Acknowledge, Resolve, Dismiss) ──
  const updateStatus = useCallback(
    async (id: string, status: EventStatus, notes?: string): Promise<SentinelEvent> => {
      const res = await fetch(`${API_BASE}/events/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update event status: ${res.statusText}`);
      }

      const updated: SentinelEvent = body.data;

      // Update local state immediately
      setEvents((prev) => prev.map((ev) => (ev.id === id ? updated : ev)));

      // Trigger stats refresh
      void fetchStats();

      return updated;
    },
    [getAuthHeaders, fetchStats]
  );

  const acknowledgeEvent = useCallback(
    (id: string, notes?: string) => updateStatus(id, 'ACKNOWLEDGED', notes),
    [updateStatus]
  );

  const resolveEvent = useCallback(
    (id: string, notes?: string) => updateStatus(id, 'RESOLVED', notes),
    [updateStatus]
  );

  const dismissEvent = useCallback(
    (id: string, notes?: string) => updateStatus(id, 'DISMISSED', notes),
    [updateStatus]
  );

  // ── 4. Authoritative Test Simulation / Injection ──
  const evaluateSimulation = useCallback(
    async (
      roomId: string,
      signals: TelemetrySensorData,
      deviceId?: string
    ): Promise<{ occupancy: OccupancySnapshot; events: SentinelEvent[] }> => {
      const res = await fetch(`${API_BASE}/events/evaluate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          roomId,
          deviceId,
          signals,
          timestamp: new Date().toISOString(),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to evaluate simulation: ${res.statusText}`);
      }

      const result = body.data;

      // Optimistically prepend generated events
      if (result.events && result.events.length > 0) {
        setEvents((prev) => {
          const newEvents = result.events.filter(
            (ne: SentinelEvent) => !prev.some((pe) => pe.id === ne.id)
          );
          return [...newEvents, ...prev].slice(0, 200);
        });
        void fetchStats();
      }

      return result;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 5. Set & Clear Filters ──
  const setFilter = useCallback((newFilter: Partial<EventFilterQuery>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ limit: 50, page: 1 });
  }, []);

  // ── 6. Initial Fetch on Auth & Org Change ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchEvents();
      void fetchStats();
    } else {
      setEvents([]);
      setStats(null);
    }
  }, [isAuthenticated, currentOrganization, fetchEvents, fetchStats]);

  // ── 7. Re-fetch when Filter Changes ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchEvents(filter);
    }
  }, [filter, isAuthenticated, currentOrganization, fetchEvents]);

  // ── 8. Real-Time WebSocket Gateway for Live Event Streaming ──
  useEffect(() => {
    let isSubscribed = true;

    if (!token || !currentOrganization) {
      setConnectionStatus('disconnected');
      return;
    }

    const connectWs = () => {
      try {
        setConnectionStatus('connecting');

        // Resolve WS URL from API base
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let wsHost = window.location.host;
        try {
          const apiObj = new URL(API_BASE);
          wsHost = apiObj.host;
        } catch {
          // Fallback to current host
        }

        const wsUrl = `${wsProtocol}//${wsHost}/ws/telemetry?token=${encodeURIComponent(
          token
        )}&organizationId=${encodeURIComponent(currentOrganization.id)}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setConnectionStatus('connected');

          // Send spatial subscription
          ws.send(
            JSON.stringify({
              type: 'SUBSCRIBE',
              facilityId: filter.facilityId,
              roomId: filter.roomId,
            })
          );

          // Ping keepalive
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 30_000);
        };

        ws.onmessage = (msgEvent) => {
          if (!isSubscribed) return;
          try {
            const parsed = JSON.parse(msgEvent.data);

            if (parsed.type === 'EVENT' && parsed.data) {
              const incoming: SentinelEvent = parsed.data;

              // Prepend to event stream
              setEvents((prev) => {
                if (prev.some((p) => p.id === incoming.id)) {
                  return prev.map((p) => (p.id === incoming.id ? incoming : p));
                }
                return [incoming, ...prev].slice(0, 200);
              });

              setTotalEvents((prev) => prev + 1);

              // Update stats
              setStats((prev) => {
                if (!prev) return null;
                const isCritical = incoming.severity === 'CRITICAL';
                return {
                  ...prev,
                  totalEvents: prev.totalEvents + 1,
                  activeEvents: prev.activeEvents + 1,
                  criticalEvents: isCritical ? prev.criticalEvents + 1 : prev.criticalEvents,
                };
              });
            } else if (parsed.type === 'EVENT_STATUS' && parsed.data) {
              const updated: SentinelEvent = parsed.data;

              setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));

              // Trigger stats refresh
              void fetchStats();
            }
          } catch {
            // Ignore malformed frames
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnectionStatus('error');
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnectionStatus('disconnected');

          // Attempt reconnection after 5 seconds
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) connectWs();
          }, 5000);
        };
      } catch {
        setConnectionStatus('error');
      }
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, currentOrganization, filter.facilityId, filter.roomId, fetchStats]);

  const isConnected = connectionStatus === 'connected';

  return (
    <EventContext.Provider
      value={{
        events,
        stats,
        totalEvents,
        page,
        totalPages,
        connectionStatus,
        isConnected,
        filter,
        isLoading,
        isLoadingStats,
        error,
        setFilter,
        fetchEvents,
        fetchStats,
        acknowledgeEvent,
        resolveEvent,
        dismissEvent,
        evaluateSimulation,
        clearFilters,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
