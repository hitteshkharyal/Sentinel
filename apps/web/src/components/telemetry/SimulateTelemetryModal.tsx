// ─────────────────────────────────────────────
// SENTINEL Web — Simulate & Inject Telemetry Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Key,
  Flame,
  Activity,
  Wind,
  Thermometer,
  Eye,
  DoorClosed,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTelemetry } from '../../context/TelemetryContext';
import { useDevice } from '../../context/DeviceContext';
import type { TelemetryMessage, ValidatedTelemetry } from '@sentinel/types';

interface SimulateTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDeviceId?: string;
}

interface ScenarioPreset {
  id: string;
  name: string;
  sector: string;
  badge: 'danger' | 'warning' | 'info' | 'success';
  description: string;
  sensors: TelemetryMessage['sensors'];
  metadata?: TelemetryMessage['metadata'];
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'hospital-fall',
    name: 'Patient Bedside Fall Event',
    sector: 'Healthcare & Hospital ICU',
    badge: 'danger',
    description: 'Sudden descent signature with high stationary mmWave presence and 82 dB impact acoustic thud.',
    sensors: {
      pir: true,
      mmwave: {
        presence: true,
        count: 1,
        distance: 0.75,
        energy: 18,
        stationaryConfidence: 96,
        movementConfidence: 88,
      },
      soundLevel: 82.5,
      temperature: 22.4,
      humidity: 45.2,
      door: 'closed',
    },
    metadata: {
      wifiRssiDbm: -54,
      freeHeapBytes: 198400,
      uptimeSeconds: 78420,
    },
  },
  {
    id: 'stem-lab-co2',
    name: 'STEM Lab CO₂ Air Quality Hazard',
    sector: 'K-12 Education / Chemistry',
    badge: 'warning',
    description: 'CO₂ accumulation exceeding 2,100 ppm from dry ice experiment with ventilation unsealed.',
    sensors: {
      co2: 2150,
      temperature: 25.1,
      humidity: 58.4,
      soundLevel: 51.2,
      pir: true,
      door: 'closed',
      mmwave: {
        presence: true,
        count: 12,
        stationaryConfidence: 84,
      },
    },
    metadata: {
      wifiRssiDbm: -62,
      freeHeapBytes: 187200,
      uptimeSeconds: 14200,
    },
  },
  {
    id: 'cleanroom-pressure',
    name: 'Cleanroom ISO-5 Pressure Loss',
    sector: 'Pharma / Semiconductor Cleanroom',
    badge: 'danger',
    description: 'Airlock door left ajar resulting in negative pressure drop and particulate influx risk.',
    sensors: {
      pressure: 100.1,
      door: 'open',
      temperature: 21.0,
      humidity: 42.0,
      soundLevel: 44.0,
      pir: false,
    },
    metadata: {
      wifiRssiDbm: -48,
      freeHeapBytes: 214000,
      uptimeSeconds: 341200,
    },
  },
  {
    id: 'bus-child-left',
    name: 'School Bus Left-Behind Child',
    sector: 'Transit & Pupil Safety',
    badge: 'danger',
    description: 'Bus engine halted with door locked, 34°C rising heat, and sleeping child detected via 60GHz radar.',
    sensors: {
      mmwave: {
        presence: true,
        count: 1,
        distance: 2.1,
        stationaryConfidence: 92,
        movementConfidence: 15,
      },
      pir: false,
      door: 'closed',
      temperature: 34.6,
      humidity: 61.2,
      soundLevel: 38.0,
      gps: {
        latitude: 37.7749,
        longitude: -122.4194,
        speed: 0,
        satellites: 8,
      },
    },
    metadata: {
      batteryPercent: 88,
      wifiRssiDbm: -71,
      freeHeapBytes: 172000,
      uptimeSeconds: 8400,
    },
  },
  {
    id: 'vaccine-cold-chain',
    name: 'Biomedical Vaccine Cold-Chain Excursion',
    sector: 'Life Sciences Cryo-Storage',
    badge: 'warning',
    description: 'Freezer thermal breach surpassing +8.0°C regulatory threshold due to faulty door seal.',
    sensors: {
      temperature: 9.6,
      humidity: 64.0,
      door: 'open',
      pir: false,
    },
    metadata: {
      wifiRssiDbm: -58,
      freeHeapBytes: 205000,
      uptimeSeconds: 981200,
    },
  },
];

