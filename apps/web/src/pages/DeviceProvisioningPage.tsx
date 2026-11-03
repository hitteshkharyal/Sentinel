// ─────────────────────────────────────────────
// SENTINEL Web — Standalone Device Provisioning Page
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import { DeviceProvisioningWizard } from '../components/deployments/DeviceProvisioningWizard';

export const DeviceProvisioningPage: React.FC = () => {
  const { deployments, fetchDeployments } = useDeployment();
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string>('');

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  useEffect(() => {
    if (deployments.length > 0 && !selectedDeploymentId) {
      setSelectedDeploymentId(deployments[0]!.id);
    }
  }, [deployments, selectedDeploymentId]);

  const selectedDeployment = deployments.find((d) => d.id === selectedDeploymentId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          Hardware Node Provisioning
        </h1>
        <p className="text-xs text-text-secondary">
          Exchange zero-trust preshared authentication tokens with ESP32 microcontrollers via Web Serial API or PlatformIO terminal commands.
        </p>
      </div>

      {/* Deployment Selector */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <label className="text-xs font-medium text-text-secondary">Select Deployment Target</label>
        <select
          value={selectedDeploymentId}
          onChange={(e) => setSelectedDeploymentId(e.target.value)}
          className="mt-1 w-full md:w-96 bg-surface-hover border border-border rounded-lg p-2.5 text-xs text-text-primary focus:border-primary outline-none font-semibold block"
        >
          {deployments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.industry.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {selectedDeployment ? (
        <DeviceProvisioningWizard
          deployment={selectedDeployment}
          onProvisioned={() => fetchDeployments()}
        />
      ) : (
        <div className="p-12 text-center bg-surface rounded-xl border border-border text-xs text-text-muted">
          No deployments available. Launch the Deployment Wizard to create one.
        </div>
      )}
    </div>
  );
};
