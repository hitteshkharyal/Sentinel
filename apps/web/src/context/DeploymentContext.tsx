// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Center Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  CreateDeploymentDTO,
  Deployment,
  DeploymentHardwareConfig,
  DeploymentStatus,
  DeploymentTemplate,
  FirmwareBuildArtifact,
  HardwareTestScorecard,
  HardwareValidationResult,
  UpdateDeploymentDTO,
  Device,
  DeviceRegistrationCredentials,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface ProvisionResult {
  deployment: Deployment;
  device: Device;
  credentials: DeviceRegistrationCredentials;
}

interface DeploymentContextType {
  deployments: Deployment[];
  templates: DeploymentTemplate[];
  activeDeployment: Deployment | null;
  latestScorecard: HardwareTestScorecard | null;
  firmwareArtifacts: FirmwareBuildArtifact[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: (industry?: string) => Promise<DeploymentTemplate[]>;
  fetchDeployments: (filter?: {
    industry?: string;
    status?: DeploymentStatus;
    facilityId?: string;
    search?: string;
  }) => Promise<void>;
  getDeploymentById: (id: string) => Promise<Deployment>;
  validateHardware: (config: DeploymentHardwareConfig) => Promise<HardwareValidationResult>;
  createDeployment: (dto: CreateDeploymentDTO) => Promise<Deployment>;
  updateDeployment: (id: string, dto: UpdateDeploymentDTO) => Promise<Deployment>;
  deleteDeployment: (id: string) => Promise<void>;
  generateFirmware: (deploymentId: string, version?: string) => Promise<FirmwareBuildArtifact>;
  fetchFirmwareArtifacts: (deploymentId: string) => Promise<FirmwareBuildArtifact[]>;
  downloadFirmwareZip: (deploymentId: string, artifactId: string) => Promise<void>;
  provisionDevice: (deploymentId: string) => Promise<ProvisionResult>;
  startHardwareTest: (deploymentId: string, simulate?: boolean) => Promise<HardwareTestScorecard>;
  fetchHardwareTestStatus: (deploymentId: string) => Promise<HardwareTestScorecard | null>;
  signOffHardwareTest: (deploymentId: string, sessionId: string, notes?: string) => Promise<HardwareTestScorecard>;
  setActiveDeployment: (deployment: Deployment | null) => void;
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const DeploymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [templates, setTemplates] = useState<DeploymentTemplate[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [latestScorecard, setLatestScorecard] = useState<HardwareTestScorecard | null>(null);
  const [firmwareArtifacts, setFirmwareArtifacts] = useState<FirmwareBuildArtifact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentOrganization) headers['X-Organization-Id'] = currentOrganization.id;
    return headers;
  }, [token, currentOrganization]);

  // Fetch templates
  const fetchTemplates = useCallback(
    async (industry?: string): Promise<DeploymentTemplate[]> => {
      try {
        const url = new URL(`${API_BASE}/deployments/templates`);
        if (industry) url.searchParams.set('industry', industry);
        const res = await fetch(url.toString(), { headers: getHeaders() });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch templates');
        setTemplates(json.data || []);
        return json.data || [];
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        return [];
      }
    },
    [getHeaders]
  );

  // Fetch deployments
  const fetchDeployments = useCallback(
    async (filter?: {
      industry?: string;
      status?: DeploymentStatus;
      facilityId?: string;
      search?: string;
    }) => {
      if (!currentOrganization) return;
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/deployments`);
        if (filter?.industry) url.searchParams.set('industry', filter.industry);
        if (filter?.status) url.searchParams.set('status', filter.status);
        if (filter?.facilityId) url.searchParams.set('facilityId', filter.facilityId);
        if (filter?.search) url.searchParams.set('search', filter.search);

        const res = await fetch(url.toString(), { headers: getHeaders() });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch deployments');
        setDeployments(json.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization, getHeaders]
  );

  // Get deployment by ID
  const getDeploymentById = useCallback(
    async (id: string): Promise<Deployment> => {
      const res = await fetch(`${API_BASE}/deployments/${id}`, {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch deployment');
      setActiveDeployment(json.data);
      return json.data;
    },
    [getHeaders]
  );

  // Validate hardware configuration
  const validateHardware = useCallback(
    async (config: DeploymentHardwareConfig): Promise<HardwareValidationResult> => {
      const res = await fetch(`${API_BASE}/deployments/validate-hardware`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Hardware validation request failed');
      return json.data;
    },
    [getHeaders]
  );

  // Create deployment
  const createDeployment = useCallback(
    async (dto: CreateDeploymentDTO): Promise<Deployment> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/deployments`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(dto),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to create deployment');
        const created = json.data;
        setDeployments((prev) => [created, ...prev]);
        setActiveDeployment(created);
        return created;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  // Update deployment
  const updateDeployment = useCallback(
    async (id: string, dto: UpdateDeploymentDTO): Promise<Deployment> => {
      const res = await fetch(`${API_BASE}/deployments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update deployment');
      const updated = json.data;
      setDeployments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (activeDeployment?.id === id) setActiveDeployment(updated);
      return updated;
    },
    [activeDeployment, getHeaders]
  );

  // Delete deployment
  const deleteDeployment = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/deployments/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to delete deployment');
      setDeployments((prev) => prev.filter((d) => d.id !== id));
      if (activeDeployment?.id === id) setActiveDeployment(null);
    },
    [activeDeployment, getHeaders]
  );

  // Generate dynamic firmware
  const generateFirmware = useCallback(
    async (deploymentId: string, version?: string): Promise<FirmwareBuildArtifact> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/deployments/${deploymentId}/firmware/generate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ version: version || '1.0.0' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Firmware generation failed');
        const artifact: FirmwareBuildArtifact = json.data;
        setFirmwareArtifacts((prev) => [artifact, ...prev]);
        // Update active deployment version
        if (activeDeployment?.id === deploymentId) {
          setActiveDeployment({
            ...activeDeployment,
            latestFirmwareBuildId: artifact.id,
            latestFirmwareVersion: artifact.version,
            status: 'FIRMWARE_GENERATED',
          });
        }
        return artifact;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [activeDeployment, getHeaders]
  );

  // Fetch firmware artifacts for a deployment
  const fetchFirmwareArtifacts = useCallback(
    async (deploymentId: string): Promise<FirmwareBuildArtifact[]> => {
      try {
        const res = await fetch(`${API_BASE}/deployments/${deploymentId}/firmware/artifacts`, {
          headers: getHeaders(),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch firmware artifacts');
        setFirmwareArtifacts(json.data || []);
        return json.data || [];
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        return [];
      }
    },
    [getHeaders]
  );

  // Download firmware zip
  const downloadFirmwareZip = useCallback(
    async (deploymentId: string, artifactId: string): Promise<void> => {
      const res = await fetch(
        `${API_BASE}/deployments/${deploymentId}/firmware/artifacts/${artifactId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-Id': currentOrganization?.id || '',
          },
        }
      );
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `sentinel-firmware-${artifactId.substring(0, 8)}.zip`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    [token, currentOrganization]
  );

  // Provision device
  const provisionDevice = useCallback(
    async (deploymentId: string): Promise<ProvisionResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/deployments/${deploymentId}/provision`, {
          method: 'POST',
          headers: getHeaders(),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Device provisioning failed');
        const result: ProvisionResult = json.data;
        setActiveDeployment(result.deployment);
        setDeployments((prev) =>
          prev.map((d) => (d.id === deploymentId ? result.deployment : d))
        );
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  // Start hardware test
  const startHardwareTest = useCallback(
    async (deploymentId: string, simulate: boolean = false): Promise<HardwareTestScorecard> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/deployments/${deploymentId}/test/start?simulate=${simulate}`,
          {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ simulate }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Test session initialization failed');
        const scorecard: HardwareTestScorecard = json.data;
        setLatestScorecard(scorecard);
        return scorecard;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  // Fetch hardware test status
  const fetchHardwareTestStatus = useCallback(
    async (deploymentId: string): Promise<HardwareTestScorecard | null> => {
      try {
        const res = await fetch(`${API_BASE}/deployments/${deploymentId}/test/status`, {
          headers: getHeaders(),
        });
        const json = await res.json();
        if (!res.ok) return null;
        setLatestScorecard(json.data);
        return json.data;
      } catch {
        return null;
      }
    },
    [getHeaders]
  );

  // Sign off hardware test
  const signOffHardwareTest = useCallback(
    async (
      deploymentId: string,
      sessionId: string,
      notes?: string
    ): Promise<HardwareTestScorecard> => {
      const res = await fetch(`${API_BASE}/deployments/${deploymentId}/test/signoff`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Sign-off failed');
      const scorecard: HardwareTestScorecard = json.data;
      setLatestScorecard(scorecard);
      // Mark active deployment active
      if (activeDeployment?.id === deploymentId) {
        setActiveDeployment({
          ...activeDeployment,
          isReadinessApproved: true,
          status: 'ACTIVE',
        });
      }
      return scorecard;
    },
    [activeDeployment, getHeaders]
  );

  useEffect(() => {
    if (currentOrganization) {
      fetchTemplates();
      fetchDeployments();
    }
  }, [currentOrganization, fetchTemplates, fetchDeployments]);

  return (
    <DeploymentContext.Provider
      value={{
        deployments,
        templates,
        activeDeployment,
        latestScorecard,
        firmwareArtifacts,
        isLoading,
        error,
        fetchTemplates,
        fetchDeployments,
        getDeploymentById,
        validateHardware,
        createDeployment,
        updateDeployment,
        deleteDeployment,
        generateFirmware,
        fetchFirmwareArtifacts,
        downloadFirmwareZip,
        provisionDevice,
        startHardwareTest,
        fetchHardwareTestStatus,
        signOffHardwareTest,
        setActiveDeployment,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
};

export const useDeployment = () => {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
};
