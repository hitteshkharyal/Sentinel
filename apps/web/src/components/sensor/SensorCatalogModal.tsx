// ─────────────────────────────────────────────
// SENTINEL Web — Sensor Catalog Explorer Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  CheckCircle,
  Plus,
  Compass,
  Flame,
  Droplets,
  Search,
} from 'lucide-react';
import type { SensorCatalogItem, SensorCategory } from '@sentinel/types';
import { useSensor } from '../../context/SensorContext';

interface SensorCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForDeploy?: (item: SensorCatalogItem) => void;
}

const CATEGORIES: { key: SensorCategory | 'ALL'; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'All Sensors (18)', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'PRESENCE_MOTION', label: 'Presence & Radar', icon: <Activity className="w-3.5 h-3.5" /> },
  { key: 'ENVIRONMENTAL', label: 'Air & Climate', icon: <Compass className="w-3.5 h-3.5" /> },
  { key: 'SAFETY_HAZARD', label: 'Safety & Flame', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'STRUCTURAL_POWER', label: 'Power & Sonar', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'ACCESS_TELEMETRY', label: 'Access & GPS', icon: <Droplets className="w-3.5 h-3.5" /> },
];

export const SensorCatalogModal: React.FC<SensorCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectForDeploy,
}) => {
  const { catalog } = useSensor();
  const [selectedCategory, setSelectedCategory] = useState<SensorCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SensorCatalogItem | null>(
    catalog.length > 0 ? catalog[0] ?? null : null
  );

  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sensorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeItem =
    selectedItem && filteredCatalog.some((i) => i.id === selectedItem.id)
      ? selectedItem
      : filteredCatalog[0] || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="flex flex-col h-[780px] max-h-[85vh] text-slate-900 dark:text-white bg-white dark:bg-slate-950">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-800 dark:text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hardware Sensor Catalog
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono font-bold">
                  {catalog.length} Certified Chips
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Pre-configured hardware profiles with verified pinouts, interfaces, and zero-camera privacy guarantees.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-cyan-500 text-slate-950 border border-cyan-400 font-bold shadow-sm'
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chip, model, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Content body: Split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Sensor List */}
          <div className="w-2/5 border-r border-slate-200 dark:border-white/10 overflow-y-auto divide-y divide-slate-200 dark:divide-white/5 bg-slate-50 dark:bg-slate-950/40 p-2 space-y-1">
            {filteredCatalog.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                No sensor specifications match your search filter.
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/30">
                        {item.sensorType}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                        {item.interfaceType}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                      {item.model}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {item.manufacturer}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>⚡ {item.operatingVoltage}</span>
                      <span>•</span>
                      <span>Range: {item.measurementRange.min} - {item.measurementRange.max} {item.unit}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Detailed Hardware Inspector */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900/20 space-y-6">
            {activeItem ? (
              <>
                {/* Header card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                          {activeItem.sensorType}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
                          {activeItem.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {activeItem.model}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        Manufactured by <strong className="text-slate-800 dark:text-slate-200">{activeItem.manufacturer}</strong>
                      </p>
                    </div>

                    {onSelectForDeploy && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onSelectForDeploy(activeItem);
                          onClose();
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 border border-cyan-400"
                      >
                        <Plus className="w-4 h-4" />
                        Deploy This Sensor
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-4 leading-relaxed bg-white dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/5 font-normal">
                    {activeItem.description}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                      Interface
                    </span>
                    <p className="text-sm font-bold text-cyan-800 dark:text-cyan-300 mt-1 font-mono">
                      {activeItem.interfaceType}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      Alt: {activeItem.supportedInterfaces.join(', ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                      Operating Voltage
                    </span>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1 font-mono">
                      {activeItem.operatingVoltage}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      {activeItem.baudRate ? `${activeItem.baudRate} Baud` : 'Standard I/O'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                      Sampling Interval
                    </span>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                      {activeItem.defaultSamplingIntervalMs} ms
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      Min: {activeItem.minSamplingIntervalMs}ms
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                      Range & Accuracy
                    </span>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mt-1 font-mono">
                      {activeItem.measurementRange.min} - {activeItem.measurementRange.max} {activeItem.unit}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate font-medium" title={activeItem.accuracy}>
                      {activeItem.accuracy || 'Calibrated'}
                    </span>
                  </div>
                </div>

                {/* Pinout Guide Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 dark:bg-black/50 dark:text-slate-300 border border-cyan-500/30 font-mono">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      ESP32 Reference Pinout & Wiring Architecture
                    </span>
                    {activeItem.defaultPin && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                        Default GPIO: {activeItem.defaultPin}
                      </span>
                    )}
                    {activeItem.defaultI2cAddress && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                        I2C Address: {activeItem.defaultI2cAddress}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-200 dark:text-slate-300">
                    {activeItem.pinoutGuide.map((pin, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">❯</span>
                        <span>{pin}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Applications */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Recommended Multi-Sector Applications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeItem.recommendedApplications.map((app, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {app}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                Select a hardware sensor from the catalog to inspect technical pinouts.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            All catalog models validated for privacy preservation (zero cameras / zero audio recording)
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="border-slate-300 text-slate-800 dark:text-white">
            Close Catalog
          </Button>
        </div>
      </div>
    </Modal>
  );
};
