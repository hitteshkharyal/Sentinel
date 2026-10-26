// ─────────────────────────────────────────────
// SENTINEL Web — Manual Incident / Alert Creation Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { AlertSeverity, CreateAlertDTO } from '@sentinel/types';
import { useAlerts } from '../../context/AlertContext';
import { useFacility } from '../../context/FacilityContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ isOpen, onClose }) => {
  const { createAlert } = useAlerts();
  const { facilities, rooms } = useFacility();

  const [severity, setSeverity] = useState<AlertSeverity>('HIGH');
  const [facilityId, setFacilityId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [recommendedAction, setRecommendedAction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default facility if available
  React.useEffect(() => {
    if (facilities.length > 0 && !facilityId && facilities[0]?.id) {
      setFacilityId(facilities[0].id);
    }
  }, [facilities, facilityId]);

  // Presets for quick sandbox verification
  const applyPreset = (preset: 'CO2' | 'RADAR' | 'FALL' | 'COMFORT') => {
    switch (preset) {
      case 'CO2':
        setSeverity('HIGH');
        setTitle('Severe CO2 Spike (2100 ppm) — Indoor Air Hazard');
        setDescription('NDIR sensor detected sustained CO2 concentration above 2000 ppm threshold for 12 consecutive minutes.');
        setRecommendedAction('Activate emergency HVAC purge damper at 100% capacity.');
        break;
      case 'RADAR':
        setSeverity('CRITICAL');
        setTitle('Unattended Occupant Detected After Lockdown');
        setDescription('60GHz mmWave radar verified micro-respiratory presence in restricted zone during scheduled empty state.');
        setRecommendedAction('Dispatch floor security guard to inspect room immediately.');
        break;
      case 'FALL':
        setSeverity('CRITICAL');
        setTitle('Sudden Fall / Immobility Event Detected');
        setDescription('Biometric mmWave doppler signature detected sudden height drop followed by prolonged immobility.');
        setRecommendedAction('Trigger medical emergency response protocol; dispatch on-duty nurse.');
        break;
      case 'COMFORT':
        setSeverity('WARNING');
        setTitle('Thermal Comfort & Humidity Drift');
        setDescription('Zone temperature exceeded maximum threshold (27.8°C, 78% RH).');
        setRecommendedAction('Check primary chilled water valve position.');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !facilityId) {
      setError('Please provide a title, description, and target facility.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dto: CreateAlertDTO = {
        facilityId,
        roomId: roomId || undefined,
        title: title.trim(),
        description: description.trim(),
        severity,
        recommendedAction: recommendedAction.trim() || undefined,
        sensorEvidence: {
          manualTrigger: true,
          timestamp: new Date().toISOString(),
          source: 'OPERATOR_CONSOLE',
        },
      };

      await createAlert(dto);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setRecommendedAction('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger incident';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-sentinel-600" />
          <span>Trigger Incident / Dispatch Alert</span>
        </div>
      }
      description="Create a manual incident or inject an emergency test event with deterministic SLA tracking and audio beacon dispatch."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Presets */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Test Scenarios</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('RADAR')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-medium transition-colors"
            >
              Critical Radar Presence
            </button>
            <button
              type="button"
              onClick={() => applyPreset('FALL')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-medium transition-colors"
            >
              Critical Fall Emergency
            </button>
            <button
              type="button"
              onClick={() => applyPreset('CO2')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-medium transition-colors"
            >
              High CO2 Hazard (2100 ppm)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('COMFORT')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 hover:bg-yellow-100 font-medium transition-colors"
            >
              Warning Comfort Drift
            </button>
          </div>
        </div>

        {/* Severity Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Severity Level</label>
          <div className="grid grid-cols-4 gap-2">
            {(['CRITICAL', 'HIGH', 'WARNING', 'INFO'] as AlertSeverity[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  severity === s
                    ? s === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-300/40 shadow-xs'
                      : s === 'HIGH'
                      ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-300/40 shadow-xs'
                      : s === 'WARNING'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300/40 shadow-xs'
                      : 'bg-sentinel-50 border-sentinel-400 text-sentinel-800 ring-2 ring-sentinel-300/40 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'CRITICAL' ? (
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                ) : s === 'HIGH' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                ) : s === 'WARNING' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-sentinel-600" />
                )}
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Facility & Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              >
                <option value="">Select facility...</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Zone (Optional)</label>
            <div className="relative">
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              >
                <option value="">Unassigned Zone / All Rooms</option>
                {rooms
                  .filter((r) => !facilityId || r.facilityId === facilityId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.roomType})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Incident Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Unattended Occupant in Restroom After Hours"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Incident Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            placeholder="Provide context on the sensor condition or anomaly..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          />
        </div>

        {/* Recommended Action */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended SOP / Action</label>
          <input
            type="text"
            placeholder="e.g. Inspect zone and confirm zero physical presence"
            value={recommendedAction}
            onChange={(e) => setRecommendedAction(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Dispatching...' : 'Dispatch Incident Alert'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
