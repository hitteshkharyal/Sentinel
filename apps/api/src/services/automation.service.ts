// ─────────────────────────────────────────────
// SENTINEL API — Autonomous Policy & Automation Engine
// ─────────────────────────────────────────────

import { EventEmitter } from 'node:events';
import mongoose from 'mongoose';
import {
  AutomationRuleModel,
  AutomationExecutionModel,
  RoomModel,
  FacilityModel,
} from '../models/index.js';
import { ActuatorService } from './actuator.service.js';
import { eventBus } from './event.service.js';
import type {
  SentinelEvent,
  AutomationRule,
  AutomationExecution,
  AutomationCondition,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
  AutomationFilterQuery,
  AutomationExecutionFilterQuery,
  AutomationStats,
  ExecutedAction,
} from '@sentinel/types';

export class AutomationEventBus extends EventEmitter {}
export const automationBus = new AutomationEventBus();

export class AutomationService {
  private static isInitialized = false;

  /**
   * Initialize automation engine event listeners.
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to authoritative event bus emitted by Day 9 Sensor Fusion Engine
    eventBus.on('event', async (event: SentinelEvent) => {
      try {
        await AutomationService.processEvent(event);
      } catch (err) {
        console.error('[AutomationService] Error processing event automation:', err);
      }
    });
  }

  /**
   * Evaluate and execute all matching automation rules for an authoritative event.
   */
  static async processEvent(event: SentinelEvent): Promise<AutomationExecution[]> {
    const executions: AutomationExecution[] = [];

    // Query active rules for this organization and trigger event type
    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(event.organizationId),
      enabled: true,
      triggerEventType: event.eventType,
    };

    const rules = await AutomationRuleModel.find(query);
    const now = Date.now();

    for (const rule of rules) {
      // ── 1. Spatial Scope Checking ──
      if (rule.facilityId && event.facilityId && rule.facilityId.toString() !== event.facilityId) {
        continue;
      }
      if (rule.roomId && event.roomId && rule.roomId.toString() !== event.roomId) {
        continue;
      }

      // ── 2. Cooldown Anti-Flapping Verification ──
      if (rule.lastExecutedAt) {
        const elapsedMs = now - rule.lastExecutedAt.getTime();
        if (elapsedMs < (rule.cooldownMs || 60000)) {
          // Rule in cooldown; skip execution
          continue;
        }
      }

      // ── 3. Condition Evaluation ──
      const conditionsPassed = this.evaluateAllConditions(rule.conditions || [], event);
      if (!conditionsPassed) {
        continue;
      }

      // ── 4. Execute Actuator Actions ──
      const startTime = Date.now();
      const actionResults: ExecutedAction[] = [];

      for (const act of rule.actions) {
        const result = await ActuatorService.executeAction(act, {
          organizationId: event.organizationId,
          facilityId: event.facilityId,
          roomId: event.roomId,
        });
        actionResults.push(result);
      }

      const durationMs = Date.now() - startTime;
      const allSucceeded = actionResults.every((a) => a.success);
      const anySucceeded = actionResults.some((a) => a.success);
      const status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = allSucceeded
        ? 'SUCCESS'
        : anySucceeded
          ? 'PARTIAL'
          : 'FAILED';

      // ── 5. Record Execution Log ──
      const executionDoc = new AutomationExecutionModel({
        automationId: rule._id,
        ruleName: rule.name,
        eventId: mongoose.Types.ObjectId.isValid(event.id)
          ? new mongoose.Types.ObjectId(event.id)
          : new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(event.organizationId),
        facilityId: event.facilityId && mongoose.Types.ObjectId.isValid(event.facilityId)
          ? new mongoose.Types.ObjectId(event.facilityId)
          : undefined,
        facilityName: event.facilityName,
        roomId: event.roomId && mongoose.Types.ObjectId.isValid(event.roomId)
          ? new mongoose.Types.ObjectId(event.roomId)
          : undefined,
        roomName: event.roomName,
        triggerEvent: {
          eventType: event.eventType,
          severity: event.severity,
          title: event.title,
        },
        actions: actionResults,
        executedAt: new Date(),
        status,
        durationMs,
      });

      await executionDoc.save();

      // Update Rule statistics
      rule.lastExecutedAt = new Date();
      rule.executionCount = (rule.executionCount || 0) + 1;
      await rule.save();

      const safeExecution = executionDoc.toSafeExecution();
      executions.push(safeExecution);

      // Broadcast execution event over WebSocket
      automationBus.emit('execution', safeExecution);
    }

