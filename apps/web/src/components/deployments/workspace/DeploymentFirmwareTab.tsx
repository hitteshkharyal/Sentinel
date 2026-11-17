// ─────────────────────────────────────────────
// SENTINEL Web — Single-File Firmware Generator Tab
// Standalone sentinel_firmware.ino sketch generation & flashing guide
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  Wifi,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { BoardType, Deployment, SingleFileFirmwareResult } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface FirmwareTabProps {
  deployment: Deployment;
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
      ? 'http://192.168.1.100:4000'
      : window.location.origin
  );
  const [telemetryInterval] = useState(5000);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SingleFileFirmwareResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'code' | 'guide'>('code');

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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SENTINEL Server URL *
              </label>
              <input
                type="text"
                required
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:4000"
                className="w-full text-xs px-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Microcontroller must be able to reach this HTTP URL over your local network
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
