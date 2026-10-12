// ─────────────────────────────────────────────
// @sentinel/types — Alerts
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
  roomId?: string;
  deviceId?: string;
  eventId?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  assignedTo?: string;
  sensorEvidence: Record<string, unknown>;
  recommendedAction?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  updatedAt: string;
  history: AlertHistoryEntry[];
}

export interface AlertHistoryEntry {
  action: string;
  userId?: string;
  timestamp: string;
  note?: string;
}