    return executions;
  }

  /**
   * Evaluate a collection of conditions against event signals.
   */
  private static evaluateAllConditions(
    conditions: AutomationCondition[],
    event: SentinelEvent
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((cond) => {
      const actualValue = this.extractFieldValue(cond.field, event);
      if (actualValue === undefined) return false;

      switch (cond.operator) {
        case 'eq':
          return actualValue === cond.value;
        case 'neq':
          return actualValue !== cond.value;
        case 'gt':
          return Number(actualValue) > Number(cond.value);
        case 'gte':
          return Number(actualValue) >= Number(cond.value);
        case 'lt':
          return Number(actualValue) < Number(cond.value);
        case 'lte':
          return Number(actualValue) <= Number(cond.value);
        case 'in':
          return Array.isArray(cond.value) && cond.value.includes(actualValue);
        default:
          return false;
      }
    });
  }

  /**
   * Helper extracting dot-notated values from an event object.
   */
  private static extractFieldValue(path: string, event: SentinelEvent): unknown {
    if (path === 'confidence') return event.confidence;
    if (path === 'severity') return event.severity;
    if (path === 'eventType') return event.eventType;
    if (path === 'roomId') return event.roomId;
    if (path === 'facilityId') return event.facilityId;

    if (path.startsWith('inputSignals.')) {
      const key = path.replace('inputSignals.', '');
      return event.inputSignals ? event.inputSignals[key] : undefined;
    }

    return event.inputSignals ? event.inputSignals[path] : undefined;
  }

  /**
   * Seed standard autonomous policies for an organization (Prompt Section 34 & 49).
   */
  static async seedDefaultRules(organizationId: string): Promise<void> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const existing = await AutomationRuleModel.countDocuments({ organizationId: orgObjId });
    if (existing > 0) return;

    const defaultPolicies: CreateAutomationRuleDTO[] = [
      {
        name: 'Vacancy Energy Setback (HVAC ECO + Lights Off)',
        description: 'Automatically shifts HVAC to ECO mode and powers down lighting when all occupants clear the room.',
        enabled: true,
        triggerEventType: 'ROOM_VACANT',
        conditions: [{ field: 'confidence', operator: 'gte', value: 85 }],
        actions: [
          { type: 'HVAC_ECO', simulated: true },
          { type: 'LIGHT_OFF', simulated: true },
        ],
        cooldownMs: 60000,
      },
      {
        name: 'High CO₂ Fresh Air Ventilation Boost',
        description: 'Increases mechanical air exchange when indoor carbon dioxide exceeds 1,400 ppm threshold.',
        enabled: true,
        triggerEventType: 'HIGH_CO2',
        conditions: [{ field: 'inputSignals.co2Ppm', operator: 'gte', value: 1400 }],
        actions: [
          { type: 'VENTILATION_INCREASE', simulated: true, params: { speed: 'boost' } },
        ],
        cooldownMs: 120000,
      },
      {
        name: 'Occupancy Climate Pre-Conditioning',
        description: 'Restores room to Comfort HVAC setpoint and activates interior lighting upon occupant entry.',
        enabled: true,
        triggerEventType: 'ROOM_OCCUPIED',
        conditions: [{ field: 'confidence', operator: 'gte', value: 80 }],
        actions: [
          { type: 'HVAC_COMFORT', simulated: true },
          { type: 'LIGHT_ON', simulated: true },
        ],
        cooldownMs: 60000,
      },
      {
        name: 'School Bus Person-Left-Behind Emergency Horn & Alert',
        description: 'Engages vehicle horn relay and emergency dispatch when a passenger remains aboard a locked bus.',
        enabled: true,
        triggerEventType: 'PERSON_LEFT_BEHIND',
        conditions: [{ field: 'confidence', operator: 'gte', value: 90 }],
        actions: [
          { type: 'RELAY', simulated: true, params: { relayPin: 12, state: true } },
          { type: 'BUZZER', simulated: true, params: { durationMs: 5000 } },
          { type: 'SEND_NOTIFICATION', simulated: true, params: { priority: 'URGENT' } },
        ],
        cooldownMs: 30000,
      },
    ];

    for (const p of defaultPolicies) {
      await this.createRule(organizationId, p);
    }
  }

  /**
   * List paginated automation rules.
   */
  static async listRules(
    organizationId: string,
    filter: AutomationFilterQuery = {}
  ): Promise<{ rules: AutomationRule[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };

    if (filter.facilityId) query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    if (filter.roomId) query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    if (filter.triggerEventType) query.triggerEventType = filter.triggerEventType;
    if (filter.enabled !== undefined) query.enabled = filter.enabled;

    if (filter.search) {
      const term = filter.search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { roomName: { $regex: term, $options: 'i' } },
        { facilityName: { $regex: term, $options: 'i' } },
      ];
    }

    const total = await AutomationRuleModel.countDocuments(query);
    const docs = await AutomationRuleModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      rules: docs.map((d) => d.toSafeRule()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single rule by ID.
   */
  static async getRuleById(id: string, organizationId: string): Promise<AutomationRule | null> {
    const doc = await AutomationRuleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return doc ? doc.toSafeRule() : null;
  }

  /**
   * Create new automation rule.
   */
  static async createRule(
    organizationId: string,
    dto: CreateAutomationRuleDTO
  ): Promise<AutomationRule> {
    let facilityName: string | undefined;
    let roomName: string | undefined;

    if (dto.facilityId) {
      const facility = await FacilityModel.findById(dto.facilityId);
      facilityName = facility?.name;
    }

    if (dto.roomId) {
      const room = await RoomModel.findById(dto.roomId);
      roomName = room?.name;
      if (!facilityName && room) {
        const facility = await FacilityModel.findById(room.facilityId);
        facilityName = facility?.name;
      }
    }

    const doc = new AutomationRuleModel({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      facilityId: dto.facilityId ? new mongoose.Types.ObjectId(dto.facilityId) : undefined,
      facilityName,
      roomId: dto.roomId ? new mongoose.Types.ObjectId(dto.roomId) : undefined,
      roomName,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      enabled: dto.enabled !== false,
      triggerEventType: dto.triggerEventType,
      conditions: dto.conditions || [],
      actions: dto.actions,
      cooldownMs: dto.cooldownMs ?? 60000,
      executionCount: 0,
    });

    await doc.save();
    return doc.toSafeRule();
  }

  /**
   * Update existing automation rule.
   */
  static async updateRule(
    id: string,
    organizationId: string,
    dto: UpdateAutomationRuleDTO
  ): Promise<AutomationRule | null> {
    const doc = await AutomationRuleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) return null;

    if (dto.name !== undefined) doc.name = dto.name.trim();
    if (dto.description !== undefined) doc.description = dto.description.trim();
    if (dto.enabled !== undefined) doc.enabled = dto.enabled;
    if (dto.triggerEventType !== undefined) doc.triggerEventType = dto.triggerEventType;
    if (dto.conditions !== undefined) doc.conditions = dto.conditions;
    if (dto.actions !== undefined) doc.actions = dto.actions;
    if (dto.cooldownMs !== undefined) doc.cooldownMs = dto.cooldownMs;

    if (dto.facilityId !== undefined) {
      doc.facilityId = dto.facilityId ? new mongoose.Types.ObjectId(dto.facilityId) : undefined;
      const fac = dto.facilityId ? await FacilityModel.findById(dto.facilityId) : null;
      doc.facilityName = fac?.name;
    }

    if (dto.roomId !== undefined) {
      doc.roomId = dto.roomId ? new mongoose.Types.ObjectId(dto.roomId) : undefined;
      const r = dto.roomId ? await RoomModel.findById(dto.roomId) : null;
      doc.roomName = r?.name;
    }

    await doc.save();
    return doc.toSafeRule();
  }

  /**
   * Delete automation rule.
   */
  static async deleteRule(id: string, organizationId: string): Promise<boolean> {
    const res = await AutomationRuleModel.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return res.deletedCount > 0;
  }

  /**
   * Quick toggle rule enabled state.
   */
  static async toggleRule(id: string, organizationId: string): Promise<AutomationRule | null> {
    const doc = await AutomationRuleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) return null;

    doc.enabled = !doc.enabled;
    await doc.save();
    return doc.toSafeRule();
  }

  /**
   * List paginated execution audit logs.
   */
  static async listExecutions(
    organizationId: string,
    filter: AutomationExecutionFilterQuery = {}
  ): Promise<{
    executions: AutomationExecution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };

    if (filter.automationId) {
      query.automationId = new mongoose.Types.ObjectId(filter.automationId);
    }
    if (filter.facilityId) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.roomId) {
      query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    }
    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.startTime || filter.endTime) {
      query.executedAt = {};
      if (filter.startTime) {
        (query.executedAt as Record<string, unknown>).$gte = new Date(filter.startTime);
      }
      if (filter.endTime) {
        (query.executedAt as Record<string, unknown>).$lte = new Date(filter.endTime);
      }
    }

    const total = await AutomationExecutionModel.countDocuments(query);
    const docs = await AutomationExecutionModel.find(query)
      .sort({ executedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      executions: docs.map((d) => d.toSafeExecution()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get aggregate automation stats for organization dashboard.
   */
  static async getStats(organizationId: string): Promise<AutomationStats> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const totalRules = await AutomationRuleModel.countDocuments({ organizationId: orgObjId });
    const activeRules = await AutomationRuleModel.countDocuments({
      organizationId: orgObjId,
      enabled: true,
    });
    const totalExecutions = await AutomationExecutionModel.countDocuments({
      organizationId: orgObjId,
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const executionsToday = await AutomationExecutionModel.countDocuments({
      organizationId: orgObjId,
      executedAt: { $gte: startOfToday },
    });

    const successfulExecutions = await AutomationExecutionModel.countDocuments({
      organizationId: orgObjId,
      status: 'SUCCESS',
    });

    const successRate = totalExecutions > 0
      ? Math.round((successfulExecutions / totalExecutions) * 100)
      : 100;

    // Breakdown by executed actions
    const executionsByActionAgg = await AutomationExecutionModel.aggregate([
      { $match: { organizationId: orgObjId } },
      { $unwind: '$actions' },
      { $group: { _id: '$actions.type', count: { $sum: 1 } } },
    ]);

    const executionsByAction: Record<string, number> = {};
    for (const item of executionsByActionAgg) {
      executionsByAction[item._id] = item.count;
    }

    const energySetbacksTriggered =
      (executionsByAction['HVAC_ECO'] || 0) + (executionsByAction['LIGHT_OFF'] || 0);
    const ventilationsTriggered = executionsByAction['VENTILATION_INCREASE'] || 0;

    return {
      totalRules,
      activeRules,
      totalExecutions,
      executionsToday,
      successRate,
      energySetbacksTriggered,
      ventilationsTriggered,
      executionsByAction,
    };
  }

  /**
   * Authoritative testing / simulation sandbox endpoint.
   */
  static async testRule(
    organizationId: string,
    payload: {
      ruleId?: string;
      rule?: CreateAutomationRuleDTO;
      syntheticEvent: {
        eventType: string;
        severity?: string;
        roomId?: string;
        facilityId?: string;
        confidence?: number;
        inputSignals?: Record<string, unknown>;
      };
    }
  ): Promise<{
    matched: boolean;
    conditionsEvaluated: { field: string; passed: boolean }[];
    executedActions: ExecutedAction[];
  }> {
    let ruleToTest: CreateAutomationRuleDTO | null = payload.rule || null;

    if (payload.ruleId) {
      const existing = await AutomationRuleModel.findOne({
        _id: new mongoose.Types.ObjectId(payload.ruleId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      });
      if (existing) {
        ruleToTest = existing.toSafeRule();
      }
    }

    if (!ruleToTest) {
      throw new Error('No automation rule provided for testing.');
    }

    const dummyEvent: SentinelEvent = {
      id: `sim-ev-${Date.now()}`,
      organizationId,
      facilityId: payload.syntheticEvent.facilityId || '',
      roomId: payload.syntheticEvent.roomId,
      eventType: payload.syntheticEvent.eventType as SentinelEvent['eventType'],
      severity: (payload.syntheticEvent.severity as SentinelEvent['severity']) || 'INFO',
      confidence: payload.syntheticEvent.confidence ?? 95,
      timestamp: new Date().toISOString(),
      title: `Simulation Event: ${payload.syntheticEvent.eventType}`,
      description: 'Synthetic event generated for automation sandbox testing.',
      inputSignals: payload.syntheticEvent.inputSignals || {},
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conditionsEvaluated = (ruleToTest.conditions || []).map((cond) => {
      const passed = AutomationService.evaluateAllConditions([cond], dummyEvent);
      return { field: cond.field, passed };
    });

    const allPassed = conditionsEvaluated.every((c) => c.passed);
    const executedActions: ExecutedAction[] = [];

    if (allPassed) {
      for (const act of ruleToTest.actions) {
        const result = await ActuatorService.executeAction(act, {
          organizationId,
          facilityId: dummyEvent.facilityId,
          roomId: dummyEvent.roomId,
        });
        executedActions.push(result);
      }
    }

    return {
      matched: allPassed,
      conditionsEvaluated,
      executedActions,
    };
  }
}
