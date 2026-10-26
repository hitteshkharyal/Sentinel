// ─────────────────────────────────────────────
// SENTINEL Web — Real-Time Alert Engine & Audio Beacon Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Alert,
  AlertStats,
  AlertFilterQuery,
  AlertSeverity,
  CreateAlertDTO,
  UpdateAlertStatusDTO,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import { soundEngine } from '../utils/soundEngine';
import { notificationEngine } from '../utils/notificationEngine';

export type AlertConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface AlertContextType {
  alerts: Alert[];
  stats: AlertStats | null;
  totalAlerts: number;
  page: number;
  totalPages: number;
  connectionStatus: AlertConnectionStatus;
  isConnected: boolean;
  filter: AlertFilterQuery;
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;
  isSoundMuted: boolean;
  soundVolume: number;
  browserNotificationPermission: NotificationPermission;
  setFilter: (newFilter: Partial<AlertFilterQuery>) => void;
  clearFilters: () => void;
  fetchAlerts: (customFilter?: AlertFilterQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  createAlert: (dto: CreateAlertDTO) => Promise<Alert>;
  acknowledgeAlert: (id: string, note?: string) => Promise<Alert>;
  assignAlert: (id: string, assignedToUserId: string, note?: string) => Promise<Alert>;
  updateStatus: (id: string, dto: UpdateAlertStatusDTO) => Promise<Alert>;
  resolveAlert: (id: string, notes?: string) => Promise<Alert>;
  dismissAlert: (id: string, notes?: string) => Promise<Alert>;
  escalateAlert: (id: string, reason?: string) => Promise<Alert>;
  setSoundMuted: (muted: boolean) => void;
  setSoundVolume: (volume: number) => void;
  playTestSound: (severity: AlertSeverity | 'RESOLVED') => void;
  requestBrowserNotificationPermission: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<AlertConnectionStatus>('disconnected');

  const [filter, setFilterState] = useState<AlertFilterQuery>({ limit: 50, page: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Beacon & Native Notification state
  const [isSoundMuted, setIsSoundMutedState] = useState<boolean>(soundEngine.getIsMuted());
  const [soundVolume, setSoundVolumeState] = useState<number>(soundEngine.getVolume());
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>(
    notificationEngine.getPermission()
  );

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper for authenticated HTTP headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(currentOrganization ? { 'X-Organization-Id': currentOrganization.id } : {}),
    };
  }, [token, currentOrganization]);

  // ── 1. Fetch Paginated Alerts ──
  const fetchAlerts = useCallback(
    async (customFilter?: AlertFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoading(true);
      setError(null);

      const activeFilter = customFilter || filter;
      const params = new URLSearchParams();

      if (activeFilter.facilityId) params.append('facilityId', activeFilter.facilityId);
      if (activeFilter.roomId) params.append('roomId', activeFilter.roomId);
      if (activeFilter.deviceId) params.append('deviceId', activeFilter.deviceId);
      if (activeFilter.severity) params.append('severity', activeFilter.severity);
      if (activeFilter.status) params.append('status', activeFilter.status);
      if (activeFilter.assignedTo) params.append('assignedTo', activeFilter.assignedTo);
      if (activeFilter.isEscalated !== undefined) params.append('isEscalated', String(activeFilter.isEscalated));
      if (activeFilter.search) params.append('search', activeFilter.search);
      if (activeFilter.page) params.append('page', String(activeFilter.page));
      if (activeFilter.limit) params.append('limit', String(activeFilter.limit));

      try {
        const res = await fetch(`${API_BASE}/alerts?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch alerts (${res.status})`);
        }

        const data = await res.json();
        const payload = data.data;

        setAlerts(payload.alerts || []);
        setTotalAlerts(payload.total || 0);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching alerts';
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
      const res = await fetch(`${API_BASE}/alerts/stats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching alert stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, currentOrganization, getAuthHeaders]);

  // ── 3. Create Alert ──
  const createAlert = useCallback(
    async (dto: CreateAlertDTO): Promise<Alert> => {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to create alert: ${res.statusText}`);
      }

      const created: Alert = body.data;
      setAlerts((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      void fetchStats();
      return created;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 4. Acknowledge Alert ──
  const acknowledgeAlert = useCallback(
    async (id: string, note?: string): Promise<Alert> => {
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );

      const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        void fetchAlerts();
        throw new Error(body.message || `Failed to acknowledge alert: ${res.statusText}`);
      }

      const updated: Alert = body.data;
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      void fetchStats();
      return updated;
    },
    [getAuthHeaders, fetchAlerts, fetchStats]
  );

  // ── 5. Assign Alert ──
  const assignAlert = useCallback(
    async (id: string, assignedToUserId: string, note?: string): Promise<Alert> => {
      const res = await fetch(`${API_BASE}/alerts/${id}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignedTo: assignedToUserId, note }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to assign alert: ${res.statusText}`);
      }

      const updated: Alert = body.data;
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      void fetchStats();
      return updated;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 6. Update Status (IN_PROGRESS, RESOLVED, DISMISSED) ──
  const updateStatus = useCallback(
    async (id: string, dto: UpdateAlertStatusDTO): Promise<Alert> => {
      const res = await fetch(`${API_BASE}/alerts/${id}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update alert status: ${res.statusText}`);
      }

      const updated: Alert = body.data;
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      void fetchStats();
      return updated;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 7. Resolve Alert ──
  const resolveAlert = useCallback(
    async (id: string, notes?: string): Promise<Alert> => {
      return await updateStatus(id, {
        status: 'RESOLVED',
        resolutionNotes: notes,
      });
    },
    [updateStatus]
  );

  // ── 8. Dismiss Alert ──
  const dismissAlert = useCallback(
    async (id: string, notes?: string): Promise<Alert> => {
      return await updateStatus(id, {
        status: 'DISMISSED',
        note: notes,
      });
    },
    [updateStatus]
  );

  // ── 9. Escalate Alert ──
  const escalateAlert = useCallback(
    async (id: string, reason?: string): Promise<Alert> => {
      const res = await fetch(`${API_BASE}/alerts/${id}/escalate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to escalate alert: ${res.statusText}`);
      }

      const updated: Alert = body.data;
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      void fetchStats();
      return updated;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 10. Sound & Notification Controls ──
  const setSoundMuted = useCallback((muted: boolean) => {
    soundEngine.setIsMuted(muted);
    setIsSoundMutedState(muted);
  }, []);

  const setSoundVolume = useCallback((volume: number) => {
    soundEngine.setVolume(volume);
    setSoundVolumeState(volume);
  }, []);

  const playTestSound = useCallback((severity: AlertSeverity | 'RESOLVED') => {
    soundEngine.playTestSound(severity);
  }, []);

  const requestBrowserNotificationPermission = useCallback(async () => {
    const permission = await notificationEngine.requestPermission();
    setBrowserNotificationPermission(permission);
  }, []);

  // ── 11. Set & Clear Filters ──
  const setFilter = useCallback((newFilter: Partial<AlertFilterQuery>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ limit: 50, page: 1 });
  }, []);

  // ── 12. Initial Fetch on Auth & Org Change ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchAlerts();
      void fetchStats();
    } else {
      setAlerts([]);
      setStats(null);
    }
  }, [isAuthenticated, currentOrganization, fetchAlerts, fetchStats]);

  // ── 13. Re-fetch when Filter Changes ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchAlerts(filter);
    }
  }, [filter, isAuthenticated, currentOrganization, fetchAlerts]);

  // ── 14. Real-Time WebSocket Gateway for Alert Incidents ──
  useEffect(() => {
    let isSubscribed = true;

    if (!token || !currentOrganization) {
      setConnectionStatus('disconnected');
      return;
    }

    const connectWs = () => {
      try {
        setConnectionStatus('connecting');

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

            // 🚨 1. Incoming New Alert
            if (parsed.type === 'ALERT_CREATED' && parsed.data) {
              const alert: Alert = parsed.data;

              // Prepend to alerts list
              setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
              setTotalAlerts((prev) => prev + 1);

              // Sound beacon for HIGH or CRITICAL
              if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
                soundEngine.playAlertSound(alert.severity, alert.id);
                notificationEngine.dispatchAlert(alert);
              }

              void fetchStats();
            }

            // ⚠️ 2. Incoming Alert Escalation
            if (parsed.type === 'ALERT_ESCALATED' && parsed.data) {
              const alert: Alert = parsed.data;
              setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));

              // Sound urgent escalation alarm
              soundEngine.playAlertSound('CRITICAL', `${alert.id}-escalated`);
              notificationEngine.dispatchAlert(alert);
              void fetchStats();
            }

            // 🔄 3. Alert Updated or Resolved
            if ((parsed.type === 'ALERT_UPDATED' || parsed.type === 'ALERT_RESOLVED') && parsed.data) {
              const alert: Alert = parsed.data;
              setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));

              if (parsed.type === 'ALERT_RESOLVED') {
                soundEngine.playTestSound('RESOLVED');
              }
              void fetchStats();
            }
          } catch {
            // Ignore non-JSON
          }
        };

        ws.onerror = () => {
          if (!isSubscribed) return;
          setConnectionStatus('error');
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setConnectionStatus('disconnected');
        };
      } catch {
        setConnectionStatus('error');
      }
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, currentOrganization, filter.facilityId, filter.roomId, fetchStats]);

  const isConnected = connectionStatus === 'connected';

  return (
    <AlertContext.Provider
      value={{
        alerts,
        stats,
        totalAlerts,
        page,
        totalPages,
        connectionStatus,
        isConnected,
        filter,
        isLoading,
        isLoadingStats,
        error,
        isSoundMuted,
        soundVolume,
        browserNotificationPermission,
        setFilter,
        clearFilters,
        fetchAlerts,
        fetchStats,
        createAlert,
        acknowledgeAlert,
        assignAlert,
        updateStatus,
        resolveAlert,
        dismissAlert,
        escalateAlert,
        setSoundMuted,
        setSoundVolume,
        playTestSound,
        requestBrowserNotificationPermission,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
