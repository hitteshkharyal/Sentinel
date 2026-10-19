// ─────────────────────────────────────────────
// SENTINEL Web — Device Provisioning & Firmware Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Server,
  Terminal,
  FileCode,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import type { Device, DeviceRegistrationCredentials } from '@sentinel/types';
import { useDevice, DeviceConfigResponse } from '../../context/DeviceContext';

interface DeviceProvisionModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceProvisionModal: React.FC<DeviceProvisionModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const { getDeviceConfig, rotateSecret } = useDevice();

  const [activeTab, setActiveTab] = useState<'cpp' | 'mqtt' | 'rest'>('cpp');
  const [config, setConfig] = useState<DeviceConfigResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [rotating, setRotating] = useState(false);
  const [newCredentials, setNewCredentials] = useState<DeviceRegistrationCredentials | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      setLoading(true);
      setError(null);
      setNewCredentials(null);
      getDeviceConfig(device.id)
        .then((cfg) => setConfig(cfg))
        .catch((err) => setError(err.message || 'Failed to load configuration.'))
        .finally(() => setLoading(false));
    }
  }, [device, isOpen, getDeviceConfig]);

  if (!device) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleRotate = async () => {
    if (!window.confirm('Are you sure you want to rotate this device secret key? The previous token will immediately be revoked.')) {
      return;
    }
    setRotating(true);
    try {
      const creds = await rotateSecret(device.id, 'User manual rotation in dashboard');
      setNewCredentials(creds);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rotate secret.');
    } finally {
      setRotating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sentinel-100 text-sentinel-700">
            <Key className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-900">
            Hardware Provisioning & Firmware Config
          </span>
        </div>
      }
      description={`Cryptographic onboarding credentials and PlatformIO C++ header for microcontroller ${device.deviceId}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 py-2">
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Device Quick Identity Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sentinel-600 text-white flex items-center justify-center font-mono font-bold text-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">{device.deviceId}</span>
                <Badge variant={device.status === 'ONLINE' ? 'success' : 'default'} size="sm">
                  {device.status}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                MAC: {device.macAddress} | Model: {device.chipModel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={rotating}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />}
            >
              {rotating ? 'Rotating...' : 'Rotate Device Key'}
            </Button>
          </div>
        </div>

        {/* Newly Rotated Token Banner */}
        {newCredentials && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                New Secret Token Generated
              </span>
              <button
                type="button"
                onClick={() => handleCopy(newCredentials.token, 'newToken')}
                className="text-xs text-amber-900 hover:text-amber-800 font-semibold underline flex items-center gap-1"
              >
                {copiedText === 'newToken' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedText === 'newToken' ? 'Copied' : 'Copy New Key'}
              </button>
            </div>
            <div className="p-2.5 bg-white rounded border border-amber-300 font-mono text-xs text-amber-950 break-all select-all">
              {newCredentials.token}
            </div>
            <p className="text-[11px] text-amber-700">
              The previous secret was revoked. Please flash this new token into the device now.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('cpp')}
            className={`pb-2.5 flex items-center gap-1.5 transition ${
              activeTab === 'cpp'
                ? 'border-b-2 border-sentinel-600 text-sentinel-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            C++ PlatformIO (sentinel_config.h)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mqtt')}
            className={`pb-2.5 flex items-center gap-1.5 transition ${
              activeTab === 'mqtt'
                ? 'border-b-2 border-sentinel-600 text-sentinel-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            MQTT Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rest')}
            className={`pb-2.5 flex items-center gap-1.5 transition ${
              activeTab === 'rest'
                ? 'border-b-2 border-sentinel-600 text-sentinel-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            REST Ingestion cURL
          </button>
        </div>

        {/* Tab 1: C++ PlatformIO */}
        {activeTab === 'cpp' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ready-to-flash header for ESP32 Arduino / PlatformIO firmware</span>
              <button
                type="button"
                onClick={() => config && handleCopy(config.cppHeader, 'cpp')}
                className="flex items-center gap-1 text-sentinel-600 hover:text-sentinel-700 font-medium"
              >
                {copiedText === 'cpp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'cpp' ? 'Copied Header' : 'Copy C++ Code'}
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 leading-relaxed select-all">
              {loading ? (
                <div className="py-8 text-center text-slate-500 animate-pulse">Generating header...</div>
              ) : (
                <pre>{config?.cppHeader}</pre>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Flashing Instructions:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Save this code as <code className="text-sentinel-700 font-bold">firmware/esp32/include/sentinel_config.h</code></li>
                <li>Set your local Wi-Fi SSID and Password</li>
                <li>Connect your ESP32 board via USB-C and run <code className="text-sentinel-700 font-bold">pio run -t upload</code></li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: MQTT Parameters */}
        {activeTab === 'mqtt' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium">MQTT Broker Host</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">
                  {config?.mqttConfig.brokerHost || '192.168.1.100'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium">Port (Insecure / TLS)</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">1883 / 8883 (MQTTS)</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium">Client ID</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">{config?.mqttConfig.clientId}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium">Keepalive / Heartbeat</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">30 seconds</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700">MQTT Topics</label>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Telemetry:</span>
                  <code className="text-sentinel-700 font-bold">{config?.mqttConfig.telemetryTopic}</code>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Status:</span>
                  <code className="text-sentinel-700 font-bold">{config?.mqttConfig.statusTopic}</code>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600">Commands:</span>
                  <code className="text-sentinel-700 font-bold">{config?.mqttConfig.commandTopic}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: REST Ingestion cURL */}
        {activeTab === 'rest' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Test hardware heartbeat endpoint using terminal cURL</span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `curl -X POST http://localhost:4000/api/v1/devices/heartbeat \\\n  -H "Content-Type: application/json" \\\n  -H "X-Device-Token: YOUR_SECRET_TOKEN" \\\n  -d '{"deviceId":"${device.deviceId}","uptimeSeconds":3600,"freeHeapBytes":210400,"wifiRssiDbm":-55}'`,
                    'curl'
                  )
                }
                className="flex items-center gap-1 text-sentinel-600 hover:text-sentinel-700 font-medium"
              >
                {copiedText === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'curl' ? 'Copied' : 'Copy cURL'}
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
              <pre>{`curl -X POST http://localhost:4000/api/v1/devices/heartbeat \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Token: YOUR_DEVICE_SECRET" \\
  -d '{
    "deviceId": "${device.deviceId}",
    "uptimeSeconds": 14200,
    "freeHeapBytes": 245000,
    "wifiRssiDbm": -62,
    "firmwareVersion": "${device.firmwareVersion}"
  }'`}</pre>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
