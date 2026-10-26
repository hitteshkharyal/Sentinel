// ─────────────────────────────────────────────
// SENTINEL Web — Prediction Layer & Anomaly Detection Context
// Master Prompt Section 41 & Section 48 Day 13
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  PredictionOverview,
  ForecastHorizonHours,
  PredictionFilterQuery,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface PredictionContextType {
  overview: PredictionOverview | null;
  horizonHours: ForecastHorizonHours;
  setHorizonHours: (h: ForecastHorizonHours) => void;
  inputWindow: string;
  setInputWindow: (w: string) => void;
  selectedFacilityId: string | undefined;
  setSelectedFacilityId: (id: string | undefined) => void;
  selectedRoomId: string | undefined;
  setSelectedRoomId: (id: string | undefined) => void;
  isLoading: boolean;
  error: string | null;
  refreshPredictions: () => Promise<void>;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const PredictionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();

  const [overview, setOverview] = useState<PredictionOverview | null>(null);
  const [horizonHours, setHorizonHours] = useState<ForecastHorizonHours>(24);
  const [inputWindow, setInputWindow] = useState<string>('24h');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | undefined>(undefined);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
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
    async (customFilter?: PredictionFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const horizon = customFilter?.horizonHours || horizonHours;
      params.set('horizonHours', String(horizon));

      const win = customFilter?.inputWindow || inputWindow;
      params.set('inputWindow', win);

      const facId =
        customFilter?.facilityId !== undefined ? customFilter.facilityId : selectedFacilityId;
      if (facId) params.set('facilityId', facId);

      const rId = customFilter?.roomId !== undefined ? customFilter.roomId : selectedRoomId;
      if (rId) params.set('roomId', rId);

      try {
        const res = await fetch(`${API_BASE}/predictions/overview?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to load predictions: ${res.statusText}`);
        }

        const json = await res.json();
        if (json.success && json.data) {
          setOverview(json.data);
        } else {
          throw new Error(json.error?.message || 'Invalid response format');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [token, currentOrganization, horizonHours, inputWindow, selectedFacilityId, selectedRoomId, getAuthHeaders]
  );

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      void fetchOverview();
    } else {
      setOverview(null);
    }
  }, [isAuthenticated, currentOrganization, horizonHours, inputWindow, selectedFacilityId, selectedRoomId, fetchOverview]);

  const refreshPredictions = useCallback(async () => {
    await fetchOverview();
  }, [fetchOverview]);

  return (
    <PredictionContext.Provider
      value={{
        overview,
        horizonHours,
        setHorizonHours,
        inputWindow,
        setInputWindow,
        selectedFacilityId,
        setSelectedFacilityId,
        selectedRoomId,
        setSelectedRoomId,
        isLoading,
        error,
        refreshPredictions,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

export function usePrediction(): PredictionContextType {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}
