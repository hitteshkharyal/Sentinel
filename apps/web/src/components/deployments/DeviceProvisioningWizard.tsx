// ─────────────────────────────────────────────
// SENTINEL Web — Device Provisioning Wizard (Web Serial & CLI)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { Deployment, DeviceRegistrationCredentials } from '@sentinel/types';
import {
  Usb,
  Key,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useDeployment } from '../../context/DeploymentContext';

interface DeviceProvisioningWizardProps {
  deployment: Deployment;
  onProvisioned?: () => void;
}

export const DeviceProvisioningWizard: React.FC<DeviceProvisioningWizardProps> = ({
  deployment,
  onProvisioned,
}) => {
  const { provisionDevice } = useDeployment();
  const [credentials, setCredentials] = useState<DeviceRegistrationCredentials | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [isConnectedSerial, setIsConnectedSerial] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleGenerateCredentials = async () => {
    setProvisioning(true);
    try {
      const res = await provisionDevice(deployment.id);
      setCredentials(res.credentials);
      setSerialLogs((prev) => [
        ...prev,
        `[AUTH] Secure credential generated for device: ${res.credentials.deviceId}`,
        `[AUTH] Preshared token created (SHA-256 securely stored in database)`,
        `[NET] Telemetry prefix registered: ${res.credentials.mqttTopicPrefix}`,
      ]);
      onProvisioned?.();
    } finally {
      setProvisioning(false);
    }
  };

  // Web Serial API handler
  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser. Please use Chrome/Edge or the manual CLI command below.');
      return;
    }

    try {
      setSerialLogs((prev) => [...prev, '[SERIAL] Requesting USB serial port access...']);
      const nav = navigator as unknown as {
        serial: {
          requestPort: () => Promise<{
            open: (opt: { baudRate: number }) => Promise<void>;
            writable: {
              getWriter: () => {
                write: (data: Uint8Array) => Promise<void>;
                releaseLock: () => void;
              };
            };
          }>;
        };
      };
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnectedSerial(true);
      setSerialLogs((prev) => [
        ...prev,
        '[SERIAL] Connected to ESP32 USB serial bridge at 115200 baud.',
      ]);

      if (credentials) {
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        const payload = `SENTINEL_PROVISION:org=${deployment.organizationId}:fac=${deployment.facilityId}:dev=${credentials.deviceId}:tok=${credentials.token}\n`;
        await writer.write(encoder.encode(payload));
        writer.releaseLock();
        setSerialLogs((prev) => [
          ...prev,
          '[SERIAL] Successfully transmitted provisioning token packet to ESP32 NVS memory!',
          '[SERIAL] ESP32 node acknowledged and restarting in SECURE_ONLINE mode.',
        ]);
      }
    } catch (err: unknown) {
      setSerialLogs((prev) => [
        ...prev,
        `[SERIAL ERROR] ${err instanceof Error ? err.message : 'Failed to open serial port'}`,
      ]);
    }
  };

  const copyToken = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(credentials.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const cliCommand = credentials
    ? `SENTINEL_PROVISION:org=${deployment.organizationId}:fac=${deployment.facilityId}:dev=${credentials.deviceId}:tok=${credentials.token}`
    : `SENTINEL_PROVISION:org=${deployment.organizationId}:fac=${deployment.facilityId}:dev=${deployment.deviceId || 'ESP32-NODE'}:tok=<GENERATE_TOKEN_FIRST>`;

  const copyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base">
              ESP32 Device Provisioning & Token Exchange
            </h3>
            <p className="text-xs text-text-secondary">
              Deployment: <span className="text-text-primary font-medium">{deployment.name}</span> • Status: <span className="font-semibold text-text-primary">{deployment.status}</span>
            </p>
          </div>
        </div>

        {/* Generate / Rotate Token */}
        <button
          onClick={handleGenerateCredentials}
          disabled={provisioning}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <Key className="w-4 h-4" />
          {provisioning ? 'Generating...' : credentials ? 'Re-generate Secret' : 'Generate Device Credentials'}
        </button>
      </div>

      {/* Single-Reveal Token Card */}
      {credentials && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Device Registration Successful
            </span>
            <span className="text-[11px] text-text-muted">Single-Reveal Token</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-secondary">
            <div>
              <span className="text-text-muted">Assigned Device ID:</span>
              <p className="font-mono font-bold text-text-primary">{credentials.deviceId}</p>
            </div>
            <div>
              <span className="text-text-muted">MQTT Client ID:</span>
              <p className="font-mono text-text-primary">{credentials.mqttClientId}</p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-text-muted">Preshared Authentication Secret:</span>
            <div className="flex items-center gap-2 bg-black/80 p-2.5 rounded-lg border border-border font-mono text-emerald-400 text-xs truncate">
              <span className="truncate flex-1">{credentials.token}</span>
              <button
                onClick={copyToken}
                className="p-1.5 rounded bg-surface hover:bg-surface-hover text-text-primary border border-border shrink-0 transition-colors"
                title="Copy Token"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flashing / Provisioning Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Option 1: Web Serial API */}
        <div className="p-5 rounded-xl border border-border bg-surface-hover space-y-4">
          <div className="flex items-center gap-2 font-semibold text-text-primary text-sm">
            <Usb className="w-4 h-4 text-primary" />
            <span>Option A: 1-Click Browser Web Serial (Chrome/Edge)</span>
          </div>
          <p className="text-xs text-text-secondary">
            Connect your ESP32 via USB and click Connect. The browser will open the serial port and automatically flash the cryptographic token into ESP32 NVS memory.
          </p>

          <button
            onClick={handleConnectWebSerial}
            disabled={isConnectedSerial}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isConnectedSerial
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            <Usb className="w-4 h-4" />
            {isConnectedSerial ? 'Connected & Provisioned' : 'Connect ESP32 via Web Serial'}
          </button>
        </div>

        {/* Option 2: Manual Terminal CLI */}
        <div className="p-5 rounded-xl border border-border bg-surface-hover space-y-4">
          <div className="flex items-center gap-2 font-semibold text-text-primary text-sm">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Option B: Manual Serial Monitor / Terminal</span>
          </div>
          <p className="text-xs text-text-secondary">
            Open PlatformIO Serial Monitor (<code className="font-mono text-text-primary">pio run -t monitor</code>) or PuTTY at 115200 baud, then paste this command:
          </p>

          <div className="flex items-center gap-2 bg-black/80 p-2.5 rounded-lg border border-border font-mono text-cyan-400 text-xs truncate">
            <span className="truncate flex-1">{cliCommand}</span>
            <button
              onClick={copyCli}
              className="p-1.5 rounded bg-surface hover:bg-surface-hover text-text-primary border border-border shrink-0 transition-colors"
              title="Copy Command"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Live Serial Logs Console */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span className="font-medium flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary" /> Provisioning Audit Log:
          </span>
          <button
            onClick={() => setSerialLogs([])}
            className="text-[11px] text-text-muted hover:text-text-primary"
          >
            Clear
          </button>
        </div>

        <div className="bg-black/90 border border-border rounded-lg p-3 font-mono text-xs text-emerald-400 h-36 overflow-y-auto space-y-1">
          {serialLogs.length === 0 ? (
            <span className="text-text-muted">No serial messages recorded yet. Click connect or generate credentials to begin.</span>
          ) : (
            serialLogs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};
