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

      <div className="relative w-full max-w-2xl bg-[var(--theme-surface-card)] rounded-2xl shadow-2xl border border-[var(--theme-border)] overflow-hidden z-10 animate-slide-up text-[var(--theme-text)]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--theme-border)] gap-3 bg-[var(--theme-surface)]">
          <Search className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms, facilities, sensors, device IDs..."
            className="w-full bg-transparent text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] outline-none font-mono font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] p-1.5 rounded-md"
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-badge-bg)] transition-colors shrink-0"
            aria-label="Close search"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-x-auto text-xs">
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
                  ? 'btn-cyan-glow font-bold'
                  : 'text-[var(--theme-text-muted)] border-transparent hover:text-[var(--theme-text)] hover:bg-[var(--theme-badge-bg)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto p-2 divide-y divide-[var(--theme-border)] overscroll-contain">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-[var(--theme-text-muted)] text-sm">
              <Search className="w-8 h-8 text-[var(--theme-primary)] mx-auto mb-2 opacity-60" />
              <p className="font-bold text-[var(--theme-text)]">No matching spaces or devices found</p>
              <p className="text-xs text-[var(--theme-text-muted)] mt-1 font-normal">
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
                    isSelected ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-text)] border border-[var(--theme-badge-border)]' : 'hover:bg-[var(--theme-badge-bg)] text-[var(--theme-text)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold truncate text-[var(--theme-text)]">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--theme-text-muted)] truncate mt-0.5 font-normal">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'neutral'} size="sm" dot>
                        {item.badge}
                      </Badge>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 bg-[var(--theme-surface)] border-t border-[var(--theme-border)] flex items-center justify-between text-[10px] text-[var(--theme-text-muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] rounded text-[var(--theme-primary)] font-bold">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] rounded text-[var(--theme-primary)] font-bold">↵</kbd> Select
            </span>
          </div>
          <span className="text-[var(--theme-primary)] font-mono font-semibold">SENTINEL Global Mesh Index</span>
        </div>
      </div>
    </div>
  );
};
