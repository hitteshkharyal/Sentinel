// ─────────────────────────────────────────────
// SENTINEL Web — ESP32 Device & Microcontroller Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Device,
  DeviceStats,
  DeviceFilterQuery,
  RegisterDeviceDTO,
  DeviceRegistrationResponse,
  UpdateDeviceDTO,
  DeviceHeartbeatDTO,
  DeviceRegistrationCredentials,
  SensorEntity,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

export interface DeviceConfigResponse {
  deviceId: string;
  mqttConfig: {
    brokerHost: string;
    brokerPort: number;
    clientId: string;
    telemetryTopic: string;
    statusTopic: string;
    commandTopic: string;
    configTopic: string;
  };
  cppHeader: string;
  jsonConfig: Record<string, unknown>;
}

interface DeviceDetailsBundle {
  device: Device;
  sensors: SensorEntity[];
  credentialPrefix?: string;
}

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  selectedDeviceDetails: DeviceDetailsBundle | null;
  deviceStats: DeviceStats | null;
  attachedSensors: SensorEntity[];
  credentialPrefix: string | null;
  isLoadingDevices: boolean;
  isLoadingStats: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  fetchDevices: (filter?: DeviceFilterQuery) => Promise<void>;
  fetchStats: () => Promise<void>;
  getDeviceDetails: (idOrDeviceId: string) => Promise<DeviceDetailsBundle>;
  fetchDeviceDetails: (idOrDeviceId: string) => Promise<DeviceDetailsBundle>;
  registerDevice: (dto: RegisterDeviceDTO) => Promise<DeviceRegistrationResponse>;
  updateDevice: (id: string, dto: UpdateDeviceDTO) => Promise<Device>;
  assignDevice: (id: string, facilityId: string, roomId?: string | null) => Promise<Device>;
  rotateSecret: (id: string, reason?: string) => Promise<DeviceRegistrationCredentials>;
  getDeviceConfig: (id: string) => Promise<DeviceConfigResponse>;
  deleteDevice: (id: string) => Promise<void>;
  sendHeartbeat: (
    deviceId: string,
    secret: string,
    data: DeviceHeartbeatDTO
  ) => Promise<{ success: boolean; status: string; timestamp: string }>;
  simulateHeartbeat: (
    deviceId: string,
    secret: string,
    data: DeviceHeartbeatDTO
  ) => Promise<{ success: boolean; status: string; timestamp: string }>;
  rebootDevice: (id: string) => Promise<void>;
  selectDevice: (device: Device | null) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState<DeviceDetailsBundle | null>(null);
  const [attachedSensors, setAttachedSensors] = useState<SensorEntity[]>([]);
  const [credentialPrefix, setCredentialPrefix] = useState<string | null>(null);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentOrganization) headers['X-Organization-Id'] = currentOrganization.id;
    return headers;
  }, [token, currentOrganization]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!currentOrganization) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/devices/stats`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch device stats.');
      setDeviceStats(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching device stats.';
      setError(msg);
    } finally {
      setIsLoadingStats(false);
    }
  }, [currentOrganization, getHeaders]);

  // Fetch devices with filters
  const fetchDevices = useCallback(
    async (filter?: DeviceFilterQuery) => {
      if (!currentOrganization) return;
      setIsLoadingDevices(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (filter?.facilityId) queryParams.set('facilityId', filter.facilityId);
        if (filter?.roomId) queryParams.set('roomId', filter.roomId);
        if (filter?.status) queryParams.set('status', filter.status);
        if (filter?.chipModel) queryParams.set('chipModel', filter.chipModel);
        if (filter?.search) queryParams.set('search', filter.search);

        const url = `${API_BASE}/devices?${queryParams.toString()}`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch microcontrollers.');
        setDevices(data.data || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error fetching devices.';
        setError(msg);
      } finally {
        setIsLoadingDevices(false);
      }
    },
    [currentOrganization, getHeaders]
  );

  // Initial load on organization change
  useEffect(() => {
    if (currentOrganization) {
      fetchDevices();
      fetchStats();
    } else {
      setDevices([]);
      setSelectedDevice(null);
      setSelectedDeviceDetails(null);
      setDeviceStats(null);
    }
  }, [currentOrganization, fetchDevices, fetchStats]);

  // Get single device with attached sensors
  const getDeviceDetails = useCallback(async (idOrDeviceId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(idOrDeviceId)}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch device details.');

      setSelectedDevice(data.data.device);
      setSelectedDeviceDetails(data.data);
      setAttachedSensors(data.data.sensors || []);
      setCredentialPrefix(data.data.credentialPrefix || null);
      return data.data;
    } finally {
      setIsLoadingDetails(false);
    }
  }, [getHeaders]);

  const fetchDeviceDetails = getDeviceDetails;

  // Register device
  const registerDevice = async (dto: RegisterDeviceDTO): Promise<DeviceRegistrationResponse> => {
    const res = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to register microcontroller.');

    await fetchDevices();
    await fetchStats();
    return data.data;
  };

  // Update device
  const updateDevice = async (id: string, dto: UpdateDeviceDTO): Promise<Device> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to update microcontroller.');

    await fetchDevices();
    await fetchStats();
    if (selectedDevice?.id === id) {
      setSelectedDevice(data.data);
    }
    return data.data;
  };

  // Assign device
  const assignDevice = async (
    id: string,
    facilityId: string,
    roomId?: string | null
  ): Promise<Device> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ facilityId, roomId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to assign microcontroller.');

    await fetchDevices();
    return data.data;
  };

  // Rotate secret
  const rotateSecret = async (
    id: string,
    reason?: string
  ): Promise<DeviceRegistrationCredentials> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/rotate-secret`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to rotate device secret.');

    await fetchDevices();
    return data.data;
  };

  // Get device C++ and MQTT config
  const getDeviceConfig = async (id: string): Promise<DeviceConfigResponse> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/config`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to generate device configuration.');
    return data.data;
  };

  // Delete device
  const deleteDevice = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to delete microcontroller.');

    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
      setAttachedSensors([]);
    }
    await fetchDevices();
    await fetchStats();
  };

  // Send test heartbeat
  const sendHeartbeat = async (
    deviceId: string,
    secret: string,
    data: DeviceHeartbeatDTO
  ): Promise<{ success: boolean; status: string; timestamp: string }> => {
    const res = await fetch(`${API_BASE}/devices/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': secret,
      },
      body: JSON.stringify({
        deviceId,
        ...data,
      }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error?.message || 'Heartbeat rejected by gateway.');

    await fetchDevices();
    await fetchStats();
    return resData.data;
  };

  // Send reboot signal
  const rebootDevice = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/devices/${encodeURIComponent(id)}/reboot`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to dispatch reboot command.');
  };

  const selectDevice = (device: Device | null) => {
    setSelectedDevice(device);
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        selectedDevice,
        selectedDeviceDetails,
        deviceStats,
        attachedSensors,
        credentialPrefix,
        isLoadingDevices,
        isLoadingStats,
        isLoadingDetails,
        error,
        fetchDevices,
        fetchStats,
        getDeviceDetails,
        fetchDeviceDetails,
        registerDevice,
        updateDevice,
        assignDevice,
        rotateSecret,
        getDeviceConfig,
        deleteDevice,
        sendHeartbeat,
        simulateHeartbeat: sendHeartbeat,
        rebootDevice,
        selectDevice,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
