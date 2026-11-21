// ─────────────────────────────────────────────
// SENTINEL Web — Single-File Firmware Generator Tab
// Standalone sentinel_firmware.ino sketch generation & flashing guide
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  Wifi,
  Key,
  Eye,
  EyeOff,
  Network,
  HelpCircle,
} from 'lucide-react';
import type { BoardType, Deployment, SingleFileFirmwareResult } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface FirmwareTabProps {
  deployment: Deployment;
}

interface NetworkInfo {
  recommendedServerUrl: string;
  recommendedIp: string;
  port: number;
  interfaces: {
    name: string;
    ip: string;
    mac: string;
    family: string;
    internal: boolean;
  }[];
}

const BOARD_OPTIONS: { value: BoardType; label: string; desc: string }[] = [
  { value: 'ESP32_DEV', label: 'ESP32 Dev Module (Recommended)', desc: 'Dual-core Xtensa, WiFi + BLE, 36 GPIOs' },
  { value: 'ESP32_DEVKIT', label: 'ESP32 DevKit V1 (30/36 pin)', desc: 'Standard ESP-WROOM-32 breakout board' },
  { value: 'ESP8266_NODEMCU', label: 'ESP8266 NodeMCU 1.0 (ESP-12E)', desc: 'Single-core 80MHz, WiFi, 11 GPIOs' },
  { value: 'ESP8266_WEMOS_D1', label: 'WeMos D1 Mini (ESP8266)', desc: 'Compact form-factor, single analog input' },
];

