// ─────────────────────────────────────────────
// SENTINEL Web — Multi-Scenario Sensor Fusion Sandbox
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { TelemetrySensorData, OccupancySnapshot, SentinelEvent } from '@sentinel/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useFacility } from '../../context/FacilityContext';
import { useEvents } from '../../context/EventContext';
import {
  Sparkles,
  ShieldAlert,
  Bus,
  Bed,
  Wind,
  Gauge,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface SimulateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PresetKey = 'fall' | 'bus' | 'sleep' | 'co2' | 'airlock' | 'overcapacity';

export const SimulateEventModal: React.FC<SimulateEventModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { rooms } = useFacility();
  const { evaluateSimulation } = useEvents();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    rooms[0]?.id || ''
  );
  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('fall');

  // Interactive sensor signal state
  const [presence, setPresence] = useState(true);
  const [radarCount, setRadarCount] = useState(1);
  const [radarDistance, setRadarDistance] = useState(0.5);
  const [stationaryConfidence, setStationaryConfidence] = useState(92);
  const [movementConfidence, setMovementConfidence] = useState(20);
  const [pirMotion, setPirMotion] = useState(true);
  const [soundLevel, setSoundLevel] = useState(82);
  const [co2, setCo2] = useState(850);
  const [temperature, setTemperature] = useState(22.5);
  const [door, setDoor] = useState<'open' | 'closed'>('closed');
  const [pressure, setPressure] = useState(101.3);

  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<{
    occupancy: OccupancySnapshot;
    events: SentinelEvent[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Apply predefined multi-sensor presets
  const applyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    setResult(null);
    setError(null);

    switch (preset) {
      case 'fall':
        setPresence(true);
        setRadarCount(1);
        setRadarDistance(0.45); // Low altitude near floor
        setStationaryConfidence(94);
        setMovementConfidence(10);
        setPirMotion(true);
        setSoundLevel(84); // Sudden thud
        setCo2(800);
        setTemperature(22.0);
        setDoor('closed');
        setPressure(101.3);
        break;

      case 'bus':
        setPresence(true);
        setRadarCount(1);
        setRadarDistance(1.2);
        setStationaryConfidence(92);
        setMovementConfidence(15);
        setPirMotion(true);
        setSoundLevel(48);
        setCo2(1100);
        setTemperature(29.0);
        setDoor('closed'); // Closed bus doors
        setPressure(101.3);
        break;

      case 'sleep':
        // Anti-false-positive: bed height, low sound, normal CO2
        setPresence(true);
        setRadarCount(1);
        setRadarDistance(1.15); // Resting in bed (> 0.9m)
        setStationaryConfidence(96);
        setMovementConfidence(5);
        setPirMotion(false);
        setSoundLevel(42); // Quiet bedroom
        setCo2(720);
        setTemperature(21.5);
        setDoor('closed');
        setPressure(101.3);
        break;

      case 'co2':
        setPresence(true);
        setRadarCount(4);
        setRadarDistance(2.0);
        setStationaryConfidence(70);
        setMovementConfidence(80);
        setPirMotion(true);
        setSoundLevel(62);
        setCo2(2450); // Severe CO2
        setTemperature(24.0);
        setDoor('closed');
        setPressure(101.3);
        break;

      case 'airlock':
        setPressure(98.2); // Loss of differential
        setDoor('open');
        setPresence(false);
        setPirMotion(false);
        setSoundLevel(50);
        setCo2(600);
        break;

      case 'overcapacity':
        setPresence(true);
        setRadarCount(12);
        setRadarDistance(2.5);
        setStationaryConfidence(80);
        setMovementConfidence(85);
        setPirMotion(true);
        setSoundLevel(74);
        setCo2(1650);
        setTemperature(24.5);
        setDoor('open');
        break;
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedRoomId) {
      setError('Please select a target room for simulation.');
      return;
    }

    setIsSimulating(true);
    setError(null);

    const signals: TelemetrySensorData = {
      pir: pirMotion,
      soundLevel,
      co2,
      temperature,
      door,
      pressure,
    };

    if (presence) {
      signals.mmwave = {
        presence: true,
        count: radarCount,
        distance: radarDistance,
        stationaryConfidence,
        movementConfidence,
      };
    } else {
      signals.mmwave = {
        presence: false,
        count: 0,
      };
    }

    try {
      const simResult = await evaluateSimulation(selectedRoomId, signals);
      setResult(simResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation evaluation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              Sensor Fusion & Policy Sandbox
            </h3>
            <span className="text-xs text-slate-400">
              Authoritatively test spatial posture rules, anti-false-positive dampening & alerts.
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Room Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Target Spatial Context (Room / Twin)
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
          >
            {rooms.length === 0 ? (
              <option value="">No rooms configured yet</option>
            ) : (
              rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.roomType || 'room'}) — Cap: {r.capacity || 'N/A'}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Predefined Test Scenarios Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Multi-Sensor Scenario Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('fall')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'fall'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Bedside Fall</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Stationary radar &lt;0.85m + acoustic impact thud.
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('bus')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'bus'
                  ? 'bg-sentinel-50 border-sentinel-300 ring-2 ring-sentinel-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sentinel-800 mb-0.5">
                <Bus className="w-3.5 h-3.5 text-sentinel-600" />
                <span>Bus Child Safety</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Door closed + zero speed + occupant detected.
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('sleep')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'sleep'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-0.5">
                <Bed className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sleep Posture</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Bed height + low sound. Suppresses false alarms!
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('co2')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'co2'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-0.5">
                <Wind className="w-3.5 h-3.5 text-amber-600" />
                <span>CO₂ Hazard</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                2,450 ppm indoor concentration.
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('airlock')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'airlock'
                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 mb-0.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" />
                <span>Airlock Breach</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Differential pressure drop + door open.
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('overcapacity')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset === 'overcapacity'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 mb-0.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Overcapacity</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                12 occupants exceeding room limit.
              </p>
            </button>
          </div>
        </div>

        {/* Fine-Tuning Controls Slider Drawer */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sentinel-600" />
              Adjust Telemetry Signals
            </span>
            <span className="text-[11px] text-slate-400">Values map directly into sensor bus</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
            {/* mmWave Distance */}
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Radar Distance</span>
                <span className="font-mono font-bold text-slate-800">{radarDistance} m</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={radarDistance}
                onChange={(e) => {
                  setRadarDistance(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sentinel-600"
              />
            </div>

            {/* Sound Level dB */}
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Sound Level</span>
                <span className="font-mono font-bold text-slate-800">{soundLevel} dB</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="1"
                value={soundLevel}
                onChange={(e) => {
                  setSoundLevel(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sentinel-600"
              />
            </div>

            {/* CO2 ppm */}
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>CO₂ Concentration</span>
                <span className="font-mono font-bold text-slate-800">{co2} ppm</span>
              </div>
              <input
                type="range"
                min="400"
                max="4000"
                step="50"
                value={co2}
                onChange={(e) => {
                  setCo2(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sentinel-600"
              />
            </div>

            {/* Occupants Count */}
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Estimated Radar Count</span>
                <span className="font-mono font-bold text-slate-800">{radarCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={radarCount}
                onChange={(e) => {
                  setRadarCount(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sentinel-600"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Door State</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDoor('closed');
                    setActivePreset('custom');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border ${
                    door === 'closed'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Closed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDoor('open');
                    setActivePreset('custom');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border ${
                    door === 'open'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Open
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">PIR Motion Active</span>
              <button
                type="button"
                onClick={() => {
                  setPirMotion(!pirMotion);
                  setActivePreset('custom');
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium border ${
                  pirMotion
                    ? 'bg-sentinel-600 text-white border-sentinel-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {pirMotion ? 'Active Motion' : 'No Motion'}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        {/* Simulation Output Dashboard */}
        {result && (
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
                  Sensor Fusion Engine Output
                </span>
              </div>
              <Badge variant="primary" size="sm">
                Fused State: {result.occupancy.occupancyState}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Estimated Count</span>
                <span className="text-lg font-mono font-bold text-white">
                  {result.occupancy.estimatedOccupancy}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Fusion Confidence</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {result.occupancy.occupancyConfidence}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px]">Events Triggered</span>
                <span className="text-lg font-mono font-bold text-sentinel-400">
                  {result.events.length}
                </span>
              </div>
            </div>

            {/* Generated Events List */}
            {result.events.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Generated Incidents:</span>
                {result.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/80 flex items-start gap-2 text-xs"
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        ev.severity === 'CRITICAL'
                          ? 'text-rose-400'
                          : ev.severity === 'HIGH'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-white">{ev.title}</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">{ev.description}</p>
                      {ev.recommendation && (
                        <p className="text-[10px] text-amber-300/90 italic mt-1">
                          Recommendation: {ev.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  No alert generated. Anti-false-positive sleep and resting filter verified!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyPreset('fall')}
            className="gap-1.5 text-xs text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSimulating}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSimulating || !selectedRoomId}
              onClick={handleRunSimulation}
              className="gap-1.5 text-xs bg-sentinel-600 hover:bg-sentinel-700 text-white"
            >
              <Play className="w-3.5 h-3.5" />
              {isSimulating ? 'Injecting Signals...' : 'Execute Simulation'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
