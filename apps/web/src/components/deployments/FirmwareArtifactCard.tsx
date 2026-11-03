// ─────────────────────────────────────────────
// SENTINEL Web — Firmware Artifact Card & Flashing Guide
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { FirmwareBuildArtifact } from '@sentinel/types';
import {
  Download,
  Terminal,
  FileCode,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Cpu,
} from 'lucide-react';
import { useDeployment } from '../../context/DeploymentContext';

interface FirmwareArtifactCardProps {
  artifact: FirmwareBuildArtifact;
  deploymentName?: string;
}

export const FirmwareArtifactCard: React.FC<FirmwareArtifactCardProps> = ({
  artifact,
  deploymentName,
}) => {
  const { downloadFirmwareZip } = useDeployment();
  const [copied, setCopied] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const manifest = artifact.manifest;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFirmwareZip(artifact.deploymentId, artifact.id);
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platformioCmd = `# Build and Flash Sentinel Dynamic Firmware
cd sentinel-${manifest.chipModel.toLowerCase() || 'firmware'}
pio run -t upload
pio run -t monitor`;

  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-primary/40 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-text-primary text-base">
                PlatformIO Project v{artifact.version}
              </h4>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {artifact.status}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Deployment: <span className="text-text-primary font-medium">{deploymentName || artifact.deploymentId}</span> • Target: <span className="font-mono text-text-primary">{manifest.chipModel}</span>
            </p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Preparing ZIP...' : 'Download PlatformIO ZIP'}
        </button>
      </div>

      {/* Driver breakdown pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-primary" /> Included Drivers ({manifest.includedDrivers?.length || 0}):
          </span>
          <span className="text-text-muted text-[11px] font-mono">
            Generated: {new Date(artifact.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {manifest.includedDrivers?.map((driver, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/10 text-primary border border-primary/20"
            >
              +{driver}
            </span>
          ))}
          {manifest.excludedDrivers?.map((driver, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-hover text-text-muted border border-border line-through"
            >
              {driver}
            </span>
          ))}
        </div>
      </div>

      {/* Integrity & Actions Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border text-xs text-text-secondary">
        <div className="flex items-center gap-2 font-mono text-[11px] truncate max-w-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-text-muted">SHA256:</span>
          <span className="truncate text-text-secondary">{manifest.integrityHash}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-text-primary text-xs font-medium transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-primary" />
            Flashing Guide
          </button>
          <button
            onClick={() => setShowManifestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-text-primary text-xs font-medium transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            Manifest JSON
          </button>
        </div>
      </div>

      {/* Flashing Instructions Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                Flashing & Upload Instructions
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-text-muted hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-secondary">
              <p>
                1. Extract the downloaded ZIP archive into your workspace folder.
              </p>
              <p>
                2. Connect your ESP32 board to your computer via USB.
              </p>
              <p>
                3. Open terminal in the project directory and execute:
              </p>

              <div className="relative rounded-lg bg-black/80 border border-border p-3 font-mono text-emerald-400 text-xs">
                <pre>{platformioCmd}</pre>
                <button
                  onClick={() => copyToClipboard(platformioCmd)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-surface hover:bg-surface-hover text-text-primary border border-border transition-colors"
                  title="Copy command"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-text-primary space-y-1">
                <p className="font-medium">Zero-Trust Notice:</p>
                <p className="text-text-secondary">
                  The generated code contains NO hardcoded secrets. After flashing, navigate to the <strong>Device Provisioning</strong> tab to link credentials via Web Serial or USB.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Modal */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                firmware-manifest.json
              </h3>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-text-muted hover:text-text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-black/80 border border-border font-mono text-xs text-text-primary max-h-96 overflow-y-auto">
              {JSON.stringify(manifest, null, 2)}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(manifest, null, 2))}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-lg text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
              <button
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
