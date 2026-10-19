// ─────────────────────────────────────────────
// SENTINEL Web — Edit ESP32 Device Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Trash2, Edit3 } from 'lucide-react';
import type { Device, DeviceStatus } from '@sentinel/types';
import { useDevice } from '../../context/DeviceContext';
import { useFacility } from '../../context/FacilityContext';

interface EditDeviceModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const { updateDevice, deleteDevice } = useDevice();
  const { facilities, rooms } = useFacility();

  const [name, setName] = useState<string>('');
  const [facilityId, setFacilityId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [firmwareVersion, setFirmwareVersion] = useState<string>('');
  const [status, setStatus] = useState<DeviceStatus>('ONLINE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setName(device.name);
      setFacilityId(device.facilityId);
      setRoomId(device.roomId || '');
      setFirmwareVersion(device.firmwareVersion);
      setStatus(device.status);
    }
  }, [device]);

  if (!device) return null;

  const facilityRooms = rooms.filter((r) => r.facilityId === facilityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await updateDevice(device.id, {
        name: name.trim(),
        facilityId,
        roomId: roomId || null,
        firmwareVersion: firmwareVersion.trim(),
        status,
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to decommission microcontroller ${device.deviceId}? Connected sensors will be unlinked.`
      )
    ) {
      return;
    }

    try {
      await deleteDevice(device.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Decommission failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sentinel-100 text-sentinel-700">
            <Edit3 className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-900">
            Edit Microcontroller: {device.deviceId}
          </span>
        </div>
      }
      description="Update microcontroller spatial digital twin assignment, status, and firmware version."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && <Alert variant="danger">{error}</Alert>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Gateway Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility</label>
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                setRoomId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
              required
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Assignment</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
            >
              <option value="">Unassigned (Building Gateway)</option>
              {facilityRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Room {r.roomNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Override</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DeviceStatus)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
            >
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="PROVISIONING">PROVISIONING</option>
              <option value="UPDATING">UPDATING (OTA)</option>
              <option value="DISABLED">DISABLED</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Firmware</label>
            <Input
              value={firmwareVersion}
              onChange={(e) => setFirmwareVersion(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Decommission Node
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
