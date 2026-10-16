// ─────────────────────────────────────────────
// SENTINEL Web — Sensors & Hardware Configuration Page
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  Settings,
  Compass,
  Plus,
  Search,
  Radio,
  Trash2,
  Power,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useSensor } from '../context/SensorContext';
import { useFacility } from '../context/FacilityContext';
import { useOrganization } from '../context/OrganizationContext';
import { SensorCatalogModal } from '../components/sensor/SensorCatalogModal';
import { CreateSensorModal } from '../components/sensor/CreateSensorModal';
import { ConfigureSensorModal } from '../components/sensor/ConfigureSensorModal';
import { CalibrateSensorModal } from '../components/sensor/CalibrateSensorModal';
import type {
  SensorEntity,
  SensorCatalogItem,
  SensorCategory,
} from '@sentinel/types';

export const SensorsPage: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { facilities, rooms } = useFacility();
  const {
    sensors,
    catalog,
    isLoadingSensors,
    updateSensor,
    deleteSensor,
  } = useSensor();

  // Modal states
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SensorCatalogItem | null>(null);
  const [configuringSensor, setConfiguringSensor] = useState<SensorEntity | null>(null);
  const [calibratingSensor, setCalibratingSensor] = useState<SensorEntity | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SensorCategory | 'ALL'>('ALL');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Room & Facility Lookup Maps
  const facilityMap = useMemo(() => {
    return new Map(facilities.map((f) => [f.id, f.name]));
  }, [facilities]);

  const roomMap = useMemo(() => {
    return new Map(rooms.map((r) => [r.id, r]));
  }, [rooms]);

  // Filtered sensor list
  const filteredSensors = useMemo(() => {
    return sensors.filter((sensor) => {
      const matchesSearch =
        searchQuery === '' ||
        sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sensor.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sensor.sensorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sensor.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || sensor.category === selectedCategory;

      const matchesFacility =
        selectedFacilityId === '' || sensor.facilityId === selectedFacilityId;

      const matchesStatus =
        selectedStatus === 'ALL' || sensor.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesFacility && matchesStatus;
    });
  }, [sensors, searchQuery, selectedCategory, selectedFacilityId, selectedStatus]);

  // Metrics
  const onlineCount = sensors.filter((s) => s.status === 'ONLINE' && s.enabled).length;
  const mmwaveCount = sensors.filter((s) => s.sensorType === 'MMWAVE').length;
  const envCount = sensors.filter((s) => s.category === 'ENVIRONMENTAL').length;

  const handleToggleEnabled = async (sensor: SensorEntity) => {
    try {
      await updateSensor(sensor.id, { enabled: !sensor.enabled });
    } catch (err) {
      console.error('Failed to toggle sensor:', err);
    }
  };

  const handleDelete = async (sensor: SensorEntity) => {
    if (window.confirm(`Are you sure you want to remove sensor "${sensor.name}"?`)) {
      try {
        await deleteSensor(sensor.id);
      } catch (err) {
        console.error('Failed to delete sensor:', err);
      }
    }
  };

  const handleDeployFromCatalog = (item: SensorCatalogItem) => {
    setSelectedCatalogItem(item);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Hardware Sensors & Digital Twin Nodes
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Multi-protocol sensor nodes for{' '}
            <strong className="text-cyan-400">{currentOrganization?.name || 'Active Workspace'}</strong>.
            Zero optical cameras or acoustic surveillance recording platform-wide.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          <Button
            variant="secondary"
            onClick={() => setIsCatalogOpen(true)}
            className="flex items-center gap-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 font-medium"
          >
            <Layers className="w-4 h-4" />
            Browse Catalog ({catalog.length} Specs)
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setSelectedCatalogItem(null);
              setIsCreateOpen(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Sensor
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Total Deployed Nodes
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{sensors.length}</span>
            <span className="text-[11px] text-cyan-400 font-mono">Sensors Active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Online & Transmitting
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{onlineCount}</span>
            <span className="text-[11px] text-emerald-400/80 font-mono">
              {sensors.length > 0 ? `${Math.round((onlineCount / sensors.length) * 100)}% Live` : 'Ready'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Radar Doppler Arrays
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-300 font-mono">{mmwaveCount}</span>
            <span className="text-[11px] text-slate-400">24GHz FMCW Units</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Environmental Telemetry
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-300 font-mono">{envCount}</span>
            <span className="text-[11px] text-slate-400">CO2 / Temp / Sound</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by sensor name, model, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Spatial & Status Selectors */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="CALIBRATING">Calibrating</option>
              <option value="UNPROVISIONED">Unprovisioned</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
          {[
            { key: 'ALL', label: 'All Categories' },
            { key: 'PRESENCE_MOTION', label: 'Radar & Motion' },
            { key: 'ENVIRONMENTAL', label: 'Air, Temp & Sound' },
            { key: 'SAFETY_HAZARD', label: 'Safety, Gas & Flame' },
            { key: 'STRUCTURAL_POWER', label: 'Power & Sonar' },
            { key: 'ACCESS_TELEMETRY', label: 'Access, Reed & GPS' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as SensorCategory | 'ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Nodes Grid */}
      {isLoadingSensors ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Loading sensor digital twin telemetry...
        </div>
      ) : filteredSensors.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/30 border border-white/5 space-y-3">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Sensor Nodes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL' || selectedFacilityId
              ? 'No sensors match your active filters. Try resetting the search or category.'
              : 'Register your first hardware sensor from the pre-configured hardware catalog.'}
          </p>
          <Button
            variant="primary"
            onClick={() => setIsCatalogOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
          >
            Explore 18 Pre-Configured Sensor Profiles
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => {
            const room = sensor.roomId ? roomMap.get(sensor.roomId) : null;
            const facilityName = sensor.facilityId
              ? facilityMap.get(sensor.facilityId)
              : null;

            return (
              <div
                key={sensor.id}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  !sensor.enabled
                    ? 'bg-slate-950/40 border-white/5 opacity-60'
                    : sensor.status === 'ONLINE'
                    ? 'bg-slate-900/70 border-white/10 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5'
                    : 'bg-slate-900/50 border-white/5'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {sensor.sensorType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {sensor.interfaceType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !sensor.enabled
                            ? 'bg-slate-600'
                            : sensor.status === 'ONLINE'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            : sensor.status === 'CALIBRATING'
                            ? 'bg-purple-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-slate-400">
                        {sensor.enabled ? sensor.status : 'DISABLED'}
                      </span>
                    </div>
                  </div>

                  {/* Sensor Name & Model */}
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {sensor.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {sensor.model} • <span className="text-slate-300">{sensor.manufacturer}</span>
                  </p>

                  {/* Spatial Twin Location Breadcrumb */}
                  <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate">
                      📍 {facilityName || 'Unassigned Facility'}
                    </span>
                    {room && (
                      <span className="text-cyan-400 font-semibold truncate ml-2">
                        [{room.roomNumber || 'N/A'}] {room.name}
                      </span>
                    )}
                  </div>

                  {/* Live Telemetry Display */}
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-slate-950 to-black border border-cyan-500/20">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                        Live Signal Telemetry
                      </span>
                      <span>Interval: {sensor.configuration.samplingIntervalMs}ms</span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-xl font-black text-white font-mono">
                        {typeof sensor.lastReading?.value === 'object'
                          ? JSON.stringify(sensor.lastReading.value)
                          : sensor.lastReading?.value !== undefined
                          ? String(sensor.lastReading.value)
                          : 'Waiting for stream...'}
                      </span>
                      {sensor.configuration.unit && (
                        <span className="text-xs font-mono text-cyan-400 font-bold">
                          {sensor.configuration.unit}
                        </span>
                      )}
                    </div>

                    {sensor.lastReading?.confidence !== undefined && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Radar Confidence</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {sensor.lastReading.confidence}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pin Mapping / Hardware Bus detail */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>
                      {sensor.configuration.gpioPin !== undefined &&
                        `GPIO ${sensor.configuration.gpioPin}`}
                      {sensor.configuration.i2cAddress &&
                        `I2C ${sensor.configuration.i2cAddress}`}
                      {sensor.configuration.baudRate &&
                        `UART ${sensor.configuration.baudRate} Baud`}
                    </span>
                    <span>
                      {sensor.configuration.thresholds?.length
                        ? `${sensor.configuration.thresholds.length} Thresholds`
                        : 'No Alerts'}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setConfiguringSensor(sensor)}
                      title="Configure Hardware & Pins"
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCalibratingSensor(sensor)}
                      title="Calibrate Offsets & Baselines"
                      className="p-1.5 rounded-lg bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 transition-all border border-purple-500/30"
                    >
                      <Compass className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleEnabled(sensor)}
                      title={sensor.enabled ? 'Disable Sensor' : 'Enable Sensor'}
                      className={`p-1.5 rounded-lg transition-all ${
                        sensor.enabled
                          ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(sensor)}
                    title="Remove Sensor"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Catalog Modal */}
      <SensorCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectForDeploy={handleDeployFromCatalog}
      />

      {/* Register Sensor Modal */}
      <CreateSensorModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedCatalogItem(null);
        }}
        initialCatalogItem={selectedCatalogItem}
      />

      {/* Configure Hardware Modal */}
      <ConfigureSensorModal
        isOpen={!!configuringSensor}
        onClose={() => setConfiguringSensor(null)}
        sensor={configuringSensor}
      />

      {/* Calibrate Modal */}
      <CalibrateSensorModal
        isOpen={!!calibratingSensor}
        onClose={() => setCalibratingSensor(null)}
        sensor={calibratingSensor}
      />
    </div>
  );
};
