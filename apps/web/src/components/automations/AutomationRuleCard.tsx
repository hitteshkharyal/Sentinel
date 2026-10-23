// ─────────────────────────────────────────────
// SENTINEL Web — Automation Rule Card Component
// ─────────────────────────────────────────────

import React from 'react';
import type { AutomationRule, AutomationActionType } from '@sentinel/types';
import { Button } from '../ui/Button';
import {
  Zap,
  Wind,
  Lightbulb,
  LightbulbOff,
  Thermometer,
  Bell,
  Volume2,
  ShieldAlert,
  Clock,
  Building2,
  DoorOpen,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onToggle: (id: string) => Promise<void>;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
  onSimulate: (rule: AutomationRule) => void;
  isToggling?: boolean;
}

export const getActionIcon = (type: AutomationActionType) => {
  switch (type) {
    case 'HVAC_ECO':
      return <Thermometer className="w-3.5 h-3.5 text-emerald-500" />;
    case 'HVAC_COMFORT':
      return <Thermometer className="w-3.5 h-3.5 text-amber-500" />;
    case 'LIGHT_ON':
      return <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />;
    case 'LIGHT_OFF':
      return <LightbulbOff className="w-3.5 h-3.5 text-slate-400" />;
    case 'VENTILATION_INCREASE':
    case 'VENTILATION_NORMAL':
      return <Wind className="w-3.5 h-3.5 text-cyan-500" />;
    case 'RELAY':
      return <Zap className="w-3.5 h-3.5 text-purple-500" />;
    case 'BUZZER':
      return <Volume2 className="w-3.5 h-3.5 text-rose-500" />;
    case 'SEND_NOTIFICATION':
      return <Bell className="w-3.5 h-3.5 text-blue-500" />;
    case 'CREATE_ALERT':
    case 'ESCALATE_ALERT':
      return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  }
};

export const getEventBadgeColor = (eventType: string) => {
  switch (eventType) {
    case 'PERSON_LEFT_BEHIND':
    case 'FALL_SUSPECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'HIGH_CO2':
    case 'ANOMALOUS_PRESENCE':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'ROOM_VACANT':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 'ROOM_OCCUPIED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    default:
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  }
};

export const AutomationRuleCard: React.FC<AutomationRuleCardProps> = ({
  rule,
  onToggle,
  onEdit,
  onDelete,
  onSimulate,
  isToggling = false,
}) => {
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never triggered';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between shadow-sm hover:shadow-md ${
        rule.enabled
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
      }`}
    >
      <div>
        {/* Header: Status, Trigger, and Controls */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getEventBadgeColor(
                rule.triggerEventType
              )}`}
            >
              <Activity className="w-3 h-3" />
              {rule.triggerEventType.replace(/_/g, ' ')}
            </span>

            {/* Spatial Scope */}
            {rule.facilityName ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Building2 className="w-3 h-3 text-slate-400" />
                {rule.facilityName}
                {rule.roomName && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <DoorOpen className="w-3 h-3 text-slate-400" />
                    {rule.roomName}
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Layers className="w-3 h-3" />
                Organization-wide
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              {rule.cooldownMs / 1000}s cooldown
            </span>
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => void onToggle(rule.id)}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sentinel-500 focus:ring-offset-2 ${
              rule.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            title={rule.enabled ? 'Disable Policy' : 'Enable Policy'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                rule.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {rule.name}
          </h3>
          {rule.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {rule.description}
            </p>
          )}
        </div>

        {/* Logic Pipeline: IF [Conditions] THEN [Actions] */}
        <div className="space-y-2.5 my-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {/* Conditions (IF) */}
          <div className="flex items-start gap-2 text-xs">
            <span className="font-bold text-[10px] tracking-wider text-sentinel-600 dark:text-sentinel-400 uppercase py-0.5 px-1.5 bg-sentinel-50 dark:bg-sentinel-950/60 rounded">
              IF
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Event is <code className="text-sentinel-600 dark:text-sentinel-400">{rule.triggerEventType}</code>
              </span>
              {rule.conditions && rule.conditions.length > 0 ? (
                rule.conditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-slate-400 dark:text-slate-500">AND</span>
                    <span className="font-mono">{cond.field}</span>
                    <span className="font-bold text-sentinel-600 dark:text-sentinel-400">
                      {cond.operator === 'eq' ? '==' : cond.operator === 'gte' ? '>=' : cond.operator === 'lte' ? '<=' : cond.operator}
                    </span>
                    <span className="font-mono font-medium">{String(cond.value)}</span>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-[11px] italic">(always matches)</span>
              )}
            </div>
          </div>

          {/* Actions (THEN) */}
          <div className="flex items-start gap-2 text-xs">
            <span className="font-bold text-[10px] tracking-wider text-emerald-600 dark:text-emerald-400 uppercase py-0.5 px-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded">
              THEN
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {rule.actions.map((act, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  {getActionIcon(act.type)}
                  <span>{act.type.replace(/_/g, ' ')}</span>
                  {act.simulated && (
                    <span className="text-[9px] text-sentinel-500 uppercase tracking-tight">
                      (Twin)
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Triggers Stats & Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <strong className="text-slate-700 dark:text-slate-300">
              {rule.executionCount || 0}
            </strong>{' '}
            runs
          </span>
          <span className="text-[11px] text-slate-400">
            Last: {formatTimeAgo(rule.lastExecutedAt)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSimulate(rule)}
            className="text-xs h-7 px-2 text-sentinel-600 hover:text-sentinel-700 hover:bg-sentinel-50 dark:text-sentinel-400 dark:hover:bg-sentinel-950/60"
            title="Simulate / Test in Sandbox"
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(rule)}
            className="text-xs h-7 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
            title="Edit Rule"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule.id)}
            className="text-xs h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            title="Delete Rule"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
