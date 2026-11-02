// ─────────────────────────────────────────────
// SENTINEL Web — Security & Zero-Trust Context (Day 16)
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import type {
  SecurityOverviewMetrics,
  SecurityAuditLog,
  SecurityAuditScanResult,
  SecurityAuditLogFilterDto,
  ApiResponse,
} from '@sentinel/types';

interface SecurityContextType {
  overview: SecurityOverviewMetrics | null;
  auditLogs: SecurityAuditLog[];
  auditMeta: { page: number; limit: number; total: number; totalPages: number } | null;
  recentThreats: SecurityAuditLog[];
  lastScanResult: SecurityAuditScanResult | null;
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
  fetchOverview: () => Promise<void>;
  fetchAuditLogs: (filter?: SecurityAuditLogFilterDto) => Promise<void>;
  fetchRecentThreats: () => Promise<void>;
  runSecurityScan: () => Promise<SecurityAuditScanResult | null>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [overview, setOverview] = useState<SecurityOverviewMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [recentThreats, setRecentThreats] = useState<SecurityAuditLog[]>([]);
  const [lastScanResult, setLastScanResult] = useState<SecurityAuditScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentOrganization) headers['X-Organization-Id'] = currentOrganization.id;
    return headers;
  }, [token, currentOrganization]);

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/security/overview', {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<SecurityOverviewMetrics> = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error('[SecurityContext] Failed to fetch overview:', err);
    }
  }, [token, getHeaders]);

  const fetchAuditLogs = useCallback(
    async (filter: SecurityAuditLogFilterDto = {}) => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (filter.page) queryParams.set('page', String(filter.page));
        if (filter.limit) queryParams.set('limit', String(filter.limit));
        if (filter.severity) queryParams.set('severity', filter.severity);
        if (filter.action) queryParams.set('action', filter.action);
        if (filter.actorType) queryParams.set('actorType', filter.actorType);
        if (filter.status) queryParams.set('status', filter.status);

        const res = await fetch(`/api/v1/security/audit-logs?${queryParams.toString()}`, {
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse<SecurityAuditLog[]> = await res.json();
        if (json.success && json.data) {
          setAuditLogs(json.data);
          if (json.meta) {
            setAuditMeta({
              page: json.meta.page,
              limit: json.meta.limit,
              total: json.meta.total,
              totalPages: json.meta.totalPages,
            });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to query security audit logs';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [token, getHeaders]
  );

  const fetchRecentThreats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/security/threats', {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<SecurityAuditLog[]> = await res.json();
      if (json.success && json.data) {
        setRecentThreats(json.data);
      }
    } catch (err) {
      console.error('[SecurityContext] Failed to fetch recent threats:', err);
    }
  }, [token, getHeaders]);

  const runSecurityScan = useCallback(async (): Promise<SecurityAuditScanResult | null> => {
    if (!token || !currentOrganization) return null;
    setIsScanning(true);
    try {
      const res = await fetch('/api/v1/security/run-audit', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ deepScan: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<SecurityAuditScanResult> = await res.json();
      if (json.success && json.data) {
        setLastScanResult(json.data);
        // Refresh overview and logs
        void fetchOverview();
        void fetchAuditLogs();
        return json.data;
      }
      return null;
    } catch (err) {
      console.error('[SecurityContext] Security scan failed:', err);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [token, currentOrganization, getHeaders, fetchOverview, fetchAuditLogs]);

  useEffect(() => {
    if (token) {
      void fetchOverview();
      void fetchAuditLogs();
      void fetchRecentThreats();
    }
  }, [token, currentOrganization, fetchOverview, fetchAuditLogs, fetchRecentThreats]);

  return (
    <SecurityContext.Provider
      value={{
        overview,
        auditLogs,
        auditMeta,
        recentThreats,
        lastScanResult,
        isLoading,
        isScanning,
        error,
        fetchOverview,
        fetchAuditLogs,
        fetchRecentThreats,
        runSecurityScan,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

