import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, MapPin, Cpu, AlertTriangle, ArrowRight, Building, Radio } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'room' | 'facility' | 'device' | 'sensor' | 'alert';
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  url?: string;
}

// Initial mock index representing the platform's multi-facility twin
const MOCK_SEARCH_DATA: SearchResultItem[] = [
  {
    id: 'room-204',
    title: 'Room 204 — Patient Care Unit',
    subtitle: 'St. Jude General Hospital · Floor 2 · Room #204',
    type: 'room',
    badge: 'Assistance Active',
    badgeVariant: 'warning',
  },
  {
    id: 'room-8a',
    title: 'Classroom 8A — Science Wing',
    subtitle: 'Oakridge STEM Academy · Floor 1 · Room #8A',
    type: 'room',
    badge: 'CO₂ Alert (1,450 ppm)',
    badgeVariant: 'danger',
  },
  {
    id: 'room-301',
    title: 'Executive Suite 301',
    subtitle: 'Apex Marina Grand Hotel · Floor 3 · Room #301',
    type: 'room',
    badge: 'Occupied · Auto-Comfort',
    badgeVariant: 'success',
  },
  {
    id: 'room-bus12',
    title: 'School Bus #12 — Transport Fleet',
    subtitle: 'Oakridge District Fleet Depot · Vehicle #BUS-12',
    type: 'room',
    badge: 'Person Detected Post-Route',
    badgeVariant: 'danger',
  },
  {
    id: 'fac-1',
    title: 'St. Jude General Hospital',
    subtitle: 'Healthcare Facility · 4 Floors · 128 Rooms · 290 Sensors',
    type: 'facility',
    badge: 'Operational',
    badgeVariant: 'success',
  },
  {
    id: 'fac-2',
    title: 'Oakridge STEM Academy',
    subtitle: 'Educational Facility · 2 Floors · 36 Classrooms · 84 Sensors',
    type: 'facility',
    badge: 'Operational',
    badgeVariant: 'success',
  },
  {
    id: 'dev-esp-01',
    title: 'ESP32-RADAR-ROOM204',
    subtitle: 'Device ID: dev_esp32_c3_88f2 · MAC: 24:6F:28:B4:12:89',
    type: 'device',
    badge: 'Online · WiFi RSSI -52dBm',
    badgeVariant: 'primary',
  },
  {
    id: 'sens-mmwave-88',
    title: 'mmWave 60GHz Fall & Presence Radar',
    subtitle: 'Sensor ID: sens_mmwave_60ghz_04 · Room 204 Ceiling Array',
    type: 'sensor',
    badge: 'Broadcasting (50ms)',
    badgeVariant: 'success',
  },
  {
    id: 'sens-scd40-8a',
    title: 'Sensirion SCD40 Photoacoustic CO₂ Sensor',
    subtitle: 'Sensor ID: sens_co2_scd40_8a · Classroom 8A Wall Mount',
    type: 'sensor',
    badge: '1,450 ppm (Exceeded)',
    badgeVariant: 'danger',
  },
  {
    id: 'alert-bus12',
    title: 'CRITICAL: Passenger Trapped in Bus 12',
    subtitle: 'Alert #ALT-9041 · Responsible: Driver Marcus Hall & Ops Lead',
    type: 'alert',
    badge: 'Escalation Tier 2',
    badgeVariant: 'danger',
  },
];

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (item: SearchResultItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setFilterType('all');
    }
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    let results = MOCK_SEARCH_DATA;

    if (filterType !== 'all') {
      results = results.filter((item) => item.type === filterType);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q)
      );
    }

    return results;
  }, [query, filterType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        onSelectResult?.(filteredResults[selectedIndex]);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onSelectResult, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'room':
        return <MapPin className="w-4 h-4 text-cyan-400" />;
      case 'facility':
        return <Building className="w-4 h-4 text-emerald-400" />;
      case 'device':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'sensor':
        return <Radio className="w-4 h-4 text-cyan-300" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 font-mono" role="dialog">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#060e1d]/95 rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden z-10 animate-slide-up text-slate-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 gap-3 bg-[#030712]/70">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms, facilities, sensors, device IDs, or alerts..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none font-mono"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-mono text-cyan-400 bg-cyan-950/60 rounded border border-cyan-500/30">
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-cyan-500/15 bg-[#040914] overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'room', label: 'Rooms' },
            { id: 'facility', label: 'Facilities' },
            { id: 'sensor', label: 'Sensors' },
            { id: 'device', label: 'Devices' },
            { id: 'alert', label: 'Alerts' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors whitespace-nowrap border ${
                filterType === cat.id
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-cyan-500/10">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <Search className="w-8 h-8 text-cyan-500/40 mx-auto mb-2" />
              <p className="font-bold text-white">No matching spaces or devices found</p>
              <p className="text-xs text-slate-400 mt-1">
                {'Try searching for "Room 204", "Bus 12", "Hospital", or "mmWave"'}
              </p>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectResult?.(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-500/15 text-white border border-cyan-500/30' : 'hover:bg-cyan-950/20 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-[#030712] border border-cyan-500/30 flex items-center justify-center shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold truncate text-white">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-light">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'neutral'} size="sm" dot>
                        {item.badge}
                      </Badge>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-cyan-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 bg-[#030712] border-t border-cyan-500/20 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#060e1d] border border-cyan-500/30 rounded text-cyan-400">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#060e1d] border border-cyan-500/30 rounded text-cyan-400">↵</kbd> Select
            </span>
          </div>
          <span className="text-cyan-400/80 font-mono">SENTINEL Global Mesh Index</span>
        </div>
      </div>
    </div>
  );
};
