// ─────────────────────────────────────────────
// SENTINEL Web — Day 9 Event Intelligence & Sensor Fusion Console
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useEvents } from '../context/EventContext';
import { useFacility } from '../context/FacilityContext';
import { EventCard } from '../components/events/EventCard';
import { EventDetailModal } from '../components/events/EventDetailModal';
import { SimulateEventModal } from '../components/events/SimulateEventModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { SentinelEvent, EventType, AlertSeverity, EventStatus } from '@sentinel/types';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Search,
  RefreshCw,
  Radio,
  X,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const {
    events,
    stats,
    totalEvents,
    isConnected,
    connectionStatus,
    filter,
    setFilter,
    clearFilters,
    fetchEvents,
    fetchStats,
    isLoading,
    acknowledgeEvent,
    resolveEvent,
    dismissEvent,
  } = useEvents();

  const { facilities } = useFacility();

  const [selectedEvent, setSelectedEvent] = useState<SentinelEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Quick Action Handlers
  const handleInspect = (event: SentinelEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleAcknowledge = async (id: string, notes?: string) => {
    setActionLoadingId(id);
    try {
      await acknowledgeEvent(id, notes);
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = (event: SentinelEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleDismiss = async (id: string, notes?: string) => {
    setActionLoadingId(id);
    try {
      await dismissEvent(id, notes);
    } catch (err) {
      console.error('Failed to dismiss event:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchEvents(), fetchStats()]);
  };

  const hasActiveFilters = Boolean(
    filter.search ||
      filter.eventType ||
      filter.severity ||
      filter.status ||
      filter.facilityId
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Event Intelligence & Sensor Fusion
            </h1>
            <Badge
              variant={isConnected ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'neutral'}
              size="sm"
              dot
              pulsing={isConnected}
              className="gap-1.5 font-mono text-[11px]"
            >
              <Radio className="w-3 h-3" />
              {isConnected ? 'Live WebSocket' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Multi-sensor temporal fusion, privacy-preserving human assistance dispatch, and environmental telemetry anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            className="gap-1.5 text-xs bg-sentinel-600 hover:bg-sentinel-700 text-white shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sensor Fusion Sandbox
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-900/5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {stats?.totalEvents ?? totalEvents}
          </p>
          <span className="text-[11px] text-slate-400">Recorded telemetry events</span>
        </div>

        {/* Active Alerts */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-all ${
            (stats?.activeEvents ?? 0) > 0
              ? 'bg-amber-50/40 border-amber-200/80'
              : 'bg-white border-slate-200/80 shadow-slate-900/5'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Active Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-900 font-mono tracking-tight">
            {stats?.activeEvents ?? 0}
          </p>
          <span className="text-[11px] text-amber-700/80 font-medium">Pending verification</span>
        </div>

        {/* Critical Incidents */}
        <div
          className={`p-4 rounded-2xl border shadow-sm transition-all ${
            (stats?.criticalEvents ?? 0) > 0
              ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
              : 'bg-white border-slate-200/80 shadow-slate-900/5'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Critical
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-900 font-mono tracking-tight">
            {stats?.criticalEvents ?? 0}
          </p>
          <span className="text-[11px] text-rose-700/80 font-medium">Immediate priority</span>
        </div>

        {/* Acknowledged */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-900/5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-sentinel-700">
              Acknowledged
            </span>
            <UserCheck className="w-4 h-4 text-sentinel-600" />
          </div>
          <p className="text-2xl font-bold text-sentinel-900 font-mono tracking-tight">
            {stats?.acknowledgedEvents ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Operator assigned</span>
        </div>

        {/* Resolved Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-900/5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Resolved Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 font-mono tracking-tight">
            {stats?.resolvedToday ?? 0}
          </p>
          <span className="text-[11px] text-emerald-700/80 font-medium">Clear physical spaces</span>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Term */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, room, device..."
              value={filter.search || ''}
              onChange={(e) => setFilter({ search: e.target.value || undefined })}
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
            />
          </div>

          {/* Event Type Filter */}
          <div>
            <select
              value={filter.eventType || ''}
              onChange={(e) => setFilter({ eventType: (e.target.value as EventType) || undefined })}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
            >
              <option value="">All Event Types</option>
              <option value="ASSISTANCE_INDICATION">Assistance Indication (Fall)</option>
              <option value="PERSON_LEFT_BEHIND">Person Left Behind (Bus)</option>
              <option value="HIGH_CO2">High CO₂ Concentration</option>
              <option value="HIGH_TEMPERATURE">High Temperature</option>
              <option value="LOW_TEMPERATURE">Low Temperature</option>
              <option value="ABNORMAL_ACTIVITY">Abnormal Activity</option>
              <option value="OVERCAPACITY">Overcapacity</option>
              <option value="ROOM_OCCUPIED">Room Occupied</option>
              <option value="ROOM_VACANT">Room Vacant</option>
              <option value="ENVIRONMENTAL_ANOMALY">Environmental Anomaly</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={filter.severity || ''}
              onChange={(e) => setFilter({ severity: (e.target.value as AlertSeverity) || undefined })}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High Severity</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Notice / Info</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ status: (e.target.value as EventStatus) || undefined })}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Incidents</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          {/* Facility Filter */}
          <div>
            <select
              value={filter.facilityId || ''}
              onChange={(e) => setFilter({ facilityId: e.target.value || undefined })}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
            >
              <option value="">All Facilities</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-100">
            <span>Filtered view active</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-xs text-rose-600 hover:text-rose-700 h-7 px-2"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* ── Live Event Stream Grid ── */}
      {isLoading && events.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl bg-white border border-slate-200/80 animate-pulse p-5 space-y-3"
            >
              <div className="h-5 bg-slate-100 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {hasActiveFilters ? 'No Matching Events Found' : 'All Monitored Spaces Normal'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try relaxing your filter parameters or clear the search criteria.'
              : 'Zero active assistance indications, air quality violations, or spatial alerts. The multi-sensor fusion engine is continuously streaming.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Active Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSimulateModalOpen(true)}
                className="gap-1.5 text-xs bg-sentinel-600 text-white"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch Fusion Sandbox
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onInspect={handleInspect}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
              isActionLoading={actionLoadingId === event.id}
            />
          ))}
        </div>
      )}

      {/* ── Inspection Modal ── */}
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onAcknowledge={handleAcknowledge}
        onResolve={async (id, notes) => {
          await resolveEvent(id, notes);
        }}
        onDismiss={handleDismiss}
      />

      {/* ── Scenario Simulation Modal ── */}
      <SimulateEventModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
      />
    </div>
  );
};
