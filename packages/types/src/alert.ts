// ─────────────────────────────────────────────
// @sentinel/types — Alerts & Escalation Matrix
// ─────────────────────────────────────────────

import type { AlertSeverity } from './device.js';

export type AlertStatus =
  | 'CREATED'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'DISMISSED';

export interface Alert {
  id: string;
  organizationId: string;
  facilityId: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  deviceId?: string;
  eventId?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  assignedTo?: string;
  assignedToUser?: {
    id: string;
    fullName?: string;
    email: string;
    role?: string;
  };
  sensorEvidence: Record<string, unknown>;
  recommendedAction?: string;
  escalationLevel: number;
  isEscalated?: boolean;
  slaDeadline?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  updatedAt: string;
  history: AlertHistoryEntry[];
}

export interface AlertHistoryEntry {
  action: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  note?: string;
}

export interface CreateAlertDTO {
  facilityId: string;
  roomId?: string;
  deviceId?: string;
  eventId?: string;
  title: string;
  description: string;
  severity?: AlertSeverity;
  confidence?: number;
  sensorEvidence?: Record<string, unknown>;
  recommendedAction?: string;
  assignedTo?: string;
}

export interface UpdateAlertStatusDTO {
  status: AlertStatus;
  note?: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface EscalateAlertDTO {
  reason?: string;
  targetRole?: string;
}

export interface AlertFilterQuery {
  facilityId?: string;
  roomId?: string;
  deviceId?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  assignedTo?: string;
  isEscalated?: boolean;
  search?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  acknowledgedAlerts: number;
  inProgressAlerts: number;
  resolvedAlerts: number;
  escalatedAlerts: number;
  unassignedAlerts: number;
  avgResolutionTimeMs?: number;
  alertsByFacility?: Record<string, number>;
}
