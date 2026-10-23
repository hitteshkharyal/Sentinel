// ─────────────────────────────────────────────
// SENTINEL Web — Event Detail & Audit Inspection Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { SentinelEvent } from '@sentinel/types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  MapPin,
  Cpu,
  UserCheck,
  CheckCircle2,
  XCircle,
  Radio,
  Activity,
} from 'lucide-react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SentinelEvent | null;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes?: string) => Promise<void>;
  onDismiss: (id: string, notes?: string) => Promise<void>;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  onAcknowledge,
  onResolve,
  onDismiss,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!event) return null;

  const isAssistance =
    event.eventType === 'ASSISTANCE_INDICATION' ||
    (event.recommendation && event.recommendation.toLowerCase().includes('human verification'));

  const handleAction = async (action: 'ACKNOWLEDGE' | 'RESOLVE' | 'DISMISS') => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      if (action === 'ACKNOWLEDGE') {
        await onAcknowledge(event.id, resolutionNotes);
      } else if (action === 'RESOLVE') {
        await onResolve(event.id, resolutionNotes);
      } else if (action === 'DISMISS') {
        await onDismiss(event.id, resolutionNotes);
      }
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
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
          {event.severity === 'CRITICAL' ? (
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              Event Intelligence Audit
            </h3>
            <span className="text-xs text-slate-400 font-mono">ID: {event.id}</span>
          </div>
        </div>
      }
      description="Authoritative sensor fusion snapshot and human verification dispatch."
    >
      <div className="space-y-5">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                event.severity === 'CRITICAL'
                  ? 'danger'
                  : event.severity === 'HIGH' || event.severity === 'WARNING'
                    ? 'warning'
                    : 'info'
              }
              size="sm"
            >
              {event.severity}
            </Badge>

            <Badge
              variant={
                event.status === 'ACTIVE'
                  ? 'danger'
                  : event.status === 'ACKNOWLEDGED'
                    ? 'primary'
                    : event.status === 'RESOLVED'
                      ? 'success'
                      : 'neutral'
              }
              size="sm"
              dot={event.status === 'ACTIVE'}
              pulsing={event.status === 'ACTIVE'}
            >
              {event.status}
            </Badge>

            <span className="text-xs font-mono font-medium text-slate-600">
              {event.eventType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Confidence Score:</span>
            <span className="text-xs font-bold text-slate-800 font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
              {Math.round(event.confidence)}%
            </span>
          </div>
        </div>

        {/* Title & Core Description */}
        <div>
          <h4 className="text-base font-semibold text-slate-900">{event.title}</h4>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{event.description}</p>
        </div>

        {/* Human Verification Notice (Section 11 Compliance) */}
        {isAssistance && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Section 11 Privacy Guarantee</span>
            </div>
            <p className="text-sm font-medium text-amber-900 leading-snug">
              {event.recommendation ||
                'An unusual combination of sensor signals was detected. Human verification is recommended.'}
            </p>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              SENTINEL enforces zero surveillance: no optical camera lenses, facial scanning, or audio
              recordings were used. The platform triangulates high-frequency mmWave radar distance,
              thermal dissipation, and acoustic shockwaves to prompt human assistance.
            </p>
          </div>
        )}

        {/* Spatial & Device Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location Origin</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {event.facilityName || 'Facility'} / {event.roomName || 'Unassigned Room'}
            </p>
            <p className="text-xs text-slate-400 font-mono">Room ID: {event.roomId || 'N/A'}</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Cpu className="w-3.5 h-3.5" />
              <span>Edge Microcontroller</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 font-mono">
              {event.deviceId || 'Platform Fusion Hub'}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{new Date(event.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Fused Input Signals */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-sentinel-600" />
            <span>Contributing Sensor Signals</span>
          </div>

          {event.inputSignals && Object.keys(event.inputSignals).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(event.inputSignals).map(([key, value]) => {
                let formatted = String(value);
                if (typeof value === 'object' && value !== null) {
                  formatted = JSON.stringify(value);
                }
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 font-mono text-xs"
                  >
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                      {key}
                    </span>
                    <span className="text-slate-800 font-medium break-all">{formatted}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No sensory signals captured.</p>
          )}
        </div>

        {/* Resolution Notes & Actions */}
        {event.status !== 'RESOLVED' && event.status !== 'DISMISSED' ? (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resolution or Inspection Notes (Optional)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. In-person room inspection completed. Patient assisted safely. False acoustic spike confirmed."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-sentinel-500/20 focus:border-sentinel-500"
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-600 font-medium">{actionError}</p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Close
              </Button>

              {event.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleAction('ACKNOWLEDGE')}
                  className="gap-1.5 text-xs text-sentinel-700 border-sentinel-200"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Acknowledge
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleAction('RESOLVE')}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Resolved
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleAction('DISMISS')}
                className="gap-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-3.5 h-3.5" />
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Event resolved. Status is archival.</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
