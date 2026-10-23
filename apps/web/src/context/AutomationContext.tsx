// ─────────────────────────────────────────────
// SENTINEL Web — Autonomous Policy & Automation Engine Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  AutomationRule,
  AutomationExecution,
  AutomationStats,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
  AutomationFilterQuery,
  AutomationExecutionFilterQuery,
  ExecutedAction,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

export type AutomationConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface TestRuleResult {
  matched: boolean;
  conditionsEvaluated: { field: string; passed: boolean }[];
  executedActions: ExecutedAction[];
}

interface AutomationContextType {
  rules: AutomationRule[];
  executions: AutomationExecution[];
  stats: AutomationStats | null;
  totalRules: number;
  totalExecutions: number;
  page: number;
  totalPages: number;
  connectionStatus: AutomationConnectionStatus;
  isConnected: boolean;
  filter: AutomationFilterQuery;
  executionFilter: AutomationExecutionFilterQuery;
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingExecutions: boolean;
  error: string | null;
  setFilter: (newFilter: Partial<AutomationFilterQuery>) => void;
  setExecutionFilter: (newFilter: Partial<AutomationExecutionFilterQuery>) => void;
  clearFilters: () => void;
  fetchRules: (customFilter?: AutomationFilterQuery) => Promise<void>;
  fetchExecutions: (customFilter?: AutomationExecutionFilterQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  createRule: (rule: CreateAutomationRuleDTO) => Promise<AutomationRule>;
  updateRule: (id: string, rule: UpdateAutomationRuleDTO) => Promise<AutomationRule>;
  toggleRule: (id: string) => Promise<AutomationRule>;
  deleteRule: (id: string) => Promise<void>;
  testRule: (payload: {
    ruleId?: string;
    rule?: CreateAutomationRuleDTO;
    syntheticEvent: {
      eventType: string;
      severity?: string;
      roomId?: string;
      facilityId?: string;
      confidence?: number;
      inputSignals?: Record<string, unknown>;
    };
  }) => Promise<TestRuleResult>;
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const AutomationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [totalRules, setTotalRules] = useState<number>(0);
  const [totalExecutions, setTotalExecutions] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [connectionStatus, setConnectionStatus] = useState<AutomationConnectionStatus>('disconnected');

  const [filter, setFilterState] = useState<AutomationFilterQuery>({ limit: 50, page: 1 });
  const [executionFilter, setExecutionFilterState] = useState<AutomationExecutionFilterQuery>({
    limit: 50,
    page: 1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // ── 1. Fetch Rules ──
  const fetchRules = useCallback(
    async (customFilter?: AutomationFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoading(true);
      setError(null);

      const activeFilter = customFilter || filter;
      const params = new URLSearchParams();

      if (activeFilter.facilityId) params.append('facilityId', activeFilter.facilityId);
      if (activeFilter.roomId) params.append('roomId', activeFilter.roomId);
      if (activeFilter.triggerEventType) params.append('triggerEventType', activeFilter.triggerEventType);
      if (activeFilter.enabled !== undefined) params.append('enabled', String(activeFilter.enabled));
      if (activeFilter.search) params.append('search', activeFilter.search);
      if (activeFilter.page) params.append('page', String(activeFilter.page));
      if (activeFilter.limit) params.append('limit', String(activeFilter.limit));

      try {
        const res = await fetch(`${API_BASE}/automations?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch automation rules (${res.status})`);
        }

        const data = await res.json();
        const payload = data.data;

        setRules(payload.rules || []);
        setTotalRules(payload.total || 0);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error fetching automation rules';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [token, currentOrganization, filter, getAuthHeaders]
  );

  // ── 2. Fetch Executions Audit Trail ──
  const fetchExecutions = useCallback(
    async (customFilter?: AutomationExecutionFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoadingExecutions(true);

      const activeFilter = customFilter || executionFilter;
      const params = new URLSearchParams();

      if (activeFilter.automationId) params.append('automationId', activeFilter.automationId);
      if (activeFilter.facilityId) params.append('facilityId', activeFilter.facilityId);
      if (activeFilter.roomId) params.append('roomId', activeFilter.roomId);
      if (activeFilter.status) params.append('status', activeFilter.status);
      if (activeFilter.startTime) params.append('startTime', activeFilter.startTime);
      if (activeFilter.endTime) params.append('endTime', activeFilter.endTime);
      if (activeFilter.page) params.append('page', String(activeFilter.page));
      if (activeFilter.limit) params.append('limit', String(activeFilter.limit));

      try {
        const res = await fetch(`${API_BASE}/automations/executions?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch automation executions (${res.status})`);
        }

        const data = await res.json();
        const payload = data.data;

        setExecutions(payload.executions || []);
        setTotalExecutions(payload.total || 0);
      } catch (err) {
        console.error('Error fetching automation executions:', err);
      } finally {
        setIsLoadingExecutions(false);
      }
    },
    [token, currentOrganization, executionFilter, getAuthHeaders]
  );

  // ── 3. Fetch Stats ──
  const fetchStats = useCallback(async () => {
    if (!token || !currentOrganization) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/automations/stats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching automation stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, currentOrganization, getAuthHeaders]);

  // ── 4. Create Rule ──
  const createRule = useCallback(
    async (newRule: CreateAutomationRuleDTO): Promise<AutomationRule> => {
      const res = await fetch(`${API_BASE}/automations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newRule),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to create automation rule: ${res.statusText}`);
      }

      const created: AutomationRule = body.data;
      setRules((prev) => [created, ...prev]);
      setTotalRules((prev) => prev + 1);
      void fetchStats();
      return created;
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 5. Update Rule ──
  const updateRule = useCallback(
    async (id: string, patch: UpdateAutomationRuleDTO): Promise<AutomationRule> => {
      const res = await fetch(`${API_BASE}/automations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(patch),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to update automation rule: ${res.statusText}`);
      }

      const updated: AutomationRule = body.data;
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [getAuthHeaders]
  );

  // ── 6. Toggle Rule Enabled State ──
  const toggleRule = useCallback(
    async (id: string): Promise<AutomationRule> => {
      // Optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      );

      try {
        const res = await fetch(`${API_BASE}/automations/${id}/toggle`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || `Failed to toggle rule: ${res.statusText}`);
        }

        const updated: AutomationRule = body.data;
        setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
        void fetchStats();
        return updated;
      } catch (err) {
        // Rollback on failure
        await fetchRules();
        throw err;
      }
    },
    [getAuthHeaders, fetchRules, fetchStats]
  );

  // ── 7. Delete Rule ──
  const deleteRule = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/automations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to delete automation rule: ${res.statusText}`);
      }

      setRules((prev) => prev.filter((r) => r.id !== id));
      setTotalRules((prev) => Math.max(0, prev - 1));
      void fetchStats();
    },
    [getAuthHeaders, fetchStats]
  );

  // ── 8. Test / Simulation Sandbox ──
  const testRule = useCallback(
    async (payload: {
      ruleId?: string;
      rule?: CreateAutomationRuleDTO;
      syntheticEvent: {
        eventType: string;
        severity?: string;
        roomId?: string;
        facilityId?: string;
        confidence?: number;
        inputSignals?: Record<string, unknown>;
      };
    }): Promise<TestRuleResult> => {
      const res = await fetch(`${API_BASE}/automations/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `Failed to execute simulation test: ${res.statusText}`);
      }

      return body.data;
    },
    [getAuthHeaders]
  );

  // ── 9. Set & Clear Filters ──
  const setFilter = useCallback((newFilter: Partial<AutomationFilterQuery>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter, page: 1 }));
  }, []);

  const setExecutionFilter = useCallback((newFilter: Partial<AutomationExecutionFilterQuery>) => {
    setExecutionFilterState((prev) => ({ ...prev, ...newFilter, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ limit: 50, page: 1 });
  }, []);

  // ── 10. Initial Fetch on Auth & Org Change ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchRules();
      void fetchExecutions();
      void fetchStats();
    } else {
      setRules([]);
      setExecutions([]);
      setStats(null);
    }
  }, [isAuthenticated, currentOrganization, fetchRules, fetchExecutions, fetchStats]);

  // ── 11. Re-fetch when Filter Changes ──
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchRules(filter);
    }
  }, [filter, isAuthenticated, currentOrganization, fetchRules]);

  // ── 12. WebSocket Streaming Gateway for Real-Time Execution Logs ──
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

            if (parsed.type === 'AUTOMATION_EXECUTION' && parsed.data) {
              const execution: AutomationExecution = parsed.data;

              // Prepend to executions state (cap to 100)
              setExecutions((prev) => [execution, ...prev.filter((e) => e.id !== execution.id)].slice(0, 100));
              setTotalExecutions((prev) => prev + 1);

              // Update rule execution counters optimistically
              setRules((prev) =>
                prev.map((r) => {
                  if (r.id === execution.automationId) {
                    return {
                      ...r,
                      lastExecutedAt: execution.executedAt,
                      executionCount: (r.executionCount || 0) + 1,
                    };
                  }
                  return r;
                })
              );

              // Update stats
              setStats((prev) => {
                if (!prev) return null;
                const hasHvacEco = execution.actions.some((a) => a.type === 'HVAC_ECO' || a.type === 'LIGHT_OFF');
                const hasVentilation = execution.actions.some((a) => a.type === 'VENTILATION_INCREASE');

                return {
                  ...prev,
                  totalExecutions: prev.totalExecutions + 1,
                  executionsToday: prev.executionsToday + 1,
                  energySetbacksTriggered: prev.energySetbacksTriggered + (hasHvacEco ? 1 : 0),
                  ventilationsTriggered: prev.ventilationsTriggered + (hasVentilation ? 1 : 0),
                };
              });
            }
          } catch {
            // Non-JSON or irrelevant payload
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
  }, [token, currentOrganization, filter.facilityId, filter.roomId]);

  const isConnected = connectionStatus === 'connected';

  return (
    <AutomationContext.Provider
      value={{
        rules,
        executions,
        stats,
        totalRules,
        totalExecutions,
        page,
        totalPages,
        connectionStatus,
        isConnected,
        filter,
        executionFilter,
        isLoading,
        isLoadingStats,
        isLoadingExecutions,
        error,
        setFilter,
        setExecutionFilter,
        clearFilters,
        fetchRules,
        fetchExecutions,
        fetchStats,
        createRule,
        updateRule,
        toggleRule,
        deleteRule,
        testRule,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
};

export const useAutomation = (): AutomationContextType => {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error('useAutomation must be used within an AutomationProvider');
  }
  return context;
};
