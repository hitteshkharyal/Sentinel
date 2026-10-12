// ─────────────────────────────────────────────
// @sentinel/validation — Zod Schemas
// ─────────────────────────────────────────────

import { z } from 'zod';

// ── Auth ──

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
});

// ── Organization ──

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  industry: z.enum([
    'hotel',
    'hospital',
    'school',
    'transport',
    'office',
    'mall',
    'factory',
    'warehouse',
    'parking',
    'public_facility',
    'general',
  ]),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
});

// ── Facility ──

export const createFacilitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

// ── Floor ──

export const createFloorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  level: z.number().int(),
});

// ── Room ──

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  roomNumber: z.string().max(50).optional(),
  roomType: z.enum([
    'hotel_room',
    'hospital_room',
    'classroom',
    'office',
    'meeting_room',
    'lobby',
    'corridor',
    'restroom',
    'storage',
    'parking_zone',
    'factory_zone',
    'warehouse_zone',
    'mall_zone',
    'elevator',
    'bus',
    'general',
  ]),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

// ── Pagination ──

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
});
