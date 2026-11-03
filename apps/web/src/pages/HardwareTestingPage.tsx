// ─────────────────────────────────────────────
// SENTINEL Web — Standalone Hardware Diagnostic Testing Console
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import { HardwareTestDashboard } from '../components/deployments/HardwareTestDashboard';

export const HardwareTestingPage: React.FC = () => {
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
          <Activity className="w-5 h-5 text-emerald-400" />
          Hardware & Pipeline Testing Console
        </h1>
        <p className="text-xs text-text-secondary">
          7-point comprehensive pre-flight verification: hardware heartbeat, MQTT broker, sensor validity, telemetry ingestion, rules engine, and alerts.
        </p>
      </div>

      {/* Deployment Selector */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <label className="text-xs font-medium text-text-secondary">Select Deployment to Test</label>
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
        <HardwareTestDashboard
          deployment={selectedDeployment}
          onSignedOff={() => fetchDeployments()}
        />
      ) : (
        <div className="p-12 text-center bg-surface rounded-xl border border-border text-xs text-text-muted">
          No deployments available for testing.
        </div>
      )}
    </div>
  );
};
