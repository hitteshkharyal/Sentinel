// ─────────────────────────────────────────────
// SENTINEL Web — Relocate & Assign ESP32 Device Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Building2, MapPin, Radio, ArrowRight } from 'lucide-react';
import type { Device } from '@sentinel/types';
import { useDevice } from '../../context/DeviceContext';
import { useFacility } from '../../context/FacilityContext';

interface AssignDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onAssigned?: () => void;
}

export const AssignDeviceModal: React.FC<AssignDeviceModalProps> = ({
  isOpen,
  onClose,
  device,
  onAssigned,
}) => {
  const { assignDevice } = useDevice();
  const { facilities, rooms } = useFacility();

  const [facilityId, setFacilityId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setFacilityId(device.facilityId || '');
      setRoomId(device.roomId || '');
      setError(null);
    }
  }, [device]);

  const filteredRooms = rooms.filter((r) => !facilityId || r.facilityId === facilityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    setError(null);

    if (!facilityId) {
      setError('Please select a target facility');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignDevice(device.id, facilityId, roomId || null);
      if (onAssigned) onAssigned();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to relocate device';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Relocate Node: ${device.deviceId}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Assignment Error">
            {error}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Radio className="w-3.5 h-3.5 text-sentinel-600" />
            <span>Connected Physical Hardware Nodes:</span>
          </div>
          <p className="text-slate-600">
            This ESP32 currently hosts <strong>{device.assignedSensorsCount} sensors</strong>.
            Moving this microcontroller will automatically update the spatial digital twin
            location of all connected sensors to maintain location consistency.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sentinel-600" />
              Target Facility *
            </label>
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                setRoomId('');
              }}
              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 text-slate-800"
              required
            >
              <option value="">Select Facility...</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sentinel-600" />
              Target Room / Area
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 text-slate-800"
              disabled={!facilityId}
            >
              <option value="">Unassigned (Common Area / Corridor)</option>
              {filteredRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} [{r.roomNumber}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Relocating...' : 'Update Spatial Twin'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Modal>
  );
};
