// ─────────────────────────────────────────────
// SENTINEL Web — Analytics & ESG Digital Twin Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  AnalyticsOverview,
  AnalyticsTimeframe,
  AnalyticsFilterQuery,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface AnalyticsContextType {
  overview: AnalyticsOverview | null;
  timeframe: AnalyticsTimeframe;
  setTimeframe: (tf: AnalyticsTimeframe) => void;
  selectedFacilityId: string | undefined;
  setSelectedFacilityId: (id: string | undefined) => void;
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('24h');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(currentOrganization ? { 'X-Organization-Id': currentOrganization.id } : {}),
    };
  }, [token, currentOrganization]);

  const fetchOverview = useCallback(
    async (customFilter?: AnalyticsFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const tf = customFilter?.timeframe || timeframe;
      params.set('timeframe', tf);

      const facId = customFilter?.facilityId !== undefined ? customFilter.facilityId : selectedFacilityId;
      if (facId) params.set('facilityId', facId);

      try {
        const res = await fetch(`${API_BASE}/analytics/overview?${params.toString()}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || `Failed to fetch analytics: ${res.statusText}`);
        }

        setOverview(body.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [token, currentOrganization, timeframe, selectedFacilityId, getAuthHeaders]
  );

  // Auto-fetch on org or timeframe or facility change
  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchOverview();
    }
  }, [isAuthenticated, currentOrganization, timeframe, selectedFacilityId, fetchOverview]);

  const refreshAnalytics = async () => {
    await fetchOverview();
  };

  return (
    <AnalyticsContext.Provider
      value={{
        overview,
        timeframe,
        setTimeframe,
        selectedFacilityId,
        setSelectedFacilityId,
        isLoading,
        error,
        refreshAnalytics,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
