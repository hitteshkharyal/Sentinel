// ─────────────────────────────────────────────
// @sentinel/shared — Utility Functions
// ─────────────────────────────────────────────

import type { Permission, Role } from '@sentinel/types';
import { ROLE_PERMISSIONS, ROLE_HIERARCHY } from './constants.js';

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return permissions.every((p) => hasPermission(role, p));
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'SUPER_ADMIN') return true;
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
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
