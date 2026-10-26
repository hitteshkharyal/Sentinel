// ─────────────────────────────────────────────
// SENTINEL Web — Analytics Timeframe & Facility Filter Bar
// ─────────────────────────────────────────────

import React from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useFacility } from '../../context/FacilityContext';
import type { AnalyticsTimeframe } from '@sentinel/types';
import { Button } from '../ui/Button';
import { RefreshCw, Calendar, Building2 } from 'lucide-react';

export const TimeframeSelector: React.FC = () => {
  const {
    timeframe,
    setTimeframe,
    selectedFacilityId,
    setSelectedFacilityId,
    isLoading,
    refreshAnalytics,
  } = useAnalytics();

  const { facilities } = useFacility();

  const timeframes: { id: AnalyticsTimeframe; label: string }[] = [
    { id: '1h', label: 'Past Hour' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left: Timeframe Switcher Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
        <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTimeframe(tf.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeframe === tf.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Right: Facility Filter Dropdown & Refresh Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-56">
          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedFacilityId || ''}
            onChange={(e) => setSelectedFacilityId(e.target.value || undefined)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sentinel-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Facilities & Buildings</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refreshAnalytics()}
          disabled={isLoading}
          className="text-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
};
