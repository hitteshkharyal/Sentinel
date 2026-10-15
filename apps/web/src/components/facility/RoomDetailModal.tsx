// ─────────────────────────────────────────────
// SENTINEL Web — Room Digital Twin Detail Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Thermometer,
  Wind,
  Droplets,
  Volume2,
  DoorClosed,
  DoorOpen,
  Lock,
  Radio,
  Sliders,
  AlertTriangle,
  Trash2,
  Zap,
} from 'lucide-react';
import type { Room, RoomOccupancyState, HvacState } from '@sentinel/types';
import { useFacility } from '../../context/FacilityContext';
import { useOrganization } from '../../context/OrganizationContext';

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

const OCCUPANCY_STYLES: Record<
  RoomOccupancyState,
  { label: string; bg: string; text: string; dot: string }
> = {
  EMPTY: { label: 'Vacant', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  OCCUPIED: { label: 'Occupied', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  STATIONARY_OCCUPANCY: {
    label: 'Stationary Occupancy (Bed/Resting)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  ACTIVE_OCCUPANCY: {
    label: 'Active Movement',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  HIGH_DENSITY: {
    label: 'High Density / Overcapacity',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  UNKNOWN: { label: 'Signal Pending', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, isOpen, onClose }) => {
  const { updateRoom, deleteRoom } = useFacility();
  const { hasPermission } = useOrganization();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!room) return null;

  const occupancyStyle = OCCUPANCY_STYLES[room.occupancyState] || OCCUPANCY_STYLES.EMPTY;
  const isDoorOpen = room.doorState === 'open';

  // Demo simulator: toggle occupancy
  const handleToggleOccupancy = async () => {
    setIsUpdating(true);
    try {
      const isCurrentlyEmpty = room.occupancyState === 'EMPTY';
      const nextState: RoomOccupancyState = isCurrentlyEmpty ? 'OCCUPIED' : 'EMPTY';
      const nextOccupants = isCurrentlyEmpty ? Math.min(room.capacity, 2) : 0;
      const nextHvac: HvacState = isCurrentlyEmpty ? 'COMFORT' : 'ECO';

      await updateRoom(room.id, {
        occupancyState: nextState,
        estimatedOccupants: nextOccupants,
        occupancyConfidence: isCurrentlyEmpty ? 96 : 99,
        hvacState: nextHvac,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${room.name} from the digital twin?`)) {
      return;
    }
    await deleteRoom(room.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sentinel-100 text-sentinel-700 flex items-center justify-center font-bold text-sm">
              {room.roomNumber || 'RM'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{room.name}</h3>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Type: {room.roomType.replace('_', ' ')}
              </p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${occupancyStyle.bg} ${occupancyStyle.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${occupancyStyle.dot} animate-pulse`} />
            {occupancyStyle.label}
          </span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Active Alert Banner */}
        {room.hasActiveAlert && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  {room.activeAlertSeverity || 'CRITICAL'} PRIORITY EVENT
                </span>
                <span className="text-[10px] text-rose-500 font-medium">Triage Active</span>
              </div>
              <p className="text-xs text-rose-800 mt-1 leading-snug">{room.description}</p>
            </div>
          </div>
        )}

        {/* Zero-Camera Privacy Preservation Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-sentinel-900 font-semibold">
            <Lock className="w-4 h-4 text-sentinel-600 shrink-0" />
            <span>Zero Optical Cameras · 60GHz mmWave Point Cloud & Acoustic Energy</span>
          </div>
          <Badge variant="primary" size="sm">
            Privacy Preserved
          </Badge>
        </div>

        {/* Occupancy & Detection Confidence */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Estimated Occupancy (mmWave Radar)</span>
            <span className="font-bold text-slate-900">
              {room.estimatedOccupants} of {room.capacity} Max Capacity
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                room.estimatedOccupants > room.capacity
                  ? 'bg-rose-500'
                  : room.estimatedOccupants > 0
                  ? 'bg-sentinel-600'
                  : 'bg-slate-300'
              }`}
              style={{
                width: `${Math.min(100, (room.estimatedOccupants / (room.capacity || 1)) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sentinel-600" />
              Sensor Confidence: <strong>{room.occupancyConfidence || 0}%</strong>
            </span>
            <span>
              Threshold Policy:{' '}
              {room.privacyLevel === 'HIGH_PRIVACY' ? 'mmWave Posture Matrix' : 'Dual PIR+Radar'}
            </span>
          </div>
        </div>

        {/* Environmental Telemetry Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Active Environmental Telemetry
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Temp */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-base font-bold text-slate-900">
                {room.currentTemperature !== undefined ? `${room.currentTemperature}°C` : '21.5°C'}
              </p>
              <span className="text-[10px] text-slate-400">Target: 22.0°C</span>
            </div>

            {/* CO2 */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">CO₂ Air</span>
                <Wind className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-base font-bold text-slate-900">
                {room.currentCo2 !== undefined ? `${room.currentCo2} ppm` : '450 ppm'}
              </p>
              <span
                className={`text-[10px] font-semibold ${
                  (room.currentCo2 || 0) > 1000 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {(room.currentCo2 || 0) > 1000 ? 'High Threshold' : 'Optimal'}
              </span>
            </div>

            {/* Humidity */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-base font-bold text-slate-900">
                {room.currentHumidity !== undefined ? `${room.currentHumidity}%` : '45%'}
              </p>
              <span className="text-[10px] text-slate-400">Range: 40-60%</span>
            </div>

            {/* Sound / Acoustic */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-semibold uppercase">Acoustic</span>
                <Volume2 className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-base font-bold text-slate-900">
                {room.currentSoundLevel !== undefined ? `${room.currentSoundLevel} dB` : '32 dB'}
              </p>
              <span className="text-[10px] text-slate-400">Ambient</span>
            </div>
          </div>
        </div>

        {/* HVAC & Door State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Simulated HVAC */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sentinel-600" />
                SIMULATED HVAC
              </span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-sentinel-100 text-sentinel-700">
                {room.hvacState}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {room.hvacState === 'ECO'
                ? 'Vacancy detected. Setback temperature active to reduce carbon emissions.'
                : room.hvacState === 'VENTILATION_BOOST'
                ? 'Ventilation airflow increased to clear elevated CO2 concentrations.'
                : 'Comfort temperature profile maintained for active occupants.'}
            </p>
          </div>

          {/* Door Magnetic Sensor */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {isDoorOpen ? (
                  <DoorOpen className="w-4 h-4 text-amber-600" />
                ) : (
                  <DoorClosed className="w-4 h-4 text-emerald-600" />
                )}
                Door Magnetic Sensor
              </span>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                  isDoorOpen
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {room.doorState || 'closed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Magnetic reed switch state. Transitions trigger sensor fusion verification window.
            </p>
          </div>
        </div>

        {/* Footer controls & Quick simulator */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleOccupancy}
            isLoading={isUpdating}
            leftIcon={<Zap className="w-3.5 h-3.5 text-sentinel-600" />}
          >
            Simulate Occupancy Transition
          </Button>

          <div className="flex items-center gap-2">
            {hasPermission('room.delete') && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Room"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
