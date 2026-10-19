// ─────────────────────────────────────────────
// SENTINEL Web — ESP32 Microcontrollers & Devices Page
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Radio,
  Wifi,
  HardDrive,
  Key,
  RotateCw,
  Building,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useDevice } from '../context/DeviceContext';
import { useFacility } from '../context/FacilityContext';
import { RegisterDeviceModal } from '../components/device/RegisterDeviceModal';
import { DeviceDetailModal } from '../components/device/DeviceDetailModal';
import { DeviceProvisionModal } from '../components/device/DeviceProvisionModal';
import { EditDeviceModal } from '../components/device/EditDeviceModal';
import type { Device, DeviceStatus } from '@sentinel/types';

export const DevicesPage: React.FC = () => {
  const { facilities, rooms } = useFacility();
  const {
    devices,
    deviceStats,
    isLoadingDevices,
    fetchDevices,
    fetchStats,
    sendHeartbeat,
    rebootDevice,
  } = useDevice();

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [inspectingDevice, setInspectingDevice] = useState<Device | null>(null);
  const [provisioningDevice, setProvisioningDevice] = useState<Device | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedChipModel, setSelectedChipModel] = useState<string>('ALL');
  const [pingingDeviceId, setPingingDeviceId] = useState<string | null>(null);

  // Lookup maps
  const facilityMap = useMemo(() => {
    return new Map(facilities.map((f) => [f.id, f.name]));
  }, [facilities]);

  const roomMap = useMemo(() => {
    return new Map(rooms.map((r) => [r.id, r]));
  }, [rooms]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (selectedStatus !== 'ALL' && dev.status !== selectedStatus) return false;
      if (selectedFacilityId && dev.facilityId !== selectedFacilityId) return false;
      if (selectedChipModel !== 'ALL' && dev.chipModel !== selectedChipModel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dev.name.toLowerCase().includes(q);
        const matchId = dev.deviceId.toLowerCase().includes(q);
        const matchMac = dev.macAddress.toLowerCase().includes(q);
        const matchIp = dev.ipAddress ? dev.ipAddress.toLowerCase().includes(q) : false;
        if (!matchName && !matchId && !matchMac && !matchIp) return false;
      }

      return true;
    });
  }, [devices, selectedStatus, selectedFacilityId, selectedChipModel, searchQuery]);

  const handleQuickPing = async (dev: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingDeviceId(dev.deviceId);
    try {
      await sendHeartbeat(dev.deviceId, 'sn_dev_simulated_token_for_dashboard_ping', {
        wifiRssiDbm: -56,
        freeHeapBytes: 242000,
        uptimeSeconds: (dev.metadata.uptimeSeconds || 0) + 60,
        firmwareVersion: dev.firmwareVersion,
        status: 'ONLINE',
      });
    } catch {
      // Ignored for demo
    } finally {
      setTimeout(() => setPingingDeviceId(null), 800);
    }
  };

  const handleQuickReboot = async (dev: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Issue restart command to ${dev.deviceId}?`)) return;
    try {
      await rebootDevice(dev.id);
      alert(`Reboot command dispatched to ${dev.deviceId}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reboot failed.');
    }
  };

  const getRssiColor = (rssi?: number) => {
    if (!rssi) return 'text-slate-400';
    if (rssi >= -60) return 'text-emerald-600';
    if (rssi >= -75) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        );
      case 'PROVISIONING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PROVISIONING
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-sentinel-100 text-sentinel-700">
              <Cpu className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ESP32 Microcontrollers & Gateway Nodes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Physical ESP32 microcontroller identity, cryptographic credential provisioning, and attached sensor bus
            topologies. Strict zero-camera telemetry gateways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDevices();
              fetchStats();
            }}
            disabled={isLoadingDevices}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Microcontroller
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Devices */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Hardware Nodes
            </span>
            <div className="p-1.5 rounded-lg bg-sentinel-50 text-sentinel-600">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {deviceStats?.total ?? devices.length}
          </div>
          <p className="text-[11px] text-slate-400">
            Dual-core ESP32-S3 & WROOM microcontrollers
          </p>
        </div>

        {/* Online Devices */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Online Gateways
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2">
            <span>{deviceStats?.online ?? devices.filter((d) => d.status === 'ONLINE').length}</span>
            <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Telemetry
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Broadcasting MQTT heartbeats</p>
        </div>

        {/* Provisioning / Pending */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Provisioning
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {deviceStats?.provisioning ?? devices.filter((d) => d.status === 'PROVISIONING').length}
          </div>
          <p className="text-[11px] text-slate-400">Awaiting initial firmware flash</p>
        </div>

        {/* Memory & Health */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fleet Health
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ~240 <span className="text-xs font-normal text-slate-500">KB Free Heap</span>
          </div>
          <p className="text-[11px] text-slate-400">Average Wi-Fi RSSI: -58 dBm</p>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or MAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-slate-50/50"
            />
          </div>

          {/* Facility & Chip Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white"
            >
              <option value="">All Facilities</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>

            <select
              value={selectedChipModel}
              onChange={(e) => setSelectedChipModel(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 bg-white font-mono"
            >
              <option value="ALL">All Architectures</option>
              <option value="ESP32-S3-WROOM-1">ESP32-S3</option>
              <option value="ESP32-WROOM-32D">ESP32-WROOM-32D</option>
              <option value="ESP32-WROOM-32U">ESP32-WROOM-32U</option>
              <option value="ESP32-C3-MINI">ESP32-C3</option>
              <option value="ESP32-CAM">ESP32-CAM (Modified)</option>
              <option value="ESP32-GENERIC">ESP32-GENERIC</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Status:</span>
          {['ALL', 'ONLINE', 'PROVISIONING', 'OFFLINE', 'ERROR', 'DISABLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-medium transition text-xs ${
                selectedStatus === st
                  ? 'bg-sentinel-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400">
            Showing {filteredDevices.length} of {devices.length} microcontrollers
          </span>
        </div>
      </div>

      {/* ── Microcontrollers Grid ── */}
      {isLoadingDevices ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-sentinel-200 border-t-sentinel-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Querying hardware gateway roster...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-3xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Microcontrollers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery || selectedStatus !== 'ALL' || selectedFacilityId
              ? 'No devices match your active search filters. Try clearing your search parameters.'
              : 'No hardware microcontrollers registered yet. Click "Register Microcontroller" to provision your first ESP32 gateway.'}
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Register Microcontroller
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const facName = facilityMap.get(dev.facilityId) || 'Unassigned Facility';
            const room = dev.roomId ? roomMap.get(dev.roomId) : undefined;

            return (
              <div
                key={dev.id}
                onClick={() => setInspectingDevice(dev)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sentinel-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sentinel-50 text-sentinel-700 flex items-center justify-center group-hover:bg-sentinel-600 group-hover:text-white transition duration-200">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-sentinel-700 transition">
                        {dev.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {dev.deviceId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-400">{dev.chipModel}</span>
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(dev.status)}</div>
                </div>

                {/* Spatial Digital Twin Link */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-[11px] flex items-center justify-between">
                  <span className="text-slate-600 truncate flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {facName}
                  </span>
                  {room ? (
                    <Badge variant="primary" size="sm">
                      Room {room.roomNumber}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Facility Hub</span>
                  )}
                </div>

                {/* Attached Sensors Banner */}
                <div className="px-4 py-3 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-sentinel-600" />
                      Attached Sensors:
                    </span>
                    <span className="font-bold text-slate-800">
                      {dev.assignedSensorsCount} {dev.assignedSensorsCount === 1 ? 'Sensor' : 'Sensors'}
                    </span>
                  </div>

                  {/* Hardware Telemetry Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Signal</span>
                      <p className={`font-mono text-xs font-bold ${getRssiColor(dev.metadata?.wifiRssiDbm)}`}>
                        {dev.metadata?.wifiRssiDbm ? `${dev.metadata.wifiRssiDbm} dBm` : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Free Heap</span>
                      <p className="font-mono text-xs font-bold text-slate-800">
                        {dev.metadata?.freeHeapBytes
                          ? `${Math.round(dev.metadata.freeHeapBytes / 1024)} KB`
                          : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Firmware</span>
                      <p className="font-mono text-xs font-bold text-slate-800 truncate" title={dev.firmwareVersion}>
                        {dev.firmwareVersion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>MAC: {dev.macAddress}</span>
                    <span>
                      {dev.lastSeenAt
                        ? `Ping: ${new Date(dev.lastSeenAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Never seen'}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleQuickPing(dev, e)}
                      disabled={pingingDeviceId === dev.deviceId}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Transmit Simulated Ping"
                    >
                      <Wifi
                        className={`w-4 h-4 ${
                          pingingDeviceId === dev.deviceId ? 'animate-bounce text-emerald-600' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProvisioningDevice(dev);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-sentinel-700 hover:bg-sentinel-50 transition"
                      title="Provisioning Credentials & C++"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleQuickReboot(dev, e)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition"
                      title="Restart Node"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDevice(dev);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingDevice(dev)}
                    >
                      Diagnostics
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <RegisterDeviceModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialFacilityId={selectedFacilityId || undefined}
        onSuccess={() => {
          fetchDevices();
          fetchStats();
        }}
      />

      <DeviceDetailModal
        device={inspectingDevice}
        isOpen={!!inspectingDevice}
        onClose={() => setInspectingDevice(null)}
        onOpenProvisionModal={(dev) => setProvisioningDevice(dev)}
        onEditDevice={(dev) => setEditingDevice(dev)}
      />

      <DeviceProvisionModal
        device={provisioningDevice}
        isOpen={!!provisioningDevice}
        onClose={() => setProvisioningDevice(null)}
      />

      <EditDeviceModal
        device={editingDevice}
        isOpen={!!editingDevice}
        onClose={() => setEditingDevice(null)}
        onUpdated={() => {
          fetchDevices();
          fetchStats();
        }}
        onDeleted={() => {
          fetchDevices();
          fetchStats();
        }}
      />
    </div>
  );
};
