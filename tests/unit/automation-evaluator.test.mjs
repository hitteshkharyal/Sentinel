// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Automation Condition Evaluator
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Resolves nested property path in object (e.g. "room.currentCo2")
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

/**
 * Evaluate single condition: operator comparison
 */
function evaluateCondition(context, condition) {
  const actualValue = getNestedValue(context, condition.field);
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return actualValue === targetValue;
    case 'neq':
      return actualValue !== targetValue;
    case 'gt':
      return Number(actualValue) > Number(targetValue);
    case 'gte':
      return Number(actualValue) >= Number(targetValue);
    case 'lt':
      return Number(actualValue) < Number(targetValue);
    case 'lte':
      return Number(actualValue) <= Number(targetValue);
    case 'in':
      return Array.isArray(targetValue) && targetValue.includes(actualValue);
    default:
      return false;
  }
}

/**
 * Check if automation rule is within active cooldown
 */
function isRuleInCooldown(lastExecutedAt, cooldownMs, now = Date.now()) {
  if (!lastExecutedAt) return false;
  const elapsed = now - new Date(lastExecutedAt).getTime();
  return elapsed < cooldownMs;
}

describe('Automation Evaluator Unit Tests', () => {
  const sampleContext = {
    room: {
      currentTemperature: 26.5,
      currentCo2: 1150,
      occupancyState: 'OCCUPIED',
      doorState: 'OPEN',
    },
    event: {
      type: 'HIGH_CO2',
      severity: 'WARNING',
    },
  };

  it('should evaluate "gte" and "gt" numerical conditions', () => {
    assert.equal(
      evaluateCondition(sampleContext, { field: 'room.currentCo2', operator: 'gte', value: 1000 }),
      true
    );
    assert.equal(
      evaluateCondition(sampleContext, { field: 'room.currentTemperature', operator: 'gt', value: 30.0 }),
      false
    );
  });

  it('should evaluate "eq" and "neq" string equality conditions', () => {
    assert.equal(
      evaluateCondition(sampleContext, { field: 'room.occupancyState', operator: 'eq', value: 'OCCUPIED' }),
      true
    );
    assert.equal(
      evaluateCondition(sampleContext, { field: 'room.doorState', operator: 'neq', value: 'CLOSED' }),
      true
    );
  });

  it('should evaluate "in" array inclusion condition', () => {
    assert.equal(
      evaluateCondition(sampleContext, {
        field: 'event.type',
        operator: 'in',
        value: ['HIGH_CO2', 'TEMPERATURE_SPIKE', 'FIRE_ALARM'],
      }),
      true
    );
    assert.equal(
      evaluateCondition(sampleContext, {
        field: 'event.type',
        operator: 'in',
        value: ['WATER_LEAK', 'FREEZER_DOOR_AJAR'],
      }),
      false
    );
  });

  it('should enforce rule cooldown intervals to prevent rapid actuation flapping', () => {
    const now = 1000000;
    const cooldownMs = 60000; // 60s

    // Executed 30s ago -> must be blocked by cooldown
    const recentExec = new Date(now - 30000).toISOString();
    assert.equal(isRuleInCooldown(recentExec, cooldownMs, now), true);

    // Executed 70s ago -> cooldown has expired, rule is eligible to fire
    const expiredExec = new Date(now - 70000).toISOString();
    assert.equal(isRuleInCooldown(expiredExec, cooldownMs, now), false);
  });
});
