// ─────────────────────────────────────────────
// SENTINEL Web — Automation Rule Builder Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import type {
  AutomationRule,
  AutomationActionType,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
  AutomationCondition,
  AutomationAction,
  EventType,
} from '@sentinel/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFacility } from '../../context/FacilityContext';
import {
  Plus,
  Trash2,
  Zap,
  Layers,
  Building2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getActionIcon } from './AutomationRuleCard';

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: CreateAutomationRuleDTO | UpdateAutomationRuleDTO) => Promise<void>;
  initialRule?: AutomationRule | null;
}

const EVENT_TYPE_OPTIONS: { label: string; value: EventType }[] = [
  { label: 'Room Vacant (All Occupants Cleared)', value: 'ROOM_VACANT' },
  { label: 'Room Occupied (Presence Detected)', value: 'ROOM_OCCUPIED' },
  { label: 'High CO₂ (> 1,200 ppm Threshold)', value: 'HIGH_CO2' },
  { label: 'Person Left Behind (Vehicle / Lockdown)', value: 'PERSON_LEFT_BEHIND' },
  { label: 'After-Hours Presence', value: 'AFTER_HOURS_PRESENCE' },
  { label: 'Assistance Indication / Distress', value: 'ASSISTANCE_INDICATION' },
  { label: 'Overcapacity Detected', value: 'OVERCAPACITY' },
  { label: 'Prolonged Inactivity', value: 'PROLONGED_INACTIVITY' },
  { label: 'High Temperature Anomaly', value: 'HIGH_TEMPERATURE' },
  { label: 'Low Temperature Anomaly', value: 'LOW_TEMPERATURE' },
  { label: 'Abnormal Sensor Activity', value: 'ABNORMAL_ACTIVITY' },
  { label: 'Environmental Anomaly', value: 'ENVIRONMENTAL_ANOMALY' },
];

