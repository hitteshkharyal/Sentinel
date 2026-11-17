// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Devices & API Key Tab
// Device identification, authentication credentials, and API key management
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import type { Deployment, DeviceApiKeyInfo } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface DevicesTabProps {
  deployment: Deployment;
}

export const DeploymentDevicesTab: React.FC<DevicesTabProps> = ({ deployment }) => {
  const { getDeviceApiKey, rotateDeviceApiKey } = useDeployment();
  const [keyInfo, setKeyInfo] = useState<DeviceApiKeyInfo | null>(null);
  const [showPlainKey, setShowPlainKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDeviceApiKey(deployment.id)
      .then((data) => {
        if (mounted) {
          setKeyInfo(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [deployment.id, getDeviceApiKey]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateKey = async () => {
    if (!window.confirm('Are you sure you want to rotate this API Key? The device running the old key will stop transmitting until updated with new firmware!')) {
      return;
    }
    setRotating(true);
    try {
      const updated = await rotateDeviceApiKey(deployment.id);
      setKeyInfo(updated);
      setShowPlainKey(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to rotate API Key');
    } finally {
      setRotating(false);
    }
  };

  const deviceId = deployment.deviceId || keyInfo?.deviceId || `SENT-${deployment.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#172033]">Assigned Hardware & API Key</h3>
        <p className="text-xs text-slate-500">
          Cryptographic token and device profile bound to this deployment workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Profile Card */}
        <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EC]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#172033]">{deviceId}</h4>
                <p className="text-xs text-slate-500">Microcontroller Node</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                deployment.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {deployment.status === 'ACTIVE' ? 'ONLINE' : 'STANDBY'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Board Architecture</span>
              <p className="font-medium text-[#172033] mt-0.5">
                {deployment.hardwareConfig?.boardName || 'ESP32 / ESP8266 Dev Board'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Chipset Model</span>
              <p className="font-mono text-[#172033] mt-0.5">
                {deployment.hardwareConfig?.chipModel || 'ESP32-WROOM-32D'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Facility Location</span>
              <p className="font-medium text-[#172033] mt-0.5">
                {deployment.facilityName || 'Main Facility'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Zone / Room</span>
              <p className="font-medium text-[#172033] mt-0.5">
                {deployment.roomName || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>

        {/* API Key Management Card */}
        <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EC]">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-semibold text-[#172033]">Device API Key</h4>
            </div>
            <button
              onClick={handleRotateKey}
              disabled={rotating}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
              Rotate Key
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Use this key in the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">X-Device-API-Key</code> HTTP header when posting telemetry from ESP32 or ESP8266 devices.
          </p>

          {loading ? (
            <div className="text-xs text-slate-400 py-3">Loading credentials...</div>
          ) : keyInfo ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#172033] break-all">
                    {showPlainKey && keyInfo.fullKey
                      ? keyInfo.fullKey
                      : keyInfo.maskedKey}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {keyInfo.fullKey && (
                      <button
                        onClick={() => setShowPlainKey(!showPlainKey)}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title={showPlainKey ? 'Hide key' : 'Show key'}
                      >
                        {showPlainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(keyInfo.fullKey || keyInfo.maskedKey)}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Copy key"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Key Prefix: <strong className="font-mono text-slate-700">{keyInfo.keyPrefix}</strong></span>
                <span>Status: <strong className="text-emerald-600">ACTIVE</strong></span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No active credential found.</div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>
              This key is automatically embedded in your generated firmware sketch. You do not need to copy it manually when using the Firmware tab.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
