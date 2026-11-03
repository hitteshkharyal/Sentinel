// ─────────────────────────────────────────────
// SENTINEL Web — Standalone Firmware Generator Hub
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import { FirmwareArtifactCard } from '../components/deployments/FirmwareArtifactCard';

export const FirmwareGeneratorPage: React.FC = () => {
  const {
    deployments,
    fetchDeployments,
    firmwareArtifacts,
    fetchFirmwareArtifacts,
    generateFirmware,
  } = useDeployment();

  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0.0');
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  useEffect(() => {
    if (deployments.length > 0 && !selectedDeploymentId) {
      setSelectedDeploymentId(deployments[0]!.id);
    }
  }, [deployments, selectedDeploymentId]);

  useEffect(() => {
    if (selectedDeploymentId) {
      fetchFirmwareArtifacts(selectedDeploymentId);
    }
  }, [selectedDeploymentId, fetchFirmwareArtifacts]);

  const selectedDeployment = deployments.find((d) => d.id === selectedDeploymentId);

  const handleGenerate = async () => {
    if (!selectedDeploymentId) return;
    setGenerating(true);
    try {
      await generateFirmware(selectedDeploymentId, version);
      await fetchFirmwareArtifacts(selectedDeploymentId);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            Dynamic Firmware Generator
          </h1>
          <p className="text-xs text-text-secondary">
            Assemble, compile, and download customized PlatformIO project archives with zero bloat and only required drivers.
          </p>
        </div>
      </div>

      {/* Deployment Selector and Build Controls */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary">Select Deployment</label>
            <select
              value={selectedDeploymentId}
              onChange={(e) => setSelectedDeploymentId(e.target.value)}
              className="mt-1 w-full bg-surface-hover border border-border rounded-lg p-2.5 text-xs text-text-primary focus:border-primary outline-none font-semibold"
            >
              {deployments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.industry.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary">Firmware Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="mt-1 w-full bg-surface-hover border border-border rounded-lg p-2.5 text-xs text-text-primary focus:border-primary outline-none font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDeploymentId}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {generating ? 'Generating PlatformIO Build...' : 'Generate Firmware Archive'}
            </button>
          </div>
        </div>

        {selectedDeployment && (
          <div className="p-3.5 rounded-lg bg-surface-hover border border-border flex flex-wrap items-center gap-4 text-xs text-text-secondary">
            <span>Board: <strong className="font-mono text-text-primary">{selectedDeployment.hardwareConfig.chipModel}</strong></span>
            <span>•</span>
            <span>Sensors: <strong className="text-text-primary">{selectedDeployment.hardwareConfig.sensors.length}</strong></span>
            <span>•</span>
            <span>Actuators: <strong className="text-text-primary">{selectedDeployment.hardwareConfig.actuators.length}</strong></span>
            <span>•</span>
            <span>Device ID: <strong className="font-mono text-cyan-400">{selectedDeployment.deviceId || 'Pending Provisioning'}</strong></span>
          </div>
        )}
      </div>

      {/* Builds History List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Compiled Firmware Artifacts ({firmwareArtifacts.length})
        </h3>

        {firmwareArtifacts.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-xl border border-border text-xs text-text-muted">
            No firmware builds recorded for this deployment yet. Click <strong>Generate Firmware Archive</strong> above.
          </div>
        ) : (
          firmwareArtifacts.map((artifact) => (
            <FirmwareArtifactCard
              key={artifact.id}
              artifact={artifact}
              deploymentName={selectedDeployment?.name}
            />
          ))
        )}
      </div>
    </div>
  );
};
