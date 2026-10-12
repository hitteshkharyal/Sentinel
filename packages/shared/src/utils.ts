// ─────────────────────────────────────────────
// @sentinel/shared — Utility Functions
// ─────────────────────────────────────────────

import type { Permission, Role } from '@sentinel/types';
import { ROLE_PERMISSIONS } from './constants.js';

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes(permission);
}

/**
 * Build an MQTT topic string from a template and parameters.
 */
export function buildMqttTopic(
  template: string,
  params: Record<string, string>
): string {
  let topic = template;
  for (const [key, value] of Object.entries(params)) {
    topic = topic.replace(`{${key}}`, value);
  }
  return topic;
}

/**
 * Clamp a number to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a human-readable event description.
 */
export function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
