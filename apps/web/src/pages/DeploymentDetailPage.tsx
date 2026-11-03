// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Detail & Management Console
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  FileCode,
  Wrench,
  CheckCircle2,
  Activity,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import { PinMappingVisualizer } from '../components/deployments/PinMappingVisualizer';
import { FirmwareArtifactCard } from '../components/deployments/FirmwareArtifactCard';
import { DeviceProvisioningWizard } from '../components/deployments/DeviceProvisioningWizard';
import { HardwareTestDashboard } from '../components/deployments/HardwareTestDashboard';

export const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getDeploymentById,
    activeDeployment,
    generateFirmware,
    fetchFirmwareArtifacts,
    firmwareArtifacts,
    isLoading,
  } = useDeployment();

  const [activeTab, setActiveTab] = useState<'overview' | 'firmware' | 'provision' | 'test'>('overview');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      getDeploymentById(id);
      fetchFirmwareArtifacts(id);
    }
  }, [id, getDeploymentById, fetchFirmwareArtifacts]);

  if (isLoading || !activeDeployment) {
    return (
      <div className="p-12 text-center text-xs text-text-muted">
        Loading deployment console...
      </div>
    );
  }

  const handleGenerateBuild = async () => {
    setGenerating(true);
    try {
      const nextVer = `1.${firmwareArtifacts.length}.0`;
      await generateFirmware(activeDeployment.id, nextVer);
      await fetchFirmwareArtifacts(activeDeployment.id);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/deployments')}
            className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
            title="Back to Deployments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {activeDeployment.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeDeployment.status}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Industry: <span className="uppercase text-text-primary font-medium">{activeDeployment.industry}</span> • Use Case: <span className="text-text-primary font-medium">{activeDeployment.useCaseName}</span> • Facility: <span className="text-text-primary font-medium">{activeDeployment.facilityName || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('firmware')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg text-xs font-semibold text-text-primary transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            Firmware Generator
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Activity className="w-4 h-4" />
            Testing Console
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6 text-xs font-semibold">
        {[
          { key: 'overview' as const, label: 'Overview & Hardware', icon: <Cpu className="w-4 h-4" /> },
          { key: 'firmware' as const, label: 'Dynamic Firmware Generator', icon: <FileCode className="w-4 h-4" /> },
          { key: 'provision' as const, label: 'Device Provisioning', icon: <Wrench className="w-4 h-4" /> },
          { key: 'test' as const, label: 'Hardware Diagnostic Scorecard', icon: <CheckCircle2 className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 pb-3 transition-colors border-b-2 ${
              activeTab === t.key
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & HARDWARE MATRIX */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-sm">
              <span className="text-xs text-text-muted">Target Microcontroller</span>
              <p className="font-mono font-bold text-text-primary text-base">
                {activeDeployment.hardwareConfig.chipModel}
              </p>
              <p className="text-[11px] text-text-secondary">38-pin DevKit architecture</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-sm">
              <span className="text-xs text-text-muted">Target Device ID</span>
              <p className="font-mono font-bold text-cyan-400 text-base">
                {activeDeployment.deviceId || 'Unprovisioned Node'}
              </p>
              <p className="text-[11px] text-text-secondary">Assigned hardware node</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1 shadow-sm">
              <span className="text-xs text-text-muted">Production Verification</span>
              <p className="font-bold text-base flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                {activeDeployment.isReadinessApproved ? 'Approved for Production' : 'Pending Verification'}
              </p>
              <p className="text-[11px] text-text-secondary">Scorecard diagnostic readiness</p>
            </div>
          </div>

          <PinMappingVisualizer
            hardwareConfig={activeDeployment.hardwareConfig}
          />
        </div>
      )}

      {/* TAB 2: FIRMWARE GENERATOR */}
      {activeTab === 'firmware' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                Modular Firmware Builder
              </h3>
              <p className="text-xs text-text-secondary">
                Generates a standalone PlatformIO project bundling <strong>only</strong> the drivers selected for this deployment.
              </p>
            </div>

            <button
              onClick={handleGenerateBuild}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {generating ? 'Compiling Build...' : 'Generate New Build'}
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Generated Builds ({firmwareArtifacts.length})
            </h4>

            {firmwareArtifacts.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-xl border border-border text-xs text-text-muted">
                No firmware builds compiled yet. Click <strong>Generate New Build</strong> above to assemble your project.
              </div>
            ) : (
              firmwareArtifacts.map((artifact) => (
                <FirmwareArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  deploymentName={activeDeployment.name}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEVICE PROVISIONING */}
      {activeTab === 'provision' && (
        <DeviceProvisioningWizard
          deployment={activeDeployment}
          onProvisioned={() => getDeploymentById(activeDeployment.id)}
        />
      )}

      {/* TAB 4: HARDWARE TESTING SCORECARD */}
      {activeTab === 'test' && (
        <HardwareTestDashboard
          deployment={activeDeployment}
          onSignedOff={() => getDeploymentById(activeDeployment.id)}
        />
      )}
    </div>
  );
};