export const SimulateTelemetryModal: React.FC<SimulateTelemetryModalProps> = ({
  isOpen,
  onClose,
  preselectedDeviceId,
}) => {
  const { simulateTelemetry } = useTelemetry();
  const { devices } = useDevice();

  const [selectedDevice, setSelectedDevice] = useState<string>(preselectedDeviceId || '');
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('hospital-fall');

  // Sensor values form state
  const [temperature, setTemperature] = useState<number>(22.4);
  const [humidity, setHumidity] = useState<number>(45.2);
  const [co2, setCo2] = useState<number>(650);
  const [soundLevel, setSoundLevel] = useState<number>(82.5);
  const [pressure, setPressure] = useState<number>(101.3);
  const [door, setDoor] = useState<'open' | 'closed'>('closed');
  const [pir, setPir] = useState<boolean>(true);
  const [mmwavePresence, setMmwavePresence] = useState<boolean>(true);
  const [mmwaveDistance, setMmwaveDistance] = useState<number>(0.75);
  const [mmwaveConfidence, setMmwaveConfidence] = useState<number>(96);
  const [includeGps, setIncludeGps] = useState<boolean>(false);
  const [gpsLat, setGpsLat] = useState<number>(37.7749);
  const [gpsLon, setGpsLon] = useState<number>(-122.4194);

  // Status & response
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<ValidatedTelemetry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-select first device if not preselected
  useEffect(() => {
    if (devices.length > 0 && devices[0] && !selectedDevice) {
      setSelectedDevice(devices[0].deviceId);
    }
  }, [devices, selectedDevice]);

  // Apply preset
  const applyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    const s = preset.sensors;
    if (s.temperature !== undefined) setTemperature(s.temperature);
    if (s.humidity !== undefined) setHumidity(s.humidity);
    if (s.co2 !== undefined) setCo2(s.co2);
    if (s.soundLevel !== undefined) setSoundLevel(s.soundLevel);
    if (s.pressure !== undefined) setPressure(s.pressure);
    if (s.door) setDoor(s.door);
    setPir(Boolean(s.pir));

    if (s.mmwave) {
      setMmwavePresence(Boolean(s.mmwave.presence));
      if (s.mmwave.distance !== undefined) setMmwaveDistance(s.mmwave.distance);
      if (s.mmwave.stationaryConfidence !== undefined)
        setMmwaveConfidence(s.mmwave.stationaryConfidence);
    } else {
      setMmwavePresence(false);
    }

    if (s.gps) {
      setIncludeGps(true);
      setGpsLat(s.gps.latitude);
      setGpsLon(s.gps.longitude);
    } else {
      setIncludeGps(false);
    }
  };

  // Build telemetry payload
  const buildPayload = (): TelemetryMessage => {
    const sensors: TelemetryMessage['sensors'] = {
      temperature,
      humidity,
      co2,
      soundLevel,
      pressure,
      door,
      pir,
    };

    if (mmwavePresence) {
      sensors.mmwave = {
        presence: true,
        count: 1,
        distance: mmwaveDistance,
        stationaryConfidence: mmwaveConfidence,
      };
    }

    if (includeGps) {
      sensors.gps = {
        latitude: gpsLat,
        longitude: gpsLon,
        speed: 0,
      };
    }

    return {
      deviceId: selectedDevice.trim().toUpperCase(),
      timestamp: new Date().toISOString(),
      sensors,
      metadata: {
        wifiRssiDbm: -56,
        freeHeapBytes: 194200,
        batteryPercent: 94,
        uptimeSeconds: 86400,
      },
    };
  };

  const handleInject = async () => {
    if (!selectedDevice.trim()) {
      setErrorMessage('Please select or enter a Device ID.');
      return;
    }
    if (!deviceToken.trim()) {
      setErrorMessage('Please enter the secret token provisioned for this device.');
      return;
    }

    setIsInjecting(true);
    setErrorMessage(null);
    setLastResponse(null);

    try {
      const payload = buildPayload();
      const result = await simulateTelemetry(payload, deviceToken.trim());
      setLastResponse(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Telemetry injection failed';
      setErrorMessage(msg);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sentinel-500/10 border border-sentinel-500/20 text-sentinel-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Live Telemetry Packet Injector
            </h3>
            <p className="text-xs text-slate-500">
              Simulate edge sensor packets through zero-trust token authentication and spatial validation.
            </p>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-5 py-2">
        {/* Scenario Presets Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Sector Scenario Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                  activePresetId === p.id
                    ? 'border-sentinel-500 bg-sentinel-50/50 shadow-sm ring-1 ring-sentinel-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                  <Badge variant={p.badge} size="sm">
                    {p.badge === 'danger' ? 'Hazard' : p.badge === 'warning' ? 'Warning' : 'Normal'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Device Authentication Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-800">
              Zero-Trust Device Authentication
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Target Device
              </label>
              {devices.length > 0 ? (
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 focus:ring-1 focus:ring-sentinel-500 focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.deviceId}>
                      {d.deviceId} — {d.name} ({d.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  placeholder="e.g. ESP32-ICU-001"
                  className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500" /> Pre-Shared Device Secret Token
                </span>
              </label>
              <input
                type="password"
                value={deviceToken}
                onChange={(e) => setDeviceToken(e.target.value)}
                placeholder="sent_dev_... (from registration)"
                className="w-full text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Per Master Rule: Devices cannot authenticate by deviceId alone. They must present the cryptographic secret provisioned on Day 6.
          </p>
        </div>

        {/* Environmental & Radar Controls Grid */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Simulated Sensor Channels
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {/* Temperature */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Temp (°C)
                </span>
                <span className="font-semibold text-slate-900">{temperature}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="60"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Humidity */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Wind className="w-3.5 h-3.5 text-sky-500" /> Humidity (%)
                </span>
                <span className="font-semibold text-slate-900">{humidity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* CO2 */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> CO₂ (ppm)
                </span>
                <span className="font-semibold text-slate-900">{co2}</span>
              </div>
              <input
                type="range"
                min="350"
                max="3000"
                step="50"
                value={co2}
                onChange={(e) => setCo2(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Sound Level */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5 text-purple-500" /> Sound (dB)
                </span>
                <span className="font-semibold text-slate-900">{soundLevel}</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="1"
                value={soundLevel}
                onChange={(e) => setSoundLevel(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pressure */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="font-medium">Pressure (kPa)</span>
                <span className="font-semibold text-slate-900">{pressure}</span>
              </div>
              <input
                type="range"
                min="80"
                max="120"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
                className="w-full accent-slate-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Door State */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <DoorClosed className="w-3.5 h-3.5 text-slate-500" /> Door State
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDoor('closed')}
                  className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                    door === 'closed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Closed
                </button>
                <button
                  type="button"
                  onClick={() => setDoor('open')}
                  className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                    door === 'open'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Open
                </button>
              </div>
            </div>

            {/* PIR Motion */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <Eye className="w-3.5 h-3.5 text-indigo-500" /> PIR Motion
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pir}
                  onChange={(e) => setPir(e.target.checked)}
                  className="rounded text-sentinel-600 focus:ring-sentinel-500"
                />
                <span className="text-xs text-slate-700">Motion Triggered</span>
              </label>
            </div>

            {/* mmWave 60GHz Radar */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>mmWave Radar</span>
                <span className="text-[11px] text-slate-500">60 GHz</span>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mmwavePresence}
                  onChange={(e) => setMmwavePresence(e.target.checked)}
                  className="rounded text-sentinel-600 focus:ring-sentinel-500"
                />
                <span className="text-xs font-medium text-slate-700">Presence Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Result & Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <div className="font-semibold">Injection Failed</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {lastResponse && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Validated & Synchronized to Room Digital Twin
              </div>
              <Badge variant={lastResponse.valid ? 'success' : 'danger'} size="sm">
                {lastResponse.valid ? 'Valid Packet' : 'Validation Warning'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-900 bg-white/60 p-2 rounded-lg">
              <div>
                <span className="text-slate-500 block">Packet ID:</span>
                <span className="font-mono">{lastResponse.id.substring(0, 10)}...</span>
              </div>
              <div>
                <span className="text-slate-500 block">Device:</span>
                <span className="font-mono font-medium">{lastResponse.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Received At:</span>
                <span>{new Date(lastResponse.receivedAt).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Facility / Room:</span>
                <span>{lastResponse.facilityId ? 'Linked' : 'Unassigned'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isInjecting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleInject}
            isLoading={isInjecting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Inject Telemetry Packet
          </Button>
        </div>
      </div>
    </Modal>
  );
};
