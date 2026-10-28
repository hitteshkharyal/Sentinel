// ─────────────────────────────────────────────
// SENTINEL Web — Configure Sensor Hardware Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Settings, Sliders, Bell, Trash2, Plus, Zap } from 'lucide-react';
import type {
  SensorEntity,
  ConfigureSensorDTO,
  SensorThreshold,
  AlertSeverity,
} from '@sentinel/types';
import { useSensor } from '../../context/SensorContext';

interface ConfigureSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: SensorEntity | null;
  onConfigured?: () => void;
}

export const ConfigureSensorModal: React.FC<ConfigureSensorModalProps> = ({
  isOpen,
  onClose,
  sensor,
  onConfigured,
}) => {
  const { configureSensor } = useSensor();

  const [gpioPin, setGpioPin] = useState<string>('');
  const [i2cAddress, setI2cAddress] = useState<string>('');
  const [baudRate, setBaudRate] = useState<string>('');
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<number>(5000);
  const [unit, setUnit] = useState<string>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [filterWindowSize, setFilterWindowSize] = useState<number>(5);
  const [debounceMs, setDebounceMs] = useState<number>(200);
  const [thresholds, setThresholds] = useState<SensorThreshold[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sensor) {
      setGpioPin(
        sensor.configuration?.gpioPin !== undefined ? String(sensor.configuration.gpioPin) : ''
      );
      setI2cAddress(sensor.configuration?.i2cAddress || '');
      setBaudRate(
        sensor.configuration?.baudRate !== undefined ? String(sensor.configuration.baudRate) : ''
      );
      setSamplingIntervalMs(sensor.configuration?.samplingIntervalMs ?? 5000);
      setUnit(sensor.configuration?.unit || '');
      setMinValue(
        sensor.configuration?.minValue !== undefined ? String(sensor.configuration.minValue) : ''
      );
      setMaxValue(
        sensor.configuration?.maxValue !== undefined ? String(sensor.configuration.maxValue) : ''
      );
      setFilterWindowSize(sensor.configuration?.filterWindowSize ?? 5);
      setDebounceMs(sensor.configuration?.debounceMs ?? 200);
      setThresholds(sensor.configuration?.thresholds || []);
      setError(null);
    }
  }, [sensor]);

  if (!sensor) return null;

  const handleAddThreshold = () => {
    const newRule: SensorThreshold = {
      name: `Alert Threshold #${thresholds.length + 1}`,
      operator: 'gt',
      value: 0,
      severity: 'WARNING',
    };
    setThresholds([...thresholds, newRule]);
  };

  const handleUpdateThreshold = (index: number, patch: Partial<SensorThreshold>) => {
    setThresholds((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, ...patch } : t))
    );
  };

  const handleRemoveThreshold = (index: number) => {
    setThresholds((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate I2C address if provided
    if (i2cAddress.trim() && !/^0x[0-9a-fA-F]{2}$/.test(i2cAddress.trim())) {
      setError('I2C address must be a valid hex address formatted as 0xXX (e.g. 0x62, 0x44).');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: ConfigureSensorDTO = {
        gpioPin: gpioPin ? parseInt(gpioPin, 10) : undefined,
        i2cAddress: i2cAddress.trim() || undefined,
        baudRate: baudRate ? parseInt(baudRate, 10) : undefined,
        samplingIntervalMs,
        unit: unit.trim() || undefined,
        minValue: minValue ? parseFloat(minValue) : undefined,
        maxValue: maxValue ? parseFloat(maxValue) : undefined,
        filterWindowSize,
        debounceMs,
        thresholds,
      };

      await configureSensor(sensor.id, dto);
      if (onConfigured) onConfigured();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update hardware configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Configure {sensor.name}
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-mono">
                  {sensor.model}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Hardware bus, sampling frequency, filtering, and alert thresholds.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hardware Bus & Pin Mapping */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-cyan-600 dark:text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Microcontroller Pin Mapping & Protocol ({sensor.interfaceType})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">GPIO Pin (0-48)</label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={gpioPin}
                  onChange={(e) => setGpioPin(e.target.value)}
                  placeholder="e.g. 18, 21, 34"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">I2C Hex Address</label>
                <input
                  type="text"
                  value={i2cAddress}
                  onChange={(e) => setI2cAddress(e.target.value)}
                  placeholder="e.g. 0x62"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">UART Baud Rate</label>
                <input
                  type="number"
                  value={baudRate}
                  onChange={(e) => setBaudRate(e.target.value)}
                  placeholder="e.g. 256000, 115200"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sampling & Noise Filtering */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Sampling Frequency & Digital Filtering
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Interval ({samplingIntervalMs} ms)
                </label>
                <input
                  type="range"
                  min="50"
                  max="60000"
                  step="50"
                  value={samplingIntervalMs}
                  onChange={(e) => setSamplingIntervalMs(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Moving Average Window (Samples)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={filterWindowSize}
                  onChange={(e) => setFilterWindowSize(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Digital Debounce (ms)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="50"
                  value={debounceMs}
                  onChange={(e) => setDebounceMs(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Measurement Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. ppm, °C, dB"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Min Logical Range</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Min"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Max Logical Range</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Max"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Threshold Rules Builder */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Alert Threshold Triggers ({thresholds.length})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddThreshold}
                className="text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Threshold
              </Button>
            </div>

            {thresholds.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-100 dark:bg-black/20 rounded-lg">
                No active threshold triggers configured. Telemetry values will be logged without triggering alerts.
              </p>
            ) : (
              <div className="space-y-2">
                {thresholds.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5"
                  >
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => handleUpdateThreshold(idx, { name: e.target.value })}
                      placeholder="Rule Name"
                      className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded text-xs text-slate-900 dark:text-white"
                    />

                    <select
                      value={t.operator}
                      onChange={(e) =>
                        handleUpdateThreshold(idx, {
                          operator: e.target.value as 'gt' | 'gte' | 'lt' | 'lte' | 'eq',
                        })
                      }
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded text-xs text-slate-900 dark:text-white"
                    >
                      <option value="gt">&gt; (Greater Than)</option>
                      <option value="gte">&ge; (Greater or Equal)</option>
                      <option value="lt">&lt; (Less Than)</option>
                      <option value="lte">&le; (Less or Equal)</option>
                      <option value="eq">= (Equal To)</option>
                    </select>

                    <input
                      type="number"
                      value={t.value}
                      onChange={(e) =>
                        handleUpdateThreshold(idx, { value: parseFloat(e.target.value) || 0 })
                      }
                      className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded text-xs text-slate-900 dark:text-white font-mono"
                    />

                    <select
                      value={t.severity}
                      onChange={(e) =>
                        handleUpdateThreshold(idx, { severity: e.target.value as AlertSeverity })
                      }
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        t.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                          : t.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-500/40'
                          : t.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      <option value="INFO">INFO</option>
                      <option value="WARNING">WARNING</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveThreshold(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? 'Saving...' : 'Apply Hardware Configuration'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
