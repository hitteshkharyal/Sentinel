// ─────────────────────────────────────────────
// SENTINEL Web — Sound Engine & Alert Beacon Control Bar
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useAlerts } from '../../context/AlertContext';
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  BellRing,
  Radio,
  Play,
  Volume1,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { AlertSeverity } from '@sentinel/types';

export const SoundControlBar: React.FC = () => {
  const {
    isSoundMuted,
    soundVolume,
    setSoundMuted,
    setSoundVolume,
    playTestSound,
    browserNotificationPermission,
    requestBrowserNotificationPermission,
    connectionStatus,
    isConnected,
  } = useAlerts();

  const [testMenuOpen, setTestMenuOpen] = useState(false);

  const handleTestSound = (severity: AlertSeverity | 'RESOLVED') => {
    playTestSound(severity);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Audio Beacon & Synthesizer Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={() => setSoundMuted(!isSoundMuted)}
            className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium text-xs transition-all ${
              isSoundMuted
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm'
                : 'bg-sentinel-50 border-sentinel-200 text-sentinel-700 hover:bg-sentinel-100 shadow-sm'
            }`}
            title={isSoundMuted ? 'Audio Beacon Muted — Click to Unmute' : 'Audio Beacon Active — Click to Mute'}
          >
            {isSoundMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Audio Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-sentinel-600" />
                <span>Audio Beacons Active</span>
              </>
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            {soundVolume === 0 || isSoundMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            ) : soundVolume < 0.5 ? (
              <Volume1 className="w-3.5 h-3.5 text-sentinel-600" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-sentinel-600" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isSoundMuted ? 0 : soundVolume}
              onChange={(e) => {
                if (isSoundMuted) setSoundMuted(false);
                setSoundVolume(parseFloat(e.target.value));
              }}
              className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sentinel-600 focus:outline-none"
              title={`Beacon Volume: ${Math.round(soundVolume * 100)}%`}
            />
            <span className="text-xs font-mono font-semibold text-slate-600 w-8 text-right">
              {isSoundMuted ? '0%' : `${Math.round(soundVolume * 100)}%`}
            </span>
          </div>

          {/* Sound Synthesizer Test Triggers */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestMenuOpen(!testMenuOpen)}
              className="text-xs flex items-center gap-1.5 border-slate-200 hover:border-sentinel-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Beacons</span>
            </Button>

            {testMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-fade-in"
                onMouseLeave={() => setTestMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Web Audio Synthesizer
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleTestSound('CRITICAL');
                    setTestMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-rose-50 text-rose-700 font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Critical Siren (880Hz)
                  </span>
                  <Play className="w-3 h-3 text-rose-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTestSound('HIGH');
                    setTestMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-amber-50 text-amber-700 font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    High Alert Pip (659Hz)
                  </span>
                  <Play className="w-3 h-3 text-amber-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTestSound('WARNING');
                    setTestMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-yellow-50 text-yellow-700 font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Warning Ping (523Hz)
                  </span>
                  <Play className="w-3 h-3 text-yellow-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTestSound('RESOLVED');
                    setTestMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium flex items-center justify-between border-t border-slate-100"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Resolved Triad (Chord)
                  </span>
                  <Play className="w-3 h-3 text-emerald-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Browser Push Notifications & Live Telemetry Stream Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Native Browser Notification Button */}
          {browserNotificationPermission === 'granted' ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-xs">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>Push Active</span>
            </div>
          ) : browserNotificationPermission === 'denied' ? (
            <div
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-help"
              title="Notifications are blocked in your browser site permissions. Enable them in site settings."
            >
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Push Blocked</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={requestBrowserNotificationPermission}
              className="text-xs flex items-center gap-1.5 border-sentinel-200 text-sentinel-700 hover:bg-sentinel-50 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5 text-sentinel-600" />
              <span>Enable Browser Push</span>
            </Button>
          )}

          {/* WebSocket Live Telemetry / Alert Stream Status */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Radio
              className={`w-3.5 h-3.5 ${
                isConnected
                  ? 'text-emerald-500 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'text-amber-500 animate-spin'
                  : 'text-rose-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isConnected ? (
                <span className="text-emerald-700 font-mono">WS STREAM ACTIVE</span>
              ) : connectionStatus === 'connecting' ? (
                <span className="text-amber-700 font-mono">RECONNECTING...</span>
              ) : (
                <span className="text-rose-700 font-mono">OFFLINE</span>
              )}
            </span>
            <Badge
              variant={isConnected ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'danger'}
              size="sm"
              dot
            >
              {isConnected ? '100% Live' : 'Polling'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