const ACTION_TYPE_OPTIONS: { label: string; value: AutomationActionType; desc: string }[] = [
  { label: 'HVAC to ECO Mode', value: 'HVAC_ECO', desc: 'Rollback heating/cooling setpoints to conserve power' },
  { label: 'HVAC to Comfort Mode', value: 'HVAC_COMFORT', desc: 'Restore target conditioned air setpoints' },
  { label: 'Lights Turn OFF', value: 'LIGHT_OFF', desc: 'Power down lighting circuits' },
  { label: 'Lights Turn ON', value: 'LIGHT_ON', desc: 'Energize smart room lighting' },
  { label: 'Ventilation Increase (Boost)', value: 'VENTILATION_INCREASE', desc: 'Engage fresh air damper and fan boost' },
  { label: 'Ventilation Normal', value: 'VENTILATION_NORMAL', desc: 'Return ERV/HRV dampers to nominal flow' },
  { label: 'Relay Switch State', value: 'RELAY', desc: 'Engage or disengage edge GPIO/dry-contact relay' },
  { label: 'Buzzer / Horn Siren', value: 'BUZZER', desc: 'Sound edge piezo audio beacon' },
  { label: 'Send Enterprise Notification', value: 'SEND_NOTIFICATION', desc: 'Dispatch operational push/webhook dispatch' },
  { label: 'Create Platform Alert', value: 'CREATE_ALERT', desc: 'Generate high-priority Sentinel incident' },
  { label: 'Escalate Active Incident', value: 'ESCALATE_ALERT', desc: 'Trigger escalation ladder step' },
];

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  const { facilities, rooms } = useFacility();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [triggerEventType, setTriggerEventType] = useState<EventType>('ROOM_VACANT');
  const [facilityId, setFacilityId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [cooldownSec, setCooldownSec] = useState<number>(60);

  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([
    { type: 'HVAC_ECO', simulated: true },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate state on edit
  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name);
      setDescription(initialRule.description || '');
      setEnabled(initialRule.enabled);
      setTriggerEventType(initialRule.triggerEventType);
      setFacilityId(initialRule.facilityId || '');
      setRoomId(initialRule.roomId || '');
      setCooldownSec(Math.round((initialRule.cooldownMs || 60000) / 1000));
      setConditions(initialRule.conditions ? [...initialRule.conditions] : []);
      setActions(
        initialRule.actions && initialRule.actions.length > 0
          ? [...initialRule.actions]
          : [{ type: 'HVAC_ECO', simulated: true }]
      );
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setTriggerEventType('ROOM_VACANT');
      setFacilityId('');
      setRoomId('');
      setCooldownSec(60);
      setConditions([{ field: 'confidence', operator: 'gte', value: 85 }]);
      setActions([
        { type: 'HVAC_ECO', simulated: true },
        { type: 'LIGHT_OFF', simulated: true },
      ]);
    }
    setError(null);
  }, [initialRule, isOpen]);

  // Filter rooms when facility changes
  const filteredRooms = facilityId
    ? rooms.filter((r) => r.facilityId === facilityId)
    : rooms;

  // Condition Handlers
  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { field: 'confidence', operator: 'gte', value: 85 },
    ]);
  };

  const handleUpdateCondition = (index: number, patch: Partial<AutomationCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // Action Handlers
  const handleAddAction = () => {
    setActions((prev) => [
      ...prev,
      { type: 'LIGHT_OFF', simulated: true },
    ]);
  };

  const handleUpdateAction = (index: number, patch: Partial<AutomationAction>) => {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    );
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) return; // Keep at least one action
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive name for this policy.');
      return;
    }
    if (actions.length === 0) {
      setError('At least one autonomous action must be specified.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateAutomationRuleDTO = {
        name: name.trim(),
        description: description.trim() || undefined,
        enabled,
        triggerEventType,
        facilityId: facilityId || undefined,
        roomId: roomId || undefined,
        cooldownMs: Math.max(1000, cooldownSec * 1000),
        conditions: conditions.map((c) => ({
          ...c,
          value: !isNaN(Number(c.value)) && typeof c.value !== 'boolean' ? Number(c.value) : c.value,
        })),
        actions,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save automation rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sentinel-50 text-sentinel-600 dark:bg-sentinel-950/60 dark:text-sentinel-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span>{initialRule ? 'Edit Automation Policy' : 'Create Autonomous Policy'}</span>
        </div>
      }
      description="Define reactive IF [Conditions] THEN [Actions] rules driven by authoritative sensor fusion events."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Basic Info */}
        <div className="space-y-4">
          <Input
            label="Policy Rule Name"
            placeholder="e.g., Vacancy Energy Setback (HVAC ECO + Lights Off)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Intended Impact
            </label>
            <textarea
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              rows={2}
              placeholder="e.g., Shifts thermostat to ECO setpoint and powers down lights after room clears."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Trigger Event & Cooldown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Triggering Sensor Event
            </label>
            <select
              value={triggerEventType}
              onChange={(e) => setTriggerEventType(e.target.value as EventType)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Anti-Flapping Cooldown (Seconds)
            </label>
            <Input
              type="number"
              min={5}
              max={3600}
              value={cooldownSec}
              onChange={(e) => setCooldownSec(Number(e.target.value))}
              placeholder="60"
            />
          </div>
        </div>

        {/* 3. Spatial Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Facility Scope (Optional)
            </label>
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                setRoomId('');
              }}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            >
              <option value="">All Facilities (Global Organization)</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Room Scope (Optional)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={!facilityId}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sentinel-500 disabled:opacity-50"
            >
              <option value="">All Rooms in Facility</option>
              {filteredRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.roomType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Conditional Filters (IF) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-sentinel-600 dark:text-sentinel-400 flex items-center gap-1.5">
              <span>1. Match Conditions (IF)</span>
              <span className="text-[10px] text-slate-400 normal-case">
                (Optional event telemetry constraints)
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="h-7 text-xs px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Condition
            </Button>
          </div>

          {conditions.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              No conditions set — rule will trigger unconditionally whenever this event occurs.
            </p>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <select
                    value={cond.field}
                    onChange={(e) =>
                      handleUpdateCondition(index, { field: e.target.value })
                    }
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white font-mono flex-1"
                  >
                    <option value="confidence">confidence (%)</option>
                    <option value="inputSignals.co2Ppm">inputSignals.co2Ppm</option>
                    <option value="inputSignals.temperatureC">inputSignals.temperatureC</option>
                    <option value="inputSignals.ambientLightLux">inputSignals.ambientLightLux</option>
                    <option value="inputSignals.acousticDb">inputSignals.acousticDb</option>
                    <option value="severity">severity</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateCondition(index, {
                        operator: e.target.value as AutomationCondition['operator'],
                      })
                    }
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white font-mono font-bold w-20"
                  >
                    <option value="eq">==</option>
                    <option value="neq">!=</option>
                    <option value="gte">&gt;=</option>
                    <option value="gt">&gt;</option>
                    <option value="lte">&lt;=</option>
                    <option value="lt">&lt;</option>
                  </select>

                  <input
                    type="text"
                    value={String(cond.value)}
                    onChange={(e) =>
                      handleUpdateCondition(index, { value: e.target.value })
                    }
                    placeholder="85"
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white font-mono w-28"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCondition(index)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Actuator Actions (THEN) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>2. Autonomous Actions (THEN)</span>
              <span className="text-[10px] text-slate-400 normal-case">
                (Simulated Twin & Physical Actuation)
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAction}
              className="h-7 text-xs px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Action
            </Button>
          </div>

          <div className="space-y-2.5">
            {actions.map((act, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getActionIcon(act.type)}
                    <select
                      value={act.type}
                      onChange={(e) =>
                        handleUpdateAction(index, {
                          type: e.target.value as AutomationActionType,
                        })
                      }
                      className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white font-medium flex-1"
                    >
                      {ACTION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={act.simulated}
                      onChange={(e) =>
                        handleUpdateAction(index, { simulated: e.target.checked })
                      }
                      className="rounded text-sentinel-600 focus:ring-sentinel-500"
                    />
                    <span>Digital Twin</span>
                  </label>

                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAction(index)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Optional Action Parameters for specific action types */}
                {act.type === 'RELAY' && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">Relay Pin:</span>
                      <input
                        type="number"
                        defaultValue={Number(act.params?.relayPin || 12)}
                        onChange={(e) =>
                          handleUpdateAction(index, {
                            params: { ...act.params, relayPin: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Target State:</span>
                      <select
                        defaultValue={String(act.params?.state ?? 'true')}
                        onChange={(e) =>
                          handleUpdateAction(index, {
                            params: { ...act.params, state: e.target.value === 'true' },
                          })
                        }
                        className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      >
                        <option value="true">Closed / ON</option>
                        <option value="false">Open / OFF</option>
                      </select>
                    </div>
                  </div>
                )}

                {act.type === 'BUZZER' && (
                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[10px] text-slate-500">Duration (ms):</span>
                    <input
                      type="number"
                      defaultValue={Number(act.params?.durationMs || 5000)}
                      onChange={(e) =>
                        handleUpdateAction(index, {
                          params: { ...act.params, durationMs: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin" />
                Saving Policy...
              </span>
            ) : initialRule ? (
              'Update Policy'
            ) : (
              'Deploy Policy'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
