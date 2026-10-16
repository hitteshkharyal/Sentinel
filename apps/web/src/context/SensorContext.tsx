// ─────────────────────────────────────────────
// SENTINEL Web — Sensor Catalog & Hardware Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  SensorEntity,
  SensorCatalogItem,
  CreateSensorDTO,
  UpdateSensorDTO,
  ConfigureSensorDTO,
  CalibrateSensorDTO,
  SensorFilterQuery,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface SensorContextType {
  catalog: SensorCatalogItem[];
  sensors: SensorEntity[];
  selectedSensor: SensorEntity | null;
  isLoadingCatalog: boolean;
  isLoadingSensors: boolean;
  error: string | null;
  fetchCatalog: () => Promise<void>;
  fetchSensors: (filter?: SensorFilterQuery) => Promise<void>;
  createSensor: (dto: CreateSensorDTO) => Promise<SensorEntity>;
  updateSensor: (id: string, dto: UpdateSensorDTO) => Promise<SensorEntity>;
  configureSensor: (id: string, dto: ConfigureSensorDTO) => Promise<SensorEntity>;
  calibrateSensor: (id: string, dto: CalibrateSensorDTO) => Promise<SensorEntity>;
  deleteSensor: (id: string) => Promise<void>;
  selectSensor: (sensor: SensorEntity | null) => void;
  getCatalogItem: (typeOrModel: string) => SensorCatalogItem | undefined;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [catalog, setCatalog] = useState<SensorCatalogItem[]>([]);
  const [sensors, setSensors] = useState<SensorEntity[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<SensorEntity | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [isLoadingSensors, setIsLoadingSensors] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentOrganization) headers['X-Organization-Id'] = currentOrganization.id;
    return headers;
  }, [token, currentOrganization]);

  // Fetch catalog
  const fetchCatalog = useCallback(async () => {
    if (!token) return;
    setIsLoadingCatalog(true);
    try {
      const res = await fetch(`${API_BASE}/sensors/catalog`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCatalog(json.data);
      }
    } catch (err) {
      console.error('Failed to load sensor catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [token, getHeaders]);

  // Fetch deployed sensors
  const fetchSensors = useCallback(
    async (queryFilter?: SensorFilterQuery) => {
      if (!token || !currentOrganization) return;
      setIsLoadingSensors(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (queryFilter?.facilityId) params.append('facilityId', queryFilter.facilityId);
        if (queryFilter?.roomId) params.append('roomId', queryFilter.roomId);
        if (queryFilter?.deviceId) params.append('deviceId', queryFilter.deviceId);
        if (queryFilter?.sensorType) params.append('sensorType', queryFilter.sensorType);
        if (queryFilter?.category) params.append('category', queryFilter.category);
        if (queryFilter?.status) params.append('status', queryFilter.status);
        if (queryFilter?.enabled !== undefined)
          params.append('enabled', String(queryFilter.enabled));
        if (queryFilter?.q) params.append('q', queryFilter.q);

        const url = `${API_BASE}/sensors${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { headers: getHeaders() });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSensors(json.data);
        } else {
          setError(json.error?.message || 'Failed to fetch sensors');
        }
      } catch (err) {
        console.error('Error fetching sensors:', err);
        setError('Network error while loading sensors.');
      } finally {
        setIsLoadingSensors(false);
      }
    },
    [token, currentOrganization, getHeaders]
  );

  // Auto-fetch on organization switch
  useEffect(() => {
    if (token && currentOrganization) {
      fetchCatalog();
      fetchSensors();
    } else {
      setSensors([]);
      setSelectedSensor(null);
    }
  }, [token, currentOrganization, fetchCatalog, fetchSensors]);

  // Create sensor
  const createSensor = async (dto: CreateSensorDTO): Promise<SensorEntity> => {
    const res = await fetch(`${API_BASE}/sensors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to create sensor');
    }
    const created: SensorEntity = json.data;
    setSensors((prev) => [created, ...prev]);
    return created;
  };

  // Update sensor metadata
  const updateSensor = async (id: string, dto: UpdateSensorDTO): Promise<SensorEntity> => {
    const res = await fetch(`${API_BASE}/sensors/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to update sensor');
    }
    const updated: SensorEntity = json.data;
    setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (selectedSensor?.id === id) setSelectedSensor(updated);
    return updated;
  };

  // Configure hardware
  const configureSensor = async (id: string, dto: ConfigureSensorDTO): Promise<SensorEntity> => {
    const res = await fetch(`${API_BASE}/sensors/${id}/configure`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to configure sensor hardware');
    }
    const updated: SensorEntity = json.data;
    setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (selectedSensor?.id === id) setSelectedSensor(updated);
    return updated;
  };

  // Calibrate sensor
  const calibrateSensor = async (id: string, dto: CalibrateSensorDTO): Promise<SensorEntity> => {
    const res = await fetch(`${API_BASE}/sensors/${id}/calibrate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to apply sensor calibration');
    }
    const updated: SensorEntity = json.data;
    setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (selectedSensor?.id === id) setSelectedSensor(updated);
    return updated;
  };

  // Delete sensor
  const deleteSensor = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/sensors/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to delete sensor');
    }
    setSensors((prev) => prev.filter((s) => s.id !== id));
    if (selectedSensor?.id === id) setSelectedSensor(null);
  };

  const selectSensor = (sensor: SensorEntity | null) => {
    setSelectedSensor(sensor);
  };

  const getCatalogItem = (typeOrModel: string): SensorCatalogItem | undefined => {
    return catalog.find(
      (item) =>
        item.id === typeOrModel ||
        item.sensorType === typeOrModel ||
        item.model.toLowerCase() === typeOrModel.toLowerCase()
    );
  };

  return (
    <SensorContext.Provider
      value={{
        catalog,
        sensors,
        selectedSensor,
        isLoadingCatalog,
        isLoadingSensors,
        error,
        fetchCatalog,
        fetchSensors,
        createSensor,
        updateSensor,
        configureSensor,
        calibrateSensor,
        deleteSensor,
        selectSensor,
        getCatalogItem,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = (): SensorContextType => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};
