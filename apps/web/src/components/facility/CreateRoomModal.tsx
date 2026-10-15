// ─────────────────────────────────────────────
// SENTINEL Web — Create Room & Spatial Area Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { LayoutGrid, Plus, Lock } from 'lucide-react';
import type { RoomType, RoomPrivacyLevel } from '@sentinel/types';
import { useFacility } from '../../context/FacilityContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ROOM_TYPES: { type: RoomType; label: string; icon: string }[] = [
  { type: 'hospital_room', label: 'Hospital Patient Room', icon: '🏥' },
  { type: 'hotel_room', label: 'Hotel Suite / Room', icon: '🏨' },
  { type: 'classroom', label: 'Classroom / Lecture Hall', icon: '🏫' },
  { type: 'bus', label: 'Transit Bus Passenger Cabin', icon: '🚌' },
  { type: 'meeting_room', label: 'Conference / Boardroom', icon: '👥' },
  { type: 'office', label: 'Private Office / Workstation', icon: '💼' },
  { type: 'factory_zone', label: 'Industrial Workcell / Zone', icon: '🏭' },
  { type: 'warehouse_zone', label: 'Warehouse / Cold Storage Bay', icon: '📦' },
  { type: 'mall_zone', label: 'Retail / Mall Concourse', icon: '🛍️' },
  { type: 'restroom', label: 'Private Restroom (Zero Cameras)', icon: '🚻' },
  { type: 'elevator', label: 'Elevator Shaft / Cabin', icon: '🛗' },
  { type: 'parking_zone', label: 'Parking Bay / Garage Zone', icon: '🅿️' },
  { type: 'lobby', label: 'Reception / Lobby', icon: '🏛️' },
  { type: 'corridor', label: 'Circulation Corridor', icon: '🚶' },
  { type: 'storage', label: 'Equipment Storage', icon: '🗄️' },
  { type: 'general', label: 'General Spatial Area', icon: '🌐' },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { selectedFacility, selectedFloor, createRoom } = useFacility();
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('hospital_room');
  const [capacity, setCapacity] = useState<number>(2);
  const [privacyLevel, setPrivacyLevel] = useState<RoomPrivacyLevel>('HIGH_PRIVACY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !selectedFloor) {
      setError('Please select a facility and floor first.');
      return;
    }

    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createRoom({
        facilityId: selectedFacility.id,
        floorId: selectedFloor.id,
        name: name.trim(),
        roomNumber: roomNumber.trim() || undefined,
        roomType,
        capacity: Number(capacity) || 4,
        privacyLevel,
        description: description.trim() || undefined,
      });

      setName('');
      setRoomNumber('');
      setDescription('');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span>Add Room to Digital Twin</span>
        </div>
      }
      description={`Configuring space in ${selectedFacility?.name} · ${selectedFloor?.name}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Unable to add room">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Room / Area Name"
              placeholder="e.g. Inpatient Care Room 204"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Input
            label="Room #"
            placeholder="e.g. 204"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Space Function & Room Classification
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {ROOM_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setRoomType(item.type)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                  roomType === item.type
                    ? 'border-sentinel-500 bg-sentinel-50 text-sentinel-900 font-semibold ring-1 ring-sentinel-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Design Max Capacity (Occupants)"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Privacy Guarantee Profile
            </label>
            <select
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              value={privacyLevel}
              onChange={(e) => setPrivacyLevel(e.target.value as RoomPrivacyLevel)}
            >
              <option value="HIGH_PRIVACY">High Privacy (Zero Cameras · mmWave Only)</option>
              <option value="STANDARD">Standard Environmental Monitoring</option>
              <option value="RESTRICTED_ACCESS">Restricted Access / High Security</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description & Context <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            placeholder="Pediatric recovery room with continuous fall and posture presence monitoring..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-[11px] text-sentinel-900">
          <Lock className="w-4 h-4 text-sentinel-600 shrink-0 mt-0.5" />
          <p>
            <strong>Privacy Preservation Guarantee:</strong> This room will be protected with zero
            optical cameras or microphones. All occupancy and fall telemetry will be driven
            exclusively by 60GHz mmWave radar point clouds and acoustic energy thresholds.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Room to Twin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
