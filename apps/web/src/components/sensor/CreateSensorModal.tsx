// ─────────────────────────────────────────────
// SENTINEL Web — Register Sensor Node Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Cpu, Plus, Sparkles } from 'lucide-react';
import type {
  SensorCatalogItem,
  SensorType,
  SensorInterface,
  CreateSensorDTO,
} from '@sentinel/types';
import { useSensor } from '../../context/SensorContext';
import { useFacility } from '../../context/FacilityContext';

interface CreateSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCatalogItem?: SensorCatalogItem | null;
  initialRoomId?: string;
  initialFacilityId?: string;
  onCreated?: () => void;
}

export const CreateSensorModal: React.FC<CreateSensorModalProps> = ({
  isOpen,
  onClose,
  initialCatalogItem,
  initialRoomId,
  initialFacilityId,
  onCreated,
}) => {
  const { catalog, createSensor } = useSensor();
  const { facilities, rooms } = useFacility();

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    initialCatalogItem?.id || (catalog[0]?.id ?? '')
  );
  const [name, setName] = useState<string>('');
  const [facilityId, setFacilityId] = useState<string>(initialFacilityId || '');
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [deviceId, setDeviceId] = useState<string>('');
  const [interfaceType, setInterfaceType] = useState<SensorInterface>('UART');
  const [gpioPin, setGpioPin] = useState<string>('');
  const [i2cAddress, setI2cAddress] = useState<string>('');
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<number>(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when initial item changes
  useEffect(() => {
    if (initialCatalogItem) {
      setSelectedCatalogId(initialCatalogItem.id);
      applyCatalogDefaults(initialCatalogItem);
    }
  }, [initialCatalogItem]);

  // Sync initial spatial selection
  useEffect(() => {
    if (initialFacilityId) setFacilityId(initialFacilityId);
    if (initialRoomId) setRoomId(initialRoomId);
  }, [initialFacilityId, initialRoomId]);

  const applyCatalogDefaults = (item: SensorCatalogItem) => {
    setName(`${item.model} ${item.sensorType} Node`);
    setInterfaceType(item.interfaceType);
    setGpioPin(item.defaultPin !== undefined ? String(item.defaultPin) : '');
    setI2cAddress(item.defaultI2cAddress || '');
    setSamplingIntervalMs(item.defaultSamplingIntervalMs);
  };

  const handleCatalogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCatalogId(id);
    const item = catalog.find((c) => c.id === id);
    if (item) {
      applyCatalogDefaults(item);
    }
  };

  const currentItem = catalog.find((c) => c.id === selectedCatalogId) || catalog[0];

  const filteredRooms = facilityId
    ? rooms.filter((r) => r.facilityId === facilityId)
    : rooms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Sensor name is required.');
      return;
    }

    if (!currentItem) {
      setError('Please select a hardware sensor specification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateSensorDTO = {
        name: name.trim(),
        sensorType: currentItem.sensorType as SensorType,
        model: currentItem.model,
        manufacturer: currentItem.manufacturer,
        interfaceType,
        facilityId: facilityId || undefined,
        roomId: roomId || undefined,
        deviceId: deviceId.trim() || undefined,
        configuration: {
          gpioPin: gpioPin ? parseInt(gpioPin, 10) : undefined,
          i2cAddress: i2cAddress.trim() || undefined,
          samplingIntervalMs,
          unit: currentItem.unit,
        },
        enabled: true,
      };

      await createSensor(dto);
      if (onCreated) onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register sensor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Hardware Sensor Node</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Provision a physical sensor from catalog specifications into your spatial digital twin.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hardware Catalog Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Hardware Specification (Catalog Preset)</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-normal">
                <Sparkles className="w-3 h-3" /> Auto-configures pins & protocols
              </span>
            </label>
            <select
              value={selectedCatalogId}
              onChange={handleCatalogChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50"
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.sensorType}] {item.model} — {item.manufacturer} ({item.interfaceType})
                </option>
              ))}
            </select>
          </div>

          {/* Sensor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sensor Node Label / Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICU-101 mmWave Radar Doppler Node"
              required
            />
          </div>

          {/* Spatial Twin Association (Facility & Room) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign to Facility
              </label>
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  setRoomId('');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">-- Unassigned (Fleet / Spare) --</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign to Room Digital Twin
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">-- No Specific Room --</option>
                {filteredRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.roomNumber || 'N/A'}] {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Device ID / ESP32 Controller link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Microcontroller Device Identifier (Optional)
            </label>
            <Input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. ESP32-MED-042 or MAC AA:BB:CC:11:22:33"
            />
          </div>

          {/* Hardware Protocol & Electrical Pins */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider block">
              Hardware Bus & Wiring Mapping
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Interface Bus</label>
                <select
                  value={interfaceType}
                  onChange={(e) => setInterfaceType(e.target.value as SensorInterface)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="UART">UART (Serial)</option>
                  <option value="I2C">I2C Bus</option>
                  <option value="GPIO">GPIO Digital</option>
                  <option value="ADC">ADC Analog</option>
                  <option value="SPI">SPI High-Speed</option>
                  <option value="WIFI">WiFi Direct</option>
                  <option value="MQTT">MQTT Topic</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  GPIO Pin (0-48)
                </label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={gpioPin}
                  onChange={(e) => setGpioPin(e.target.value)}
                  placeholder="e.g. 18, 21, 34"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  I2C Hex Address
                </label>
                <input
                  type="text"
                  value={i2cAddress}
                  onChange={(e) => setI2cAddress(e.target.value)}
                  placeholder="e.g. 0x62, 0x44"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                Sampling Interval: <strong className="text-cyan-600 dark:text-cyan-400">{samplingIntervalMs} ms</strong>
              </label>
              <input
                type="range"
                min="100"
                max="30000"
                step="100"
                value={samplingIntervalMs}
                onChange={(e) => setSamplingIntervalMs(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Register Sensor'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
