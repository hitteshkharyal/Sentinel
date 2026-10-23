// ─────────────────────────────────────────────
// SENTINEL Web — Authoritative Event Card Component
// ─────────────────────────────────────────────

import React from 'react';
import type { SentinelEvent, AlertSeverity, EventStatus } from '@sentinel/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  Cpu,
  UserCheck,
  Eye,
  Check,
  XCircle,
} from 'lucide-react';

interface EventCardProps {
  event: SentinelEvent;
  onInspect: (event: SentinelEvent) => void;
  onAcknowledge: (id: string) => void;
  onResolve: (event: SentinelEvent) => void;
  onDismiss: (id: string) => void;
  isActionLoading?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onInspect,
  onAcknowledge,
  onResolve,
  onDismiss,
  isActionLoading = false,
}) => {
  const isAssistance =
    event.eventType === 'ASSISTANCE_INDICATION' ||
    (event.recommendation && event.recommendation.toLowerCase().includes('human verification'));

  const severityBadgeMap: Record<
    AlertSeverity,
    { variant: 'danger' | 'warning' | 'info' | 'neutral'; label: string; icon: React.ReactNode }
  > = {
    CRITICAL: {
      variant: 'danger',
      label: 'Critical',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
    },
    HIGH: {
      variant: 'warning',
      label: 'High Severity',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    },
    WARNING: {
      variant: 'warning',
      label: 'Warning',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    },
    INFO: {
      variant: 'info',
      label: 'Notice',
      icon: <Info className="w-3.5 h-3.5 text-sky-600" />,
    },
  };

  const statusBadgeMap: Record<
    EventStatus,
    { variant: 'danger' | 'primary' | 'success' | 'neutral'; label: string; dot: boolean; pulsing: boolean }
  > = {
    ACTIVE: { variant: 'danger', label: 'Active', dot: true, pulsing: true },
    ACKNOWLEDGED: { variant: 'primary', label: 'Acknowledged', dot: true, pulsing: false },
    RESOLVED: { variant: 'success', label: 'Resolved', dot: true, pulsing: false },
    EXPIRED: { variant: 'neutral', label: 'Expired', dot: false, pulsing: false },
    DISMISSED: { variant: 'neutral', label: 'Dismissed', dot: false, pulsing: false },
  };

  const currentSeverity = severityBadgeMap[event.severity] || severityBadgeMap.INFO;
  const currentStatus = statusBadgeMap[event.status] || statusBadgeMap.ACTIVE;

  // Format timestamp
  const dateFormatted = new Date(event.timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`rounded-2xl transition-all duration-200 border p-5 ${
        event.severity === 'CRITICAL' && event.status === 'ACTIVE'
          ? 'bg-rose-50/20 border-rose-300 shadow-sm shadow-rose-900/5 ring-1 ring-rose-200'
          : event.status === 'ACTIVE'
            ? 'bg-white border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-sentinel-300'
            : 'bg-slate-50/60 border-slate-200/60 text-slate-600'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={currentSeverity.variant}
            size="sm"
            className="flex items-center gap-1 font-semibold"
          >
            {currentSeverity.icon}
            {currentSeverity.label}
          </Badge>

          <Badge
            variant={currentStatus.variant}
            size="sm"
            dot={currentStatus.dot}
            pulsing={currentStatus.pulsing}
          >
            {currentStatus.label}
          </Badge>

          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
            {event.eventType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Confidence:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  event.confidence >= 90
                    ? 'bg-emerald-500'
                    : event.confidence >= 75
                      ? 'bg-sentinel-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, event.confidence))}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 font-mono">
              {Math.round(event.confidence)}%
            </span>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-3">
        <h4 className="text-base font-semibold text-slate-900 tracking-tight leading-snug">
          {event.title}
        </h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{event.description}</p>
      </div>

      {/* Privacy-Preserving Human Verification Recommendation Banner (Prompt Section 11 & 12) */}
      {isAssistance && (
        <div className="my-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-300/80 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900 leading-snug">
              Human Verification Recommended
            </p>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              {event.recommendation ||
                'An unusual combination of sensor signals was detected. Human verification is recommended.'}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-700/80 font-medium">
              <UserCheck className="w-3 h-3 shrink-0" />
              <span>Zero cameras or microphones used — privacy-preserving radar & acoustic telemetry.</span>
            </div>
          </div>
        </div>
      )}

      {/* Spatial Metadata & Device */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 border-y border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">
            {event.facilityName || 'Facility'}
            {event.roomName && (
              <>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-sentinel-700 font-semibold">{event.roomName}</span>
              </>
            )}
          </span>
        </div>

        {event.deviceId && (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.deviceId}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{dateFormatted}</span>
        </div>
      </div>

      {/* Contributing Sensor Signals */}
      {event.inputSignals && Object.keys(event.inputSignals).length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Radio className="w-3 h-3" /> Signals:
          </span>
          {Object.entries(event.inputSignals).map(([key, val]) => {
            if (val === undefined || val === null) return null;
            let displayVal = String(val);
            if (typeof val === 'object') {
              displayVal = JSON.stringify(val);
            }
            return (
              <span
                key={key}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-700 border border-slate-200/50 font-mono"
              >
                <span className="text-slate-400">{key}:</span> {displayVal}
              </span>
            );
          })}
        </div>
      )}

      {/* Resolution Notes (if resolved) */}
      {event.resolutionNotes && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-semibold mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolution Notes</span>
          </div>
          <p className="text-emerald-700 leading-relaxed">{event.resolutionNotes}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onInspect(event)}
          className="gap-1.5 text-xs"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect Event
        </Button>

        <div className="flex items-center gap-2">
          {event.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              onClick={() => onAcknowledge(event.id)}
              className="gap-1.5 text-xs text-sentinel-700 border-sentinel-200 hover:bg-sentinel-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Acknowledge
            </Button>
          )}

          {(event.status === 'ACTIVE' || event.status === 'ACKNOWLEDGED') && (
            <Button
              variant="primary"
              size="sm"
              disabled={isActionLoading}
              onClick={() => onResolve(event)}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-3.5 h-3.5" />
              Resolve Incident
            </Button>
          )}

          {event.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isActionLoading}
              onClick={() => onDismiss(event.id)}
              className="gap-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-3.5 h-3.5" />
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