export const DeploymentFirmwareTab: React.FC<FirmwareTabProps> = ({ deployment }) => {
  const { generateSingleFileIno } = useDeployment();

  const [boardType, setBoardType] = useState<BoardType>('ESP32_DEV');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrl, setServerUrl] = useState(
    window.location.origin.includes('localhost')
      ? 'http://192.168.1.11:4000'
      : window.location.origin
  );
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [telemetryInterval, setTelemetryInterval] = useState(2500);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SingleFileFirmwareResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'code' | 'guide'>('code');

  useEffect(() => {
    // Attempt to detect host network LAN IP for ESP32 connectivity
    fetch('/api/v1/health/network')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          const net = data.data as NetworkInfo;
          setNetworkInfo(net);
          // If serverUrl is pointing to dummy .100 or localhost, update to real LAN IP
          setServerUrl((prev) => {
            if (prev.includes('192.168.1.100') || prev.includes('localhost') || prev.includes('127.0.0.1')) {
              return net.recommendedServerUrl;
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // Ignore network detection errors
      });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid.trim()) {
      alert('Please enter your Wi-Fi SSID');
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateSingleFileIno(deployment.id, {
        boardType,
        wifiSsid: wifiSsid.trim(),
        wifiPassword,
        serverUrl: serverUrl.trim(),
        telemetryIntervalMs: telemetryInterval,
      });
      setResult(generated);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to generate firmware');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#172033]">Single-File Arduino Firmware Generator</h3>
        <p className="text-xs text-slate-500">
          Generate a standalone, ready-to-flash <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">sentinel_firmware.ino</code> file containing all drivers, device API key, and Wi-Fi credentials
        </p>
      </div>

      {/* Generator Configuration Form */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Board Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Microcontroller Board *
              </label>
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value as BoardType)}
                className="w-full text-xs px-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[#172033] font-medium"
              >
                {BOARD_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {BOARD_OPTIONS.find((b) => b.value === boardType)?.desc}
              </p>
            </div>

            {/* Server Endpoint URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  SENTINEL Server URL *
                </label>
                {networkInfo && (
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <Network className="w-3 h-3" /> Auto-detected host IP
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.11:4000"
                className="w-full text-xs px-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
              />
              {networkInfo && networkInfo.interfaces.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Available LAN IPs:</span>
                  {networkInfo.interfaces.map((iface) => {
                    const targetUrl = `http://${iface.ip}:${networkInfo.port}`;
                    const isSelected = serverUrl.includes(iface.ip);
                    return (
                      <button
                        type="button"
                        key={iface.name}
                        onClick={() => setServerUrl(targetUrl)}
                        className={`px-2 py-0.5 rounded font-mono border transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {iface.name}: {iface.ip}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Microcontroller must be able to reach this HTTP URL over your 2.4GHz Wi-Fi network (avoid localhost/127.0.0.1)
              </p>
            </div>

            {/* Wi-Fi SSID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Wi-Fi Network Name (SSID) *
              </label>
              <div className="relative">
                <Wifi className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Office_IoT_2.4GHz"
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: ESP32/ESP8266 microcontrollers only support 2.4GHz Wi-Fi bands
              </p>
            </div>

            {/* Wi-Fi Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Wi-Fi Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Network password (leave blank for open)"
                  className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Embedded directly into the generated sketch; never stored on the server
              </p>
            </div>

            {/* Telemetry Ingestion Interval */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Telemetry Dispatch Interval
              </label>
              <select
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[#172033]"
              >
                <option value={2000}>Every 2 seconds (Fastest / Live Demo)</option>
                <option value={2500}>Every 2.5 seconds (Recommended Testing)</option>
                <option value={3000}>Every 3 seconds (Standard Fast)</option>
                <option value={5000}>Every 5 seconds (Production)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Sets loop delay on ESP32/ESP8266 to transmit sensor payloads every 2–3 seconds
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#DCE3EC]">
            <div className="text-xs text-slate-500">
              Sensor drivers: <strong className="text-[#172033]">{deployment.hardwareConfig?.sensors?.length || 0} modules</strong> auto-bundled
            </div>
            <button
              type="submit"
              disabled={generating || !wifiSsid.trim()}
              className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
              <FileCode className="w-4 h-4" />
              {generating ? 'Compiling Firmware...' : 'Generate Standalone Firmware (.ino)'}
            </button>
          </div>
        </form>
      </div>

      {/* Troubleshooting notice for connection refused */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">
            Troubleshooting ESP32 &ldquo;POST failed, error: connection refused&rdquo;
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px] leading-relaxed">
            <li>
              <strong>LAN IP Requirement:</strong> The ESP32 is an external network device. Never use <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">localhost</code> or <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">127.0.0.1</code>. Always select your host machine&apos;s LAN IP (e.g. {networkInfo?.recommendedServerUrl || 'http://192.168.1.11:4000'}).
            </li>
            <li>
              <strong>Same Subnet / 2.4 GHz Wi-Fi:</strong> Ensure your ESP32 and host computer are connected to the exact same Wi-Fi router. ESP32 chips only communicate over 2.4 GHz Wi-Fi bands.
            </li>
            <li>
              <strong>Windows Defender Firewall:</strong> Allow inbound TCP traffic on port 4000 so the ESP32 can deliver HTTP POST telemetry to the SENTINEL API server.
            </li>
          </ul>
        </div>
      </div>

      {/* Generated Firmware Display */}
      {result && (
        <div className="bg-white border border-[#DCE3EC] rounded-xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3EC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-[#172033]">{result.filename}</h4>
                <p className="text-xs text-slate-500">
                  Target: {result.boardType} • {result.sensorsCount} Sensors • Ready to flash
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-200 p-0.5 rounded-lg flex text-xs font-medium">
                <button
                  onClick={() => setActiveView('code')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeView === 'code' ? 'bg-white text-[#172033] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Source Code
                </button>
                <button
                  onClick={() => setActiveView('guide')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeView === 'guide' ? 'bg-white text-[#172033] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flashing Guide
                </button>
              </div>

              <button
                onClick={handleCopyCode}
                className="text-xs font-medium border border-[#DCE3EC] bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={handleDownload}
                className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download .ino
              </button>
            </div>
          </div>

          {/* Pin Summary Pill List */}
          <div className="px-5 py-2 flex flex-wrap items-center gap-2 border-b border-[#DCE3EC] bg-slate-50/50 text-xs">
            <span className="font-semibold text-slate-500">Wiring Pinout:</span>
            {result.pinSummary.map((ps, idx) => (
              <span key={idx} className="bg-white border border-[#DCE3EC] px-2.5 py-1 rounded-md text-slate-700 font-mono text-[11px]">
                <strong>{ps.sensor}</strong>: {ps.pins} ({ps.interfaceType})
              </span>
            ))}
          </div>

          {/* Main View Area */}
          <div className="p-5">
            {activeView === 'code' ? (
              <pre className="p-4 bg-[#0F172A] text-[#E2E8F0] rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-all">
                {result.content}
              </pre>
            ) : (
              <div className="prose prose-xs max-w-none text-[#172033] bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-6">
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {result.installGuide}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
