// ─────────────────────────────────────────────
// SENTINEL Web — Calibrate Sensor Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Compass, RotateCcw, CheckCircle, ShieldCheck } from 'lucide-react';
import type { SensorEntity, CalibrateSensorDTO } from '@sentinel/types';
import { useSensor } from '../../context/SensorContext';

interface CalibrateSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensor: SensorEntity | null;
  onCalibrated?: () => void;
}

export const CalibrateSensorModal: React.FC<CalibrateSensorModalProps> = ({
  isOpen,
  onClose,
  sensor,
  onCalibrated,
}) => {
  const { calibrateSensor } = useSensor();

  const [offset, setOffset] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [baseline, setBaseline] = useState<number>(0);
  const [noiseFloor, setNoiseFloor] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sensor) {
      setOffset(sensor.calibration?.offset ?? 0);
      setMultiplier(sensor.calibration?.multiplier ?? 1);
      setBaseline(sensor.calibration?.baseline ?? 0);
      setNoiseFloor(
        sensor.calibration?.noiseFloor !== undefined ? sensor.calibration.noiseFloor : ''
      );
      setError(null);
    }
  }, [sensor]);

  if (!sensor) return null;

  const rawValue =
    typeof sensor.lastReading?.value === 'number'
      ? sensor.lastReading.value
      : typeof sensor.lastReading?.value === 'string'
      ? parseFloat(sensor.lastReading.value) || 0
      : 0;

  // Formula: (Raw - Baseline) * Multiplier + Offset
  const previewCalibrated = (rawValue - baseline) * multiplier + offset;

  const handleResetDefaults = () => {
    setOffset(0);
    setMultiplier(1);
    setBaseline(0);
    setNoiseFloor('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const dto: CalibrateSensorDTO = {
        offset,
        multiplier,
        baseline,
        noiseFloor: noiseFloor !== '' ? Number(noiseFloor) : undefined,
      };

      await calibrateSensor(sensor.id, dto);
      if (onCalibrated) onCalibrated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply calibration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Hardware Calibration
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  {sensor.model}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Linear regression and zero-point baseline offsets for field accuracy.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        {/* Live Calibration Formula Preview */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-black border border-purple-500/20 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Raw Sensor Signal</span>
            <span className="font-mono text-white font-bold">
              {rawValue} {sensor.configuration?.unit || ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold pt-1 border-t border-white/10">
            <span>Calibrated Output (Preview)</span>
            <span className="font-mono text-emerald-400 text-sm font-black">
              {previewCalibrated.toFixed(2)} {sensor.configuration?.unit || ''}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 font-mono mt-1 text-center">
            Output = (Raw - {baseline}) × {multiplier} + ({offset})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Zero Baseline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zero Baseline Level
              </label>
              <input
                type="number"
                step="any"
                value={baseline}
                onChange={(e) => setBaseline(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Atmospheric clean-air baseline
              </span>
            </div>

            {/* Calibration Offset */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Calibration Offset (±)
              </label>
              <input
                type="number"
                step="any"
                value={offset}
                onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Static offset shift
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Multiplier Scalar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gain Multiplier Factor
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
                placeholder="1.0"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Linear slope scaling
              </span>
            </div>

            {/* Noise Floor Threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Noise Floor Cut-Off
              </label>
              <input
                type="number"
                step="any"
                value={noiseFloor}
                onChange={(e) =>
                  setNoiseFloor(e.target.value !== '' ? parseFloat(e.target.value) : '')
                }
                placeholder="Optional"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Signals below are clamped to zero
              </span>
            </div>
          </div>

          {/* Audit Trail Info */}
          {sensor.calibration?.calibratedAt && (
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Last Calibrated
              </span>
              <span className="font-mono text-slate-300">
                {new Date(sensor.calibration.calibratedAt).toLocaleString()}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Applying...' : 'Save Calibration'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
