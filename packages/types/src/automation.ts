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
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerEventType: EventType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMs: number;
  lastExecutedAt?: string;
  executionCount?: number;
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
  targetDeviceId?: string;
}

export interface AutomationExecution {
  id: string;
  automationId: string;
  ruleName?: string;
  eventId: string;
  organizationId: string;
  facilityId?: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  triggerEvent?: {
    eventType: EventType;
    severity?: string;
    title?: string;
  };
  actions: ExecutedAction[];
  executedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  durationMs?: number;
}

export interface ExecutedAction {
  type: AutomationActionType;
  simulated: boolean;
  success: boolean;
  error?: string;
  params?: Record<string, unknown>;
  feedback?: string;
  executedAt: string;
}

export interface CreateAutomationRuleDTO {
  facilityId?: string;
  roomId?: string;
  name: string;
  description?: string;
  enabled?: boolean;
  triggerEventType: EventType;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMs?: number;
}

export interface UpdateAutomationRuleDTO {
  facilityId?: string;
  roomId?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  triggerEventType?: EventType;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
  cooldownMs?: number;
}

export interface AutomationFilterQuery {
  facilityId?: string;
  roomId?: string;
  triggerEventType?: EventType;
  enabled?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AutomationExecutionFilterQuery {
  automationId?: string;
  facilityId?: string;
  roomId?: string;
  status?: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  executionsToday: number;
  successRate: number;
  energySetbacksTriggered: number;
  ventilationsTriggered: number;
  executionsByAction: Record<string, number>;
}
