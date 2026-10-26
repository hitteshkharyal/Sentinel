// ─────────────────────────────────────────────
// SENTINEL Web — Day 11 Alert Lifecycle, Sound Engine & SLA Escalation Console
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { useFacility } from '../context/FacilityContext';
import { SoundControlBar } from '../components/alerts/SoundControlBar';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { CreateAlertModal } from '../components/alerts/CreateAlertModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Alert, AlertSeverity, AlertStatus } from '@sentinel/types';
import {
  ShieldAlert,
  CheckCircle2,
  UserX,
  Search,
  RefreshCw,
  Plus,
  X,
  ShieldCheck,
  TrendingUp,
  Flame,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    stats,
    filter,
    setFilter,
    clearFilters,
    fetchAlerts,
    fetchStats,
    isLoading,
    isLoadingStats,
    acknowledgeAlert,
    assignAlert,
    updateStatus,
    resolveAlert,
    dismissAlert,
    escalateAlert,
  } = useAlerts();

  const { facilities } = useFacility();

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Quick Action Handlers
  const handleInspect = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const handleAcknowledge = async (id: string, note?: string): Promise<Alert> => {
    setActionLoadingId(id);
    try {
      const updated = await acknowledgeAlert(id, note);
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert(updated);
      }
      return updated;
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssign = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const handleResolve = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const handleEscalate = async (id: string, reason?: string): Promise<Alert> => {
    setActionLoadingId(id);
    try {
      const updated = await escalateAlert(id, reason);
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert(updated);
      }
      return updated;
    } catch (err) {
      console.error('Failed to escalate alert:', err);
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchAlerts(), fetchStats()]);
  };

  const hasActiveFilters = Boolean(
    filter.search || filter.severity || filter.status || filter.facilityId
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="danger" size="sm" dot>
              SLA Engine Active
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Day 11 Implementation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Incident Management & SLA Escalations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sense → Understand → Decide → Act → Escalate only when necessary.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingStats}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs shadow-sm shadow-sentinel-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Dispatch Incident
          </Button>
        </div>
      </div>

      {/* ── 2. Top KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Active Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-sentinel-50 text-sentinel-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats?.activeAlerts ?? alerts.filter((a) => a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length}
            </span>
            <span className="text-xs font-medium text-slate-400">tickets</span>
          </div>
        </div>

        {/* Critical & High */}
        <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Critical & High</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">
              {(stats?.criticalAlerts ?? 0) + (stats?.highAlerts ?? 0)}
            </span>
            <span className="text-xs font-medium text-rose-400">urgent</span>
          </div>
        </div>

        {/* Unassigned Operator */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Unassigned</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">
              {stats?.unassignedAlerts ?? alerts.filter((a) => !a.assignedTo && a.status !== 'RESOLVED').length}
            </span>
            <span className="text-xs font-medium text-amber-500">pending</span>
          </div>
        </div>

        {/* Escalated Incidents */}
        <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Escalated Tiers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">
              {stats?.escalatedAlerts ?? alerts.filter((a) => (a.escalationLevel ?? 1) > 1).length}
            </span>
            <span className="text-xs font-medium text-purple-400">Tier 2+</span>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Resolved Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {stats?.resolvedAlerts ?? alerts.filter((a) => a.status === 'RESOLVED').length}
            </span>
            <span className="text-xs font-medium text-emerald-500">closed</span>
          </div>
        </div>
      </div>

      {/* ── 3. Sound Control & Push Notification Engine Bar ── */}
      <SoundControlBar />

      {/* ── 4. Filter Toolbar & Search Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incidents by title, description, or room..."
              value={filter.search || ''}
              onChange={(e) => setFilter({ search: e.target.value, page: 1 })}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            />
          </div>

          {/* Facility Filter */}
          <div className="w-full md:w-56">
            <select
              value={filter.facilityId || ''}
              onChange={(e) => setFilter({ facilityId: e.target.value || undefined, page: 1 })}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            >
              <option value="">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Severity & Status Pill Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-slate-400 font-medium mr-1">Status:</span>
            {[
              { id: undefined, label: 'All' },
              { id: 'CREATED', label: 'Created' },
              { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'RESOLVED', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setFilter({ status: tab.id as AlertStatus | undefined, page: 1 })}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter.status === tab.id
                    ? 'bg-sentinel-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Severity Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-slate-400 font-medium mr-1">Severity:</span>
            {[
              { id: undefined, label: 'All' },
              { id: 'CRITICAL', label: 'Critical', color: 'hover:bg-rose-100 text-rose-700' },
              { id: 'HIGH', label: 'High', color: 'hover:bg-amber-100 text-amber-700' },
              { id: 'WARNING', label: 'Warning', color: 'hover:bg-yellow-100 text-yellow-700' },
              { id: 'INFO', label: 'Info', color: 'hover:bg-blue-100 text-blue-700' },
            ].map((sev) => (
              <button
                key={sev.label}
                type="button"
                onClick={() => setFilter({ severity: sev.id as AlertSeverity | undefined, page: 1 })}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter.severity === sev.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Incidents Card Grid ── */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Active Incidents</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            All facility zones are currently operating within nominal parameters. Real-time sensor
            fusion telemetry is continuously evaluated against safety rules.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Simulate Test Incident
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onInspect={handleInspect}
              onAcknowledge={handleAcknowledge}
              onAssign={handleAssign}
              onResolve={handleResolve}
              onEscalate={handleEscalate}
              actionLoadingId={actionLoadingId}
            />
          ))}
        </div>
      )}

      {/* ── 6. Modals ── */}
      <AlertDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        alert={selectedAlert}
        onAcknowledge={handleAcknowledge}
        onAssign={assignAlert}
        onUpdateStatus={(id, status, note) => updateStatus(id, { status, note })}
        onResolve={resolveAlert}
        onDismiss={dismissAlert}
        onEscalate={handleEscalate}
      />

      <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
