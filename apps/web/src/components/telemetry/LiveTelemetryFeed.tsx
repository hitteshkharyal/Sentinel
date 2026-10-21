// ─────────────────────────────────────────────
// SENTINEL Web — Live Telemetry Feed & Stream Inspector
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Activity,
  Search,
  AlertTriangle,
  Radio,
  Wifi,
  ChevronDown,
  ChevronRight,
  Trash2,
  Play,
  Pause,
  Thermometer,
  Wind,
  Flame,
  Volume2,
  DoorClosed,
  Eye,
  MapPin,
  Cpu,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useTelemetry } from '../../context/TelemetryContext';

export const LiveTelemetryFeed: React.FC = () => {
  const {
    telemetryLogs,
    connectionStatus,
    clearLogs,
  } = useTelemetry();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [expandedPacketIds, setExpandedPacketIds] = useState<Set<string>>(new Set());

  // Toggle JSON expansion
  const toggleExpand = (id: string) => {
    setExpandedPacketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter logs
  const filteredLogs = telemetryLogs.filter((packet) => {
    // Search match
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchesDevice = packet.deviceId.toLowerCase().includes(query);
      const matchesFacility = packet.facilityId?.toLowerCase().includes(query);
      const matchesRoom = packet.roomId?.toLowerCase().includes(query);
      if (!matchesDevice && !matchesFacility && !matchesRoom) return false;
    }

    // Status filter
    if (filterMode === 'valid' && !packet.valid) return false;
    if (filterMode === 'errors' && packet.valid) return false;

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Stream Control Bar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Stream Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`relative flex h-2.5 w-2.5 ${
                connectionStatus === 'connected'
                  ? 'text-emerald-500'
                  : connectionStatus === 'connecting'
                  ? 'text-amber-500'
                  : 'text-slate-400'
              }`}
            >
              {connectionStatus === 'connected' && !isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  connectionStatus === 'connected'
                    ? isPaused
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              ></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {isPaused
                ? 'Stream Paused'
                : connectionStatus === 'connected'
                ? 'Live MQTT Telemetry Stream'
                : connectionStatus === 'connecting'
                ? 'Connecting to WebSocket Gateway...'
                : 'Disconnected'}
            </span>
          </div>

          <Badge variant="neutral" size="sm">
            {filteredLogs.length} buffered
          </Badge>
        </div>

        {/* Right: Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by device ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sentinel-500 w-44"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-sentinel-600 text-white font-medium'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('valid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'valid'
                  ? 'bg-sentinel-600 text-white font-medium'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Valid Only
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('errors')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'errors'
                  ? 'bg-sentinel-600 text-white font-medium'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Warnings
            </button>
          </div>

          {/* Pause / Resume Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused((prev) => !prev)}
            leftIcon={
              isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-slate-600" />
              )
            }
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          {/* Clear Buffer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-500" />}
            title="Clear Stream Buffer"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Rolling Packets Container */}
      <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto font-sans">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Activity className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-pulse" />
            <div className="font-semibold text-slate-700 text-sm">
              Waiting for live telemetry packets...
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Packets published to MQTT topic{' '}
              <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                sentinel/&#123;org&#125;/&#123;facility&#125;/&#123;device&#125;/telemetry
              </code>{' '}
              or injected via the simulation modal will stream here in real time.
            </p>
          </div>
        ) : (
          filteredLogs.map((packet) => {
            const isExpanded = expandedPacketIds.has(packet.id);
            const dateObj = new Date(packet.timestamp || packet.receivedAt);
            const timeFormatted = `${dateObj.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}.${String(dateObj.getMilliseconds()).padStart(3, '0')}`;

            return (
              <div
                key={packet.id}
                className={`p-3.5 hover:bg-slate-50/80 transition-colors ${
                  !packet.valid ? 'bg-rose-50/40' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  {/* Left: Device & Timestamp */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(packet.id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Inspect Raw JSON"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-slate-600" />
                      {packet.deviceId}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500">
                      {timeFormatted}
                    </span>

                    {packet.facilityId && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {packet.roomId ? `Room: ${packet.roomId}` : 'Facility Linked'}
                      </span>
                    )}
                  </div>

                  {/* Right: Validation & Device Health Badges */}
                  <div className="flex items-center gap-2">
                    {packet.metadata?.wifiRssiDbm !== undefined && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Wifi className="w-3 h-3 text-slate-400" />
                        {packet.metadata.wifiRssiDbm} dBm
                      </span>
                    )}

                    {packet.valid ? (
                      <Badge variant="success" size="sm" dot>
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        Invalid (
                        {packet.validationErrors?.length || 1} error)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Sensor Values Signal Pills Grid */}
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  {/* Temperature */}
                  {packet.sensors?.temperature !== undefined && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-xs">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-semibold">{packet.sensors.temperature} °C</span>
                    </div>
                  )}

                  {/* Humidity */}
                  {packet.sensors?.humidity !== undefined && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-800 text-xs">
                      <Wind className="w-3.5 h-3.5 text-sky-500" />
                      <span className="font-semibold">{packet.sensors.humidity}%</span>
                    </div>
                  )}

                  {/* CO2 */}
                  {packet.sensors?.co2 !== undefined && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                        packet.sensors.co2 > 1500
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                          : packet.sensors.co2 > 1000
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{packet.sensors.co2} ppm CO₂</span>
                    </div>
                  )}

                  {/* Sound */}
                  {packet.sensors?.soundLevel !== undefined && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/80 text-purple-800 text-xs">
                      <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>{packet.sensors.soundLevel} dB</span>
                    </div>
                  )}

                  {/* Door */}
                  {packet.sensors?.door !== undefined && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                        packet.sensors.door === 'open'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>Door: {packet.sensors.door.toUpperCase()}</span>
                    </div>
                  )}

                  {/* mmWave Radar */}
                  {packet.sensors?.mmwave && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                        packet.sensors.mmwave.presence
                          ? 'bg-sentinel-50 border-sentinel-200 text-sentinel-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5 text-sentinel-600" />
                      <span>
                        Radar: {packet.sensors.mmwave.presence ? 'Presence' : 'Clear'}
                        {packet.sensors.mmwave.stationaryConfidence
                          ? ` (${packet.sensors.mmwave.stationaryConfidence}%)`
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* PIR */}
                  {packet.sensors?.pir !== undefined && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px]">
                      <Eye className="w-3 h-3 text-indigo-500" />
                      <span>PIR: {packet.sensors.pir ? 'Active' : 'Idle'}</span>
                    </div>
                  )}

                  {/* Pressure */}
                  {packet.sensors?.pressure !== undefined && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
                      <span>{packet.sensors.pressure} kPa</span>
                    </div>
                  )}

                  {/* GPS */}
                  {packet.sensors?.gps && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {packet.sensors.gps.latitude.toFixed(4)},{' '}
                        {packet.sensors.gps.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Validation Errors Box if any */}
                {packet.validationErrors && packet.validationErrors.length > 0 && (
                  <div className="mt-2 ml-6 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-0.5">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Validation Warnings:
                    </div>
                    {packet.validationErrors.map((err, idx) => (
                      <div key={idx} className="pl-4 text-[11px]">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Raw JSON Inspector */}
                {isExpanded && (
                  <div className="mt-3 ml-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto shadow-inner">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-800 mb-2">
                      <span>Full Authoritative Payload</span>
                      <span>Topic: sentinel/.../telemetry</span>
                    </div>
                    <pre className="text-[11px] leading-relaxed text-emerald-400">
                      {JSON.stringify(packet, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
