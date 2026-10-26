// ─────────────────────────────────────────────
// SENTINEL Web — Incident Alert Card with Live SLA Countdown
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import type { Alert, AlertSeverity, AlertStatus } from '@sentinel/types';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Building2,
  DoorOpen,
  UserCheck,
  UserX,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AlertCardProps {
  alert: Alert;
  onInspect: (alert: Alert) => void;
  onAcknowledge: (id: string) => Promise<unknown>;
  onAssign: (alert: Alert) => void;
  onResolve: (alert: Alert) => void;
  onEscalate: (id: string) => Promise<unknown>;
  actionLoadingId?: string | null;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onInspect,
  onAcknowledge,
  onAssign,
  onResolve,
  onEscalate,
  actionLoadingId,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isBreached, setIsBreached] = useState<boolean>(false);

  // Live countdown to SLA Deadline
  useEffect(() => {
    if (!alert.slaDeadline || alert.status === 'RESOLVED' || alert.status === 'DISMISSED') {
      setTimeRemaining('');
      setIsBreached(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const deadline = new Date(alert.slaDeadline!).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsBreached(true);
        const overdueSeconds = Math.floor(Math.abs(diff) / 1000);
        const mins = Math.floor(overdueSeconds / 60);
        const secs = overdueSeconds % 60;
        setTimeRemaining(`+${mins}m ${secs < 10 ? '0' : ''}${secs}s OVERDUE`);
      } else {
        setIsBreached(false);
        const remainingSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(remainingSeconds / 3600);
        const mins = Math.floor((remainingSeconds % 3600) / 60);
        const secs = remainingSeconds % 60;
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${mins}m remaining`);
        } else {
          setTimeRemaining(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [alert.slaDeadline, alert.status]);

  // Visual styling mapped to severity
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          cardBorder: 'border-rose-400 ring-1 ring-rose-300/50 shadow-rose-100',
          badgeVariant: 'danger' as const,
          icon: <AlertOctagon className="w-5 h-5 text-rose-600 animate-bounce" />,
          accentBg: 'bg-rose-50',
          textColor: 'text-rose-900',
        };
      case 'HIGH':
        return {
          cardBorder: 'border-amber-300 ring-1 ring-amber-200/40 shadow-amber-50',
          badgeVariant: 'warning' as const,
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          accentBg: 'bg-amber-50',
          textColor: 'text-amber-900',
        };
      case 'WARNING':
        return {
          cardBorder: 'border-yellow-300 ring-1 ring-yellow-200/40',
          badgeVariant: 'warning' as const,
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          accentBg: 'bg-yellow-50',
          textColor: 'text-yellow-900',
        };
      case 'INFO':
      default:
        return {
          cardBorder: 'border-slate-200',
          badgeVariant: 'primary' as const,
          icon: <Info className="w-5 h-5 text-sentinel-600" />,
          accentBg: 'bg-slate-50',
          textColor: 'text-slate-900',
        };
    }
  };

  const getStatusBadgeVariant = (status: AlertStatus) => {
    switch (status) {
      case 'CREATED':
        return 'primary' as const;
      case 'ACKNOWLEDGED':
        return 'warning' as const;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'info' as const;
      case 'RESOLVED':
        return 'success' as const;
      case 'DISMISSED':
      default:
        return 'neutral' as const;
    }
  };

  const config = getSeverityConfig(alert.severity);
  const isLoading = actionLoadingId === alert.id;
  const isResolvedOrDismissed = alert.status === 'RESOLVED' || alert.status === 'DISMISSED';

  // Format relative creation time
  const createdTimeAgo = () => {
    const elapsedMs = Date.now() - new Date(alert.createdAt).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
        config.cardBorder
      } ${alert.severity === 'CRITICAL' && !isResolvedOrDismissed ? 'animate-pulse-subtle' : ''}`}
    >
      <div>
        {/* ── Top Header Ribbon ── */}
        <div className={`px-4 py-3 flex items-center justify-between border-b border-slate-100 ${config.accentBg}`}>
          <div className="flex items-center gap-2.5">
            {config.icon}
            <Badge variant={config.badgeVariant} size="sm" dot>
              {alert.severity}
            </Badge>

            {/* Escalation Tier Ribbon */}
            {(alert.escalationLevel > 1 || alert.isEscalated) && (
              <Badge variant="danger" size="sm" className="bg-purple-100 text-purple-800 border-purple-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Tier {alert.escalationLevel} Escalated
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(alert.status)} size="sm">
              {alert.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">{createdTimeAgo()}</span>
          </div>
        </div>

        {/* ── Main Body Content ── */}
        <div className="p-4 space-y-3">
          {/* Breadcrumb: Facility & Room */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {alert.facilityName || 'Facility'}
            </span>
            {alert.roomName && (
              <>
                <span className="text-slate-300">/</span>
                <span className="flex items-center gap-1">
                  <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                  {alert.roomName}
                </span>
              </>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-sentinel-600 transition-colors line-clamp-1">
              {alert.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.description}</p>
          </div>

          {/* SLA Countdown & Breach Alert Badge */}
          {timeRemaining && !isResolvedOrDismissed && (
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                isBreached
                  ? 'bg-rose-100/90 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${isBreached ? 'text-rose-600' : 'text-amber-600'}`} />
                <span>{isBreached ? 'SLA BREACHED' : 'SLA ACK DEADLINE'}</span>
              </div>
              <span className="font-mono font-bold tracking-tight">{timeRemaining}</span>
            </div>
          )}

          {/* Operator Assignment Chip */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5">
              {alert.assignedToUser ? (
                <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium truncate max-w-[150px]">
                    {alert.assignedToUser.fullName || alert.assignedToUser.email}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                  <UserX className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium">Unassigned</span>
                </div>
              )}
            </div>

            {/* Recommended Action Pill */}
            {alert.recommendedAction && (
              <span className="text-[11px] text-sentinel-700 font-medium truncate max-w-[160px] italic">
                {alert.recommendedAction}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer Action Toolbar ── */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Left: Quick Lifecycle Actions */}
        <div className="flex items-center gap-1.5">
          {alert.status === 'CREATED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              disabled={isLoading}
              className="text-xs text-sentinel-700 border-sentinel-200 hover:bg-sentinel-50 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-sentinel-600" />
              Ack
            </Button>
          )}

          {!isResolvedOrDismissed && !alert.assignedTo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(alert)}
              className="text-xs text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Assign
            </Button>
          )}

          {!isResolvedOrDismissed && alert.escalationLevel < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEscalate(alert.id)}
              disabled={isLoading}
              className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50 shadow-xs"
              title="Escalate incident to next tier"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Escalate
            </Button>
          )}

          {!isResolvedOrDismissed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(alert)}
              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Resolve
            </Button>
          )}
        </div>

        {/* Right: Full Details Modal Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onInspect(alert)}
          className="text-xs text-slate-600 hover:text-sentinel-700 font-medium flex items-center gap-1"
        >
          <span>Inspect</span>
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
