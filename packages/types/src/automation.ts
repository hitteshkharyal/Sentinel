// ─────────────────────────────────────────────
// @sentinel/types — Automation
// ─────────────────────────────────────────────

import type { EventType } from './event.js';

export type AutomationActionType =
  | 'HVAC_ECO'
  | 'HVAC_COMFORT'
  | 'LIGHT_ON'
  | 'LIGHT_OFF'
  | 'VENTILATION_INCREASE'
  | 'VENTILATION_NORMAL'
  | 'CREATE_ALERT'
  | 'SEND_NOTIFICATION'
  | 'ESCALATE_ALERT'
  | 'BUZZER'
  | 'RELAY';

export interface AutomationRule {
  id: string;
  organizationId: string;
  facilityId?: string;
  roomId?: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerEventType: EventType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: unknown;
}

export interface AutomationAction {
  type: AutomationActionType;
  params?: Record<string, unknown>;
  simulated: boolean;
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  eventId: string;
  organizationId: string;
  facilityId?: string;
  roomId?: string;
  actions: ExecutedAction[];
  executedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface ExecutedAction {
  type: AutomationActionType;
  simulated: boolean;
  success: boolean;
  error?: string;
  executedAt: string;
}
