// ─────────────────────────────────────────────
// SENTINEL Web — Automation Simulation Sandbox Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import type { AutomationRule, EventType, ExecutedAction } from '@sentinel/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAutomation } from '../../context/AutomationContext';
import {
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { getActionIcon } from './AutomationRuleCard';

interface SimulateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRule?: AutomationRule | null;
  rules: AutomationRule[];
}

export const SimulateAutomationModal: React.FC<SimulateAutomationModalProps> = ({
  isOpen,
  onClose,
  selectedRule,
  rules,
}) => {
  const { testRule } = useAutomation();

  const [ruleId, setRuleId] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('ROOM_VACANT');
  const [confidence, setConfidence] = useState<number>(92);
  const [co2Ppm, setCo2Ppm] = useState<number>(1450);
  const [temperatureC, setTemperatureC] = useState<number>(23.5);
  const [ambientLightLux, setAmbientLightLux] = useState<number>(450);
  const [acousticDb, setAcousticDb] = useState<number>(42);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    matched: boolean;
    conditionsEvaluated: { field: string; passed: boolean }[];
    executedActions: ExecutedAction[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRule) {
      setRuleId(selectedRule.id);
      setEventType(selectedRule.triggerEventType);
      // Sensible defaults depending on trigger event
      if (selectedRule.triggerEventType === 'HIGH_CO2') {
        setCo2Ppm(1600);
      } else if (selectedRule.triggerEventType === 'ROOM_VACANT') {
        setAmbientLightLux(0);
      }
    } else if (rules.length > 0 && rules[0]) {
      setRuleId(rules[0].id);
      setEventType(rules[0].triggerEventType);
    }
    setSimulationResult(null);
    setError(null);
  }, [selectedRule, rules, isOpen]);

  const handleRunSimulation = async () => {
    if (!ruleId) {
      setError('Please select an automation rule to simulate.');
      return;
    }

    setIsSimulating(true);
    setError(null);

    try {
      const result = await testRule({
        ruleId,
        syntheticEvent: {
          eventType,
          confidence,
          inputSignals: {
            co2Ppm,
            temperatureC,
            ambientLightLux,
            acousticDb,
          },
        },
      });

      setSimulationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sentinel-50 text-sentinel-600 dark:bg-sentinel-950/60 dark:text-sentinel-400 flex items-center justify-center">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span>Autonomous Sandbox Simulation</span>
        </div>
      }
      description="Inject synthetic authoritative events to evaluate rule conditions and observe actuator responses in safe test mode."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* 1. Policy Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Automation Policy
          </label>
          <select
            value={ruleId}
            onChange={(e) => {
              setRuleId(e.target.value);
              const found = rules.find((r) => r.id === e.target.value);
              if (found) setEventType(found.triggerEventType);
              setSimulationResult(null);
            }}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Trigger: {r.triggerEventType})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Synthetic Event Parameters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sentinel-500" />
              Synthetic Event Payload
            </h4>
            <span className="text-[11px] text-slate-400">Sandbox Test Signals</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Event Type
              </label>
              <input
                type="text"
                value={eventType}
                disabled
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 font-mono text-slate-600 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Event Confidence ({confidence}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-sentinel-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">CO₂ (ppm)</label>
              <input
                type="number"
                value={co2Ppm}
                onChange={(e) => setCo2Ppm(Number(e.target.value))}
                className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperatureC}
                onChange={(e) => setTemperatureC(Number(e.target.value))}
                className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Light (lux)</label>
              <input
                type="number"
                value={ambientLightLux}
                onChange={(e) => setAmbientLightLux(Number(e.target.value))}
                className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Sound (dB)</label>
              <input
                type="number"
                value={acousticDb}
                onChange={(e) => setAcousticDb(Number(e.target.value))}
                className="w-full text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Run Simulation Action */}
        <Button
          type="button"
          variant="primary"
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="w-full"
        >
          {isSimulating ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              Evaluating Policy Engine...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              Simulate Rule Execution
            </span>
          )}
        </Button>

        {/* 4. Results Section */}
        {simulationResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-3 ${
              simulationResult.matched
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {simulationResult.matched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600" />
                )}
                <span className="font-bold text-slate-900 dark:text-white">
                  {simulationResult.matched
                    ? 'Policy Criteria Matched — Actions Fired'
                    : 'Policy Conditions Not Met — No Action Taken'}
                </span>
              </div>
            </div>

            {/* Conditions Evaluation */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Condition Verification Breakdown:
              </span>
              <div className="space-y-1">
                {simulationResult.conditionsEvaluated.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      Condition {idx + 1}: {c.field}
                    </span>
                    {c.passed ? (
                      <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PASSED
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> FAILED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Executed Actions */}
            {simulationResult.executedActions.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Simulated Actuations:
                </span>
                <div className="space-y-1.5">
                  {simulationResult.executedActions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {getActionIcon(act.type)}
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {act.type.replace(/_/g, ' ')}
                          </span>
                          {act.feedback && (
                            <p className="text-[10px] text-slate-500">{act.feedback}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase">
                        Digital Twin OK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
