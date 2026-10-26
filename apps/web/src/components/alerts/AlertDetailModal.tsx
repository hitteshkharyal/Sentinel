// ─────────────────────────────────────────────
// SENTINEL Web — Comprehensive Alert Inspection & Action Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import type { Alert, AlertSeverity, AlertStatus } from '@sentinel/types';
import { useOrganization } from '../../context/OrganizationContext';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Building2,
  DoorOpen,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Shield,
  Activity,
  History,
  Send,
} from 'lucide-react';

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  onAcknowledge: (id: string, note?: string) => Promise<Alert>;
  onAssign: (id: string, assignedToUserId: string, note?: string) => Promise<Alert>;
  onUpdateStatus: (id: string, status: AlertStatus, note?: string) => Promise<Alert>;
  onResolve: (id: string, notes?: string) => Promise<Alert>;
  onDismiss: (id: string, notes?: string) => Promise<Alert>;
  onEscalate: (id: string, reason?: string) => Promise<Alert>;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  isOpen,
  onClose,
  alert,
  onAcknowledge,
  onAssign,
  onUpdateStatus,
  onResolve,
  onDismiss,
  onEscalate,
}) => {
  const { members, fetchMembers } = useOrganization();

  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'history'>('details');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [escalationReason, setEscalationReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isEscalating, setIsEscalating] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isBreached, setIsBreached] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers().catch(() => {});
      setIsResolving(false);
      setIsEscalating(false);
      setResolutionNotes('');
      setEscalationReason('');
      setAssignmentNote('');
      if (alert?.assignedTo) {
        setSelectedUserId(alert.assignedTo);
      } else {
        setSelectedUserId('');
      }
    }
  }, [isOpen, alert, fetchMembers]);

  // SLA Timer
  useEffect(() => {
    if (!alert?.slaDeadline || alert.status === 'RESOLVED' || alert.status === 'DISMISSED') {
      setTimeRemaining('');
      setIsBreached(false);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(alert.slaDeadline!).getTime() - Date.now();
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
  }, [alert]);

  if (!alert) return null;

  const isResolvedOrDismissed = alert.status === 'RESOLVED' || alert.status === 'DISMISSED';

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignOperator = async () => {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    try {
      await onAssign(alert.id, selectedUserId, assignmentNote || undefined);
      setAssignmentNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkInProgress = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(alert.id, 'IN_PROGRESS', 'Operator started investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResolve = async () => {
    setIsSubmitting(true);
    try {
      await onResolve(alert.id, resolutionNotes || 'Incident verified and resolved');
      setIsResolving(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEscalate = async () => {
    setIsSubmitting(true);
    try {
      await onEscalate(alert.id, escalationReason || 'Manual escalation requested');
      setIsEscalating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setIsSubmitting(true);
    try {
      await onDismiss(alert.id, 'Dismissed by operator');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadgeVariant = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'danger' as const;
      case 'HIGH':
      case 'WARNING':
        return 'warning' as const;
      case 'INFO':
      default:
        return 'primary' as const;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          {alert.severity === 'CRITICAL' ? (
            <AlertOctagon className="w-6 h-6 text-rose-600 animate-pulse" />
          ) : alert.severity === 'HIGH' ? (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          ) : alert.severity === 'WARNING' ? (
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          ) : (
            <Info className="w-6 h-6 text-sentinel-600" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 truncate">{alert.title}</span>
              <Badge variant={getSeverityBadgeVariant(alert.severity)} size="sm" dot>
                {alert.severity}
              </Badge>
              <Badge variant={getStatusBadgeVariant(alert.status)} size="sm">
                {alert.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Incident ID: <span className="font-mono text-slate-700">{alert.id}</span>
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Context & Navigation Tabs ── */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'details'
                  ? 'bg-sentinel-50 text-sentinel-700 border border-sentinel-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Incident Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'evidence'
                  ? 'bg-sentinel-50 text-sentinel-700 border border-sentinel-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sensor Evidence
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-sentinel-50 text-sentinel-700 border border-sentinel-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({alert.history?.length || 0})</span>
            </button>
          </div>

          {/* SLA Badge */}
          {timeRemaining && !isResolvedOrDismissed && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                isBreached
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* ── TAB 1: Incident Details ── */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Recommended Action Advisory Banner */}
            {alert.recommendedAction && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sentinel-50/80 to-blue-50/50 border border-sentinel-200/80 flex items-start gap-3 shadow-xs">
                <Shield className="w-5 h-5 text-sentinel-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-sentinel-900 uppercase tracking-wider block mb-0.5">
                    Recommended Operating Procedure:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{alert.recommendedAction}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Incident Description
              </span>
              <p className="text-sm text-slate-800 leading-relaxed">{alert.description}</p>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <span className="text-slate-400 font-medium block">Facility</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {alert.facilityName || alert.facilityId}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <span className="text-slate-400 font-medium block">Room / Zone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1 truncate">
                  <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                  {alert.roomName || alert.roomId || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <span className="text-slate-400 font-medium block">Escalation Tier</span>
                <span className="font-semibold text-purple-700 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                  Tier {alert.escalationLevel} {alert.isEscalated ? '(Escalated)' : ''}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <span className="text-slate-400 font-medium block">Created At</span>
                <span className="font-semibold text-slate-800 mt-1 block font-mono text-[11px]">
                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Operator Assignment Section */}
            {!isResolvedOrDismissed && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-sentinel-600" />
                    Operator Assignment
                  </span>
                  {alert.assignedToUser && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                      Assigned to {alert.assignedToUser.fullName || alert.assignedToUser.email}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="sm:col-span-2 text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
                  >
                    <option value="">Select team member...</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.displayName || m.user?.email || m.userId} ({m.role})
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAssignOperator}
                    disabled={isSubmitting || !selectedUserId}
                    className="text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Assign Operator
                  </Button>
                </div>

                <input
                  type="text"
                  placeholder="Optional assignment instructions..."
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sentinel-500"
                />
              </div>
            )}

            {/* Escalation Prompt Sub-Form */}
            {isEscalating && (
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Escalate Incident to Tier {alert.escalationLevel + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEscalating(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  placeholder="Provide escalation reason (e.g., On-site operator unresponsive; requires facility manager dispatch)..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full text-xs border border-purple-300 rounded-xl p-2.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  rows={2}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmEscalate}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-xs text-white"
                >
                  Confirm Tier Escalation
                </Button>
              </div>
            )}

            {/* Resolution Sub-Form */}
            {isResolving && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Resolve Incident & Close Ticket
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsResolving(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  placeholder="Enter resolution notes (e.g., Room verified empty; ventilation damper cleared)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs border border-emerald-300 rounded-xl p-2.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  rows={2}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmResolve}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                >
                  Verify & Mark Resolved
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Sensor Evidence ── */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Activity className="w-3.5 h-3.5 text-sentinel-600" />
                Raw Telemetry Payload Snapshot
              </span>
              <span className="font-mono text-[11px]">JSON Serialized</span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 shadow-inner">
              {JSON.stringify(alert.sensorEvidence || {}, null, 2)}
            </pre>
          </div>
        )}

        {/* ── TAB 3: Audit History Timeline ── */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {(!alert.history || alert.history.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No historical events logged yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {alert.history.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sentinel-500 ring-4 ring-white" />
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 tracking-wide uppercase text-[10px]">
                          {entry.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        By: <span className="font-semibold text-slate-800">{entry.userName || entry.userId || 'System'}</span>
                      </div>
                      {entry.note && (
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100 italic mt-1">
                          &ldquo;{entry.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modal Action Toolbar ── */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Lifecycle status transitions */}
          <div className="flex flex-wrap items-center gap-2">
            {alert.status === 'CREATED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcknowledge}
                disabled={isSubmitting}
                className="text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Acknowledge Alert
              </Button>
            )}

            {(alert.status === 'ACKNOWLEDGED' || alert.status === 'ASSIGNED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkInProgress}
                disabled={isSubmitting}
                className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <Activity className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Mark In Progress
              </Button>
            )}

            {!isResolvedOrDismissed && alert.escalationLevel < 3 && !isEscalating && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEscalating(true)}
                disabled={isSubmitting}
                className="text-xs border-purple-300 text-purple-800 hover:bg-purple-50"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Escalate Tier
              </Button>
            )}

            {!isResolvedOrDismissed && !isResolving && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsResolving(true)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Resolve Alert
              </Button>
            )}

            {!isResolvedOrDismissed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={isSubmitting}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Dismiss
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
