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

export const allowlistEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'SUPER_ADMIN',
    'ORGANIZATION_ADMIN',
    'FACILITY_ADMIN',
    'MANAGER',
    'OPERATOR',
    'SECURITY',
    'TECHNICIAN',
    'VIEWER',
  ]).default('OPERATOR'),
  notes: z.string().max(500).optional(),
});

export const reviewAccessRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  role: z.enum([
    'SUPER_ADMIN',
    'ORGANIZATION_ADMIN',
    'FACILITY_ADMIN',
    'MANAGER',
    'OPERATOR',
    'SECURITY',
    'TECHNICIAN',
    'VIEWER',
  ]).optional(),
  notes: z.string().max(500).optional(),
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

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'ORGANIZATION_ADMIN',
    'FACILITY_ADMIN',
    'MANAGER',
    'OPERATOR',
    'SECURITY',
    'TECHNICIAN',
    'VIEWER',
  ]),
  facilityIds: z.array(z.string()).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([
    'ORGANIZATION_ADMIN',
    'FACILITY_ADMIN',
    'MANAGER',
    'OPERATOR',
    'SECURITY',
    'TECHNICIAN',
    'VIEWER',
  ]),
  facilityIds: z.array(z.string()).optional(),
});


// ── Facility ──

export const facilityTypeSchema = z.enum([
  'hospital_wing',
  'hotel_tower',
  'academic_building',
  'transit_depot',
  'corporate_tower',
  'manufacturing_plant',
  'logistics_hub',
  'retail_center',
  'parking_structure',
  'civic_center',
  'general',
]);

export const createFacilitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().max(50).optional(),
  type: facilityTypeSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
});

export const updateFacilitySchema = createFacilitySchema.partial();

// ── Floor ──

export const createFloorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  level: z.number().int(),
  description: z.string().max(500).optional(),
});

export const updateFloorSchema = createFloorSchema.partial();

// ── Room ──

export const roomTypeSchema = z.enum([
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
]);

export const roomOccupancyStateSchema = z.enum([
  'EMPTY',
  'OCCUPIED',
  'STATIONARY_OCCUPANCY',
  'ACTIVE_OCCUPANCY',
  'HIGH_DENSITY',
  'UNKNOWN',
]);

export const roomPrivacyLevelSchema = z.enum([
  'STANDARD',
  'HIGH_PRIVACY',
  'RESTRICTED_ACCESS',
]);

export const hvacStateSchema = z.enum([
  'ECO',
  'COMFORT',
  'OFF',
  'VENTILATION_BOOST',
]);

export const createRoomSchema = z.object({
  floorId: z.string().min(1, 'Floor ID is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  roomNumber: z.string().max(50).optional(),
  roomType: roomTypeSchema,
  capacity: z.number().int().positive().default(4),
  description: z.string().max(1000).optional(),
  privacyLevel: roomPrivacyLevelSchema.default('STANDARD'),
  hvacState: hvacStateSchema.default('ECO'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  roomNumber: z.string().max(50).optional(),
  roomType: roomTypeSchema.optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
  privacyLevel: roomPrivacyLevelSchema.optional(),
  occupancyState: roomOccupancyStateSchema.optional(),
  estimatedOccupants: z.number().int().min(0).optional(),
  occupancyConfidence: z.number().min(0).max(100).optional(),
  hvacState: hvacStateSchema.optional(),
});

export const roomFilterSchema = z.object({
  facilityId: z.string().optional(),
  floorId: z.string().optional(),
  q: z.string().optional(),
  roomType: roomTypeSchema.optional(),
  occupancyState: roomOccupancyStateSchema.optional(),
  privacyLevel: roomPrivacyLevelSchema.optional(),
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
