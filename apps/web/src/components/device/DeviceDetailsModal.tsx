// ─────────────────────────────────────────────
// SENTINEL Web — Deep Device & Telemetry Inspector Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  Cpu,
  Wifi,
  HardDrive,
  Clock,
  BatteryCharging,
  Key,
  Radio,
  RefreshCw,
  Trash2,
  MapPin,
  Building2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import type { Device, SensorEntity } from '@sentinel/types';
import { useDevice } from '../../context/DeviceContext';
import { useFacility } from '../../context/FacilityContext';

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onOpenAssign?: (device: Device) => void;
  onDeleted?: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  isOpen,
  onClose,
  device,
  onOpenAssign,
  onDeleted,
}) => {
  const {
    fetchDeviceDetails,
    selectedDeviceDetails,
    rotateSecret,
    deleteDevice,
    simulateHeartbeat,
  } = useDevice();
  const { facilities, rooms } = useFacility();

  const [copiedId, setCopiedId] = useState(false);
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    variant: 'success' | 'danger';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      setRotatedToken(null);
      setActionMessage(null);
      void fetchDeviceDetails(device.id);
    }
  }, [device, isOpen, fetchDeviceDetails]);

  if (!device) return null;

  const currentDevice = selectedDeviceDetails?.device || device;
  const sensors = selectedDeviceDetails?.sensors || [];
  const facility = facilities.find((f) => f.id === currentDevice.facilityId);
  const room = rooms.find((r) => r.id === currentDevice.roomId);

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentDevice.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRotateSecret = async () => {
    if (
      !window.confirm(
        'Are you sure you want to rotate this device secret key? The existing key will be immediately revoked.'
      )
    ) {
      return;
    }
    setIsRotating(true);
    setActionMessage(null);
    try {
      const res = await rotateSecret(currentDevice.id, 'Operator manual console rotation');
      setRotatedToken(res.token);
      setActionMessage({
        variant: 'success',
        text: 'Credentials rotated successfully! Update your microcontroller flash config.',
      });
      void fetchDeviceDetails(currentDevice.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rotate secret';
      setActionMessage({ variant: 'danger', text: msg });
    } finally {
      setIsRotating(false);
    }
  };

  const handleSimulatePing = async () => {
    setIsPinging(true);
    setActionMessage(null);
    try {
      // In demo/test mode, we ping with the rotated token or a test token
      const token = rotatedToken || 'sent_dev_demo_test_token';
      await simulateHeartbeat(currentDevice.deviceId, token, {
        status: 'ONLINE',
        wifiRssiDbm: -56,
        freeHeapBytes: 198400,
        uptimeSeconds: (currentDevice.metadata.uptimeSeconds || 1000) + 60,
      });
      setActionMessage({
        variant: 'success',
        text: 'Heartbeat acknowledged by backend. Device status updated to ONLINE.',
      });
      void fetchDeviceDetails(currentDevice.id);
    } catch {
      // If no token was provided, explain to operator
      setActionMessage({
        variant: 'danger',
        text: 'Heartbeat ping requires active device token. Rotate secret first to acquire current token.',
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${currentDevice.deviceId}? Connected sensors will be unlinked.`
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDevice(currentDevice.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete device';
      setActionMessage({ variant: 'danger', text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <Badge variant="success" className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </Badge>
        );
      case 'PROVISIONING':
      case 'UPDATING':
        return (
          <Badge variant="warning" className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{status}</span>
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="danger" className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>ERROR</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentDevice.name}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {actionMessage && (
          <Alert variant={actionMessage.variant} title="System Feedback">
            {actionMessage.text}
          </Alert>
        )}

        {/* ── TOP HERO BANNER ── */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shrink-0 text-sentinel-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono tracking-tight">
                  {currentDevice.deviceId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Device ID"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                  {currentDevice.chipModel}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px]">MAC: {currentDevice.macAddress}</span>
                {currentDevice.ipAddress && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">IP: {currentDevice.ipAddress}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(currentDevice.status)}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenAssign && onOpenAssign(currentDevice)}
              className="text-xs shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Relocate</span>
            </Button>
          </div>
        </div>

        {/* ── ROTATED CREDENTIAL BANNER (IF ROTATED IN CURRENT SESSION) ── */}
        {rotatedToken && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                New Secret Token Generated:
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rotatedToken);
                  setActionMessage({ variant: 'success', text: 'Token copied to clipboard!' });
                }}
                className="text-[11px] font-semibold text-amber-800 hover:underline"
              >
                Copy Key
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={rotatedToken}
              className="w-full font-mono text-xs px-2.5 py-1.5 bg-white border border-amber-300 rounded text-slate-800 select-all"
            />
          </div>
        )}

        {/* ── HARDWARE METRICS GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* RSSI Signal */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3 h-3 text-sentinel-600" />
              Wi-Fi RSSI
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-800">
                {currentDevice.metadata.wifiRssiDbm
                  ? `${currentDevice.metadata.wifiRssiDbm} dBm`
                  : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentDevice.metadata.wifiRssiDbm &&
              currentDevice.metadata.wifiRssiDbm > -65
                ? 'Strong Signal'
                : 'Adequate'}
            </span>
          </div>

          {/* Free Heap */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-indigo-600" />
              Free Heap RAM
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-800">
                {currentDevice.metadata.freeHeapBytes
                  ? `${Math.round(currentDevice.metadata.freeHeapBytes / 1024)} KB`
                  : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentDevice.metadata.freeHeapBytes ? 'Nominal headroom' : 'Pending ping'}
            </span>
          </div>

          {/* Uptime */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" />
              System Uptime
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-800">
                {formatUptime(currentDevice.metadata.uptimeSeconds)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Firmware {currentDevice.firmwareVersion}
            </span>
          </div>

          {/* Power Source */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-amber-600" />
              Power Source
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-800">
                {currentDevice.metadata.powerSource || 'MAINS'}
              </span>
              {currentDevice.metadata.batteryPercent !== undefined && (
                <span className="text-xs text-emerald-600 font-semibold">
                  ({currentDevice.metadata.batteryPercent}%)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Hardware {currentDevice.hardwareVersion}
            </span>
          </div>
        </div>

        {/* ── SPATIAL PLACEMENT SUMMARY ── */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Spatial Twin:</span>
            <span className="font-semibold text-slate-800">
              {facility?.name || 'Unassigned Facility'}
            </span>
            <span>→</span>
            <span className="font-semibold text-slate-800">
              {room ? `${room.name} (${room.roomNumber})` : 'Common / Corridor Area'}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Registered: {new Date(currentDevice.registeredAt).toLocaleDateString()}
          </span>
        </div>

        {/* ── ATTACHED SENSORS LIST ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sentinel-600" />
              <span>Connected Physical Sensors ({sensors.length})</span>
            </h4>
          </div>

          {sensors.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Radio className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">
                No physical sensors currently linked to this ESP32 device ID.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Go to the Sensor Catalog to deploy sensors onto {currentDevice.deviceId}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {sensors.map((s: SensorEntity) => (
                <div
                  key={s.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sentinel-50 text-sentinel-600 border border-sentinel-200 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{s.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {s.sensorType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                        <span>Bus: {s.interfaceType}</span>
                        {s.configuration?.gpioPin !== undefined && (
                          <span>• GPIO {s.configuration.gpioPin}</span>
                        )}
                        {s.configuration?.i2cAddress && (
                          <span>• I2C: {s.configuration.i2cAddress}</span>
                        )}
                        <span>• Interval: {s.configuration?.samplingIntervalMs}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={s.status === 'ONLINE' ? 'success' : 'neutral'}
                      className="text-[10px]"
                    >
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CONSOLE ACTIONS FOOTER ── */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSimulatePing}
              disabled={isPinging}
              className="text-xs flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isPinging ? 'Pinging...' : 'Simulate Ping'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRotateSecret}
              disabled={isRotating}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>Rotate Secret Key</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Node</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
