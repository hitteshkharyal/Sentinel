// ─────────────────────────────────────────────
// SENTINEL Web — Register ESP32 Device Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import {
  Cpu,
  Key,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Wifi,
  Radio,
  Server,
  Layers,
} from 'lucide-react';
import type { ChipModel, PowerSource, DeviceRegistrationResponse } from '@sentinel/types';
import { useDevice } from '../../context/DeviceContext';
import { useFacility } from '../../context/FacilityContext';

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFacilityId?: string;
  initialRoomId?: string;
  onSuccess?: () => void;
}

export const RegisterDeviceModal: React.FC<RegisterDeviceModalProps> = ({
  isOpen,
  onClose,
  initialFacilityId,
  initialRoomId,
  onSuccess,
}) => {
  const { registerDevice } = useDevice();
  const { facilities, rooms } = useFacility();

  const [deviceId, setDeviceId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [facilityId, setFacilityId] = useState<string>(initialFacilityId || (facilities[0]?.id ?? ''));
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [chipModel, setChipModel] = useState<ChipModel>('ESP32-S3-WROOM-1');
  const [macAddress, setMacAddress] = useState<string>('');
  const [powerSource, setPowerSource] = useState<PowerSource>('MAINS');
  const [hardwareVersion, setHardwareVersion] = useState<string>('v3.2');
  const [firmwareVersion, setFirmwareVersion] = useState<string>('v1.0.0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<DeviceRegistrationResponse | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Filter rooms by selected facility
  const facilityRooms = rooms.filter((r) => r.facilityId === facilityId);

  const generateRandomMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const mac = `24:6F:28:${hex()}:${hex()}:${hex()}`;
    setMacAddress(mac);
  };

  const generateSuggestedId = () => {
    const selectedFac = facilities.find((f) => f.id === facilityId);
    const facCode = selectedFac?.code || 'FAC';
    const num = Math.floor(100 + Math.random() * 900);
    const chipShort = chipModel.includes('S3') ? 'S3' : chipModel.includes('C3') ? 'C3' : 'W32';
    setDeviceId(`ESP32-${chipShort}-${facCode}-${num}`);
    if (!name) {
      setName(`${selectedFac?.name || 'Facility'} Gateway ${num}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!deviceId.trim()) {
      setError('Device ID is required.');
      return;
    }
    if (!name.trim()) {
      setError('Device name is required.');
      return;
    }
    if (!facilityId) {
      setError('Facility selection is required.');
      return;
    }
    if (!macAddress.trim()) {
      setError('MAC Address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerDevice({
        deviceId: deviceId.trim().toUpperCase(),
        name: name.trim(),
        facilityId,
        roomId: roomId || undefined,
        chipModel,
        macAddress: macAddress.trim().toUpperCase(),
        powerSource,
        hardwareVersion,
        firmwareVersion,
      });

      setRegisteredData(result);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleResetAndClose = () => {
    setRegisteredData(null);
    setDeviceId('');
    setName('');
    setMacAddress('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sentinel-100 text-sentinel-700">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-900">
            {registeredData ? 'Microcontroller Cryptographic Credentials' : 'Register ESP32 Microcontroller'}
          </span>
        </div>
      }
      description={
        registeredData
          ? 'Secure one-time cryptographic token generated. Store this key immediately.'
          : 'Provision an authorized ESP32 hardware gateway node into your spatial digital twin.'
      }
      maxWidth="2xl"
    >
      {registeredData ? (
        <div className="space-y-5 py-2 animate-fade-in">
          <Alert
            variant="warning"
            icon={<ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />}
          >
            <div>
              <p className="font-semibold text-amber-900">One-Time Provisioning Secret</p>
              <p className="text-xs text-amber-800 mt-0.5">
                For cryptographic zero-trust security, this token is stored as a salted hash and will{' '}
                <strong className="underline">never be displayed again</strong>. Flash it directly into your
                ESP32 NVS partition or config header.
              </p>
            </div>
          </Alert>

          {/* Token Card */}
          <div className="bg-slate-900 rounded-xl p-4 text-slate-100 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Plaintext Device Secret Key
              </span>
              <button
                type="button"
                onClick={() => handleCopy(registeredData.credentials.token)}
                className="flex items-center gap-1 text-xs text-sentinel-400 hover:text-sentinel-300 font-medium py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 break-all select-all border border-slate-800">
              {registeredData.credentials.token}
            </div>
          </div>

          {/* MQTT Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-sentinel-600" /> MQTT Client ID
              </span>
              <p className="font-mono text-slate-800 font-semibold">{registeredData.credentials.mqttClientId}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-sentinel-600" /> Telemetry Topic Prefix
              </span>
              <p className="font-mono text-slate-800 font-semibold truncate" title={registeredData.credentials.mqttTopicPrefix}>
                {registeredData.credentials.mqttTopicPrefix}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-sentinel-50/50 border border-sentinel-100 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-sentinel-900">Ready for Telemetry Ingestion</p>
              <p className="text-slate-500">
                Device <code className="text-sentinel-700 font-bold">{registeredData.device.deviceId}</code> is in{' '}
                <Badge variant="warning" size="sm">PROVISIONING</Badge> state.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleResetAndClose}>
              Complete & Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Device ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Device Hardware ID</label>
                <button
                  type="button"
                  onClick={generateSuggestedId}
                  className="text-[11px] text-sentinel-600 hover:text-sentinel-700 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Suggest
                </button>
              </div>
              <Input
                placeholder="e.g. ESP32-S3-ICU-01"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Friendly Gateway Name</label>
              <Input
                placeholder="e.g. ICU Room 204 Telemetry Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Spatial Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Building</label>
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  setRoomId('');
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
                required
              >
                <option value="">Select Facility...</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room / Digital Twin (Optional)
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
              >
                <option value="">Unassigned / Corridor Gateway</option>
                {facilityRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Room {r.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hardware Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chip Architecture</label>
              <select
                value={chipModel}
                onChange={(e) => setChipModel(e.target.value as ChipModel)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white font-mono"
              >
                <option value="ESP32-S3-WROOM-1">ESP32-S3 (Xtensa Dual-Core 240MHz, Vector AI)</option>
                <option value="ESP32-WROOM-32D">ESP32-WROOM-32D (Xtensa Dual-Core 240MHz, Classic)</option>
                <option value="ESP32-WROOM-32U">ESP32-WROOM-32U (U.FL External Antenna)</option>
                <option value="ESP32-C3-MINI">ESP32-C3 (RISC-V Single-Core 160MHz)</option>
                <option value="ESP32-CAM">ESP32-CAM (Zero-Camera Hardware Modified)</option>
                <option value="ESP32-GENERIC">ESP32-GENERIC (Standard Module)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Physical MAC Address</label>
                <button
                  type="button"
                  onClick={generateRandomMac}
                  className="text-[11px] text-sentinel-600 hover:text-sentinel-700 flex items-center gap-1 font-medium"
                >
                  <Wifi className="w-3 h-3" /> Generate MAC
                </button>
              </div>
              <Input
                placeholder="24:6F:28:XX:XX:XX"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                className="font-mono text-xs"
                required
              />
            </div>
          </div>

          {/* Power & Versions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Power Source</label>
              <select
                value={powerSource}
                onChange={(e) => setPowerSource(e.target.value as PowerSource)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
              >
                <option value="MAINS">Mains AC / DC Adaptor</option>
                <option value="POE">Power over Ethernet (PoE)</option>
                <option value="BATTERY">Battery / Solar Backup</option>
                <option value="USB">5V USB-C Peripheral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hardware PCB Rev</label>
              <Input
                value={hardwareVersion}
                onChange={(e) => setHardwareVersion(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Firmware Target</label>
              <Input
                value={firmwareVersion}
                onChange={(e) => setFirmwareVersion(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              Registering generates a 192-bit cryptographic device key that must be presented on MQTT telemetry
              publications and HTTP heartbeat packets.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Provision Microcontroller'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
