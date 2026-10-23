// ─────────────────────────────────────────────
// SENTINEL Web — Day 10 Autonomous Policy Engine Console
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useAutomation } from '../context/AutomationContext';
import { useFacility } from '../context/FacilityContext';
import { AutomationRuleCard } from '../components/automations/AutomationRuleCard';
import { CreateRuleModal } from '../components/automations/CreateRuleModal';
import { ExecutionLogDrawer } from '../components/automations/ExecutionLogDrawer';
import { SimulateAutomationModal } from '../components/automations/SimulateAutomationModal';
import { Button } from '../components/ui/Button';
import type { AutomationRule, CreateAutomationRuleDTO, UpdateAutomationRuleDTO } from '@sentinel/types';
import {
  Zap,
  Activity,
  Plus,
  Play,
  ShieldCheck,
  Search,
  RefreshCw,
  Leaf,
} from 'lucide-react';

export const AutomationsPage: React.FC = () => {
  const {
    rules,
    executions,
    stats,
    isConnected,
    fetchRules,
    fetchExecutions,
    fetchStats,
    isLoading,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  } = useAutomation();

  const { facilities } = useFacility();

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulatingRule, setSimulatingRule] = useState<AutomationRule | null>(null);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  // Filter rules locally for instant feedback
  const filteredRules = rules.filter((rule) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = rule.name.toLowerCase().includes(q);
      const matchDesc = rule.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    if (selectedEventType && rule.triggerEventType !== selectedEventType) {
      return false;
    }
    if (selectedFacilityId && rule.facilityId !== selectedFacilityId) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && !rule.enabled) return false;
    if (statusFilter === 'PAUSED' && rule.enabled) return false;
    return true;
  });

  const handleToggle = async (id: string) => {
    setTogglingRuleId(id);
    try {
      await toggleRule(id);
    } catch (err) {
      console.error('Failed to toggle automation rule:', err);
    } finally {
      setTogglingRuleId(null);
    }
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setIsCreateModalOpen(true);
  };

  const handleSimulate = (rule: AutomationRule) => {
    setSimulatingRule(rule);
    setIsSimulateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this automation policy?')) {
      try {
        await deleteRule(id);
      } catch (err) {
        console.error('Failed to delete automation rule:', err);
      }
    }
  };

  const handleSaveRule = async (ruleData: CreateAutomationRuleDTO | UpdateAutomationRuleDTO) => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData as UpdateAutomationRuleDTO);
    } else {
      await createRule(ruleData as CreateAutomationRuleDTO);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sentinel-500 text-white flex items-center justify-center shadow-md shadow-sentinel-500/20">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              Autonomous Policy Engine
            </h1>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isConnected ? 'LIVE WS CONNECTED' : 'WS RECONNECTING'}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Privacy-preserving closed-loop automation: Evaluate spatial signals (PIR, radar, CO₂, temperature), execute digital twin setpoints, and dispatch edge actuator commands.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              void fetchRules();
              void fetchStats();
              void fetchExecutions();
            }}
            disabled={isLoading}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsDrawerOpen(true)}
            className="text-xs h-9 relative"
          >
            <Activity className="w-3.5 h-3.5 mr-1.5 text-sentinel-500" />
            Execution Stream
            {executions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-sentinel-100 dark:bg-sentinel-900 text-sentinel-700 dark:text-sentinel-300 font-bold text-[10px]">
                {executions.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSimulatingRule(rules[0] || null);
              setIsSimulateModalOpen(true);
            }}
            className="text-xs h-9 text-slate-700 dark:text-slate-200"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current text-sentinel-500" />
            Sandbox Simulator
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setEditingRule(null);
              setIsCreateModalOpen(true);
            }}
            className="text-xs h-9 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Policy Rule
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Policies */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sentinel-50 text-sentinel-600 dark:bg-sentinel-950/60 dark:text-sentinel-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Policies
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.activeRules ?? rules.filter((r) => r.enabled).length}
              </span>
              <span className="text-xs text-slate-400">
                / {stats?.totalRules ?? rules.length} deployed
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Executions Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Executions Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.executionsToday ?? executions.length}
              </span>
              <span className="text-xs text-slate-400">triggers fired</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Energy Setbacks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Energy Setbacks
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.energySetbacksTriggered ?? 0}
              </span>
              <span className="text-xs text-slate-400">ECO & Lights Off</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Success Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actuator Health
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.successRate ?? 100}%
              </span>
              <span className="text-xs text-emerald-500 font-semibold">Reliability</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ── */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search policy name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Trigger Event Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          >
            <option value="">All Trigger Events</option>
            <option value="ROOM_VACANT">ROOM_VACANT</option>
            <option value="ROOM_OCCUPIED">ROOM_OCCUPIED</option>
            <option value="HIGH_CO2">HIGH_CO2</option>
            <option value="PERSON_LEFT_BEHIND">PERSON_LEFT_BEHIND</option>
            <option value="AFTER_HOURS_PRESENCE">AFTER_HOURS_PRESENCE</option>
            <option value="ASSISTANCE_INDICATION">ASSISTANCE_INDICATION</option>
            <option value="OVERCAPACITY">OVERCAPACITY</option>
            <option value="HIGH_TEMPERATURE">HIGH_TEMPERATURE</option>
            <option value="LOW_TEMPERATURE">LOW_TEMPERATURE</option>
          </select>

          {/* Facility Filter */}
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          >
            <option value="">All Facilities</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {(searchTerm || selectedEventType || selectedFacilityId || statusFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedEventType('');
                setSelectedFacilityId('');
                setStatusFilter('ALL');
              }}
              className="text-xs h-8 text-slate-500 hover:text-rose-500"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Automation Policies Grid ── */}
      {filteredRules.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sentinel-50 dark:bg-sentinel-950/60 text-sentinel-600 dark:text-sentinel-400 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Automation Policies Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {searchTerm || selectedEventType || selectedFacilityId
              ? 'No rules match your active filters. Try resetting the search criteria above.'
              : 'Create your first closed-loop policy rule or run automated sensor fusion events to trigger standard industry policies.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingRule(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Policy
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <AutomationRuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSimulate={handleSimulate}
              isToggling={togglingRuleId === rule.id}
            />
          ))}
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <CreateRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      <ExecutionLogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        executions={executions}
        isConnected={isConnected}
        onRefresh={() => void fetchExecutions()}
        isLoading={isLoading}
      />

      <SimulateAutomationModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        selectedRule={simulatingRule}
        rules={rules}
      />
    </div>
  );
};
