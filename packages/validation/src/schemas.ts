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

// ── Sensors (Day 6) ──

export const sensorTypeSchema = z.enum([
  'PIR',
  'MMWAVE',
  'CO2',
  'TEMPERATURE',
  'HUMIDITY',
  'SOUND_LEVEL',
  'DOOR_MAGNETIC',
  'PRESSURE',
  'LIGHT',
  'SMOKE',
  'GAS',
  'FLAME',
  'WATER_LEAK',
  'VIBRATION',
  'ULTRASONIC',
  'CURRENT',
  'GPS',
  'RFID',
]);

export const sensorInterfaceSchema = z.enum([
  'GPIO',
  'ADC',
  'PWM',
  'I2C',
  'SPI',
  'UART',
  'WIFI',
  'MQTT',
]);

export const sensorStatusSchema = z.enum([
  'ONLINE',
  'OFFLINE',
  'CALIBRATING',
  'ERROR',
  'UNPROVISIONED',
]);

export const sensorCategorySchema = z.enum([
  'PRESENCE_MOTION',
  'ENVIRONMENTAL',
  'SAFETY_HAZARD',
  'STRUCTURAL_POWER',
  'ACCESS_TELEMETRY',
]);

export const sensorThresholdSchema = z.object({
  name: z.string().min(1).max(100),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  value: z.number(),
  severity: z.enum(['INFO', 'WARNING', 'HIGH', 'CRITICAL']),
});

export const sensorDetailedConfigSchema = z.object({
  gpioPin: z.number().int().min(0).max(48).optional(),
  i2cAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{2}$/, 'Must be a valid hex address e.g. 0x62')
    .optional(),
  baudRate: z.number().int().positive().optional(),
  samplingIntervalMs: z.number().int().min(50).max(86400000).default(5000),
  unit: z.string().max(20).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  thresholds: z.array(sensorThresholdSchema).optional(),
  filterWindowSize: z.number().int().min(1).max(100).optional(),
  debounceMs: z.number().int().min(0).max(60000).optional(),
});

export const sensorCalibrationSchema = z.object({
  offset: z.number().default(0),
  multiplier: z.number().default(1),
  baseline: z.number().default(0),
  noiseFloor: z.number().optional(),
});

export const createSensorSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  deviceId: z.string().optional(),
  name: z.string().min(1, 'Sensor name is required').max(100),
  sensorType: sensorTypeSchema,
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  interfaceType: sensorInterfaceSchema,
  configuration: sensorDetailedConfigSchema.partial().optional(),
  calibration: sensorCalibrationSchema.partial().optional(),
  enabled: z.boolean().default(true),
});

export const updateSensorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  deviceId: z.string().optional(),
  enabled: z.boolean().optional(),
  status: sensorStatusSchema.optional(),
});

export const configureSensorSchema = z.object({
  gpioPin: z.number().int().min(0).max(48).optional(),
  i2cAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{2}$/, 'Must be a valid hex address e.g. 0x62')
    .optional(),
  baudRate: z.number().int().positive().optional(),
  samplingIntervalMs: z.number().int().min(50).max(86400000).optional(),
  unit: z.string().max(20).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  thresholds: z.array(sensorThresholdSchema).optional(),
  filterWindowSize: z.number().int().min(1).max(100).optional(),
  debounceMs: z.number().int().min(0).max(60000).optional(),
});

export const calibrateSensorSchema = z.object({
  offset: z.number().optional(),
  multiplier: z.number().optional(),
  baseline: z.number().optional(),
  noiseFloor: z.number().optional(),
});

export const sensorFilterSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  deviceId: z.string().optional(),
  sensorType: sensorTypeSchema.optional(),
  interfaceType: sensorInterfaceSchema.optional(),
  category: sensorCategorySchema.optional(),
  enabled: z.coerce.boolean().optional(),
  status: sensorStatusSchema.optional(),
  q: z.string().optional(),
});

// ── Devices & ESP32 Microcontrollers (Day 7) ──

export const deviceStatusSchema = z.enum([
  'UNREGISTERED',
  'PROVISIONING',
  'ONLINE',
  'OFFLINE',
  'ERROR',
  'UPDATING',
  'DISABLED',
]);

export const chipModelSchema = z.enum([
  'ESP32-WROOM-32D',
  'ESP32-WROOM-32U',
  'ESP32-S3-WROOM-1',
  'ESP32-C3-MINI',
  'ESP32-CAM',
  'ESP32-GENERIC',
]);

export const powerSourceSchema = z.enum(['MAINS', 'BATTERY', 'POE', 'USB']);

export const macAddressSchema = z
  .string()
  .regex(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    'Must be a valid MAC address (e.g. 24:6F:28:A4:CF:12)'
  );

export const registerDeviceSchema = z.object({
  deviceId: z
    .string()
    .min(3, 'Device ID must have at least 3 characters')
    .max(64)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Device ID must contain only alphanumeric characters, underscores, and dashes'
    ),
  name: z.string().min(1, 'Device name is required').max(100),
  macAddress: macAddressSchema,
  chipModel: chipModelSchema.default('ESP32-WROOM-32D'),
  hardwareVersion: z.string().min(1).max(30).default('v3.2'),
  firmwareVersion: z.string().min(1).max(30).default('v1.0.0'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  roomId: z.string().optional(),
  powerSource: powerSourceSchema.default('MAINS'),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: deviceStatusSchema.optional(),
  firmwareVersion: z.string().max(30).optional(),
  facilityId: z.string().optional(),
  roomId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const assignDeviceSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  roomId: z.string().nullable().optional(),
});

export const deviceHeartbeatSchema = z.object({
  firmwareVersion: z.string().max(30).optional(),
  ipAddress: z.string().max(45).optional(),
  wifiRssiDbm: z.number().int().min(-120).max(0).optional(),
  freeHeapBytes: z.number().int().nonnegative().optional(),
  uptimeSeconds: z.number().int().nonnegative().optional(),
  batteryPercent: z.number().int().min(0).max(100).optional(),
  status: deviceStatusSchema.optional(),
  error: z.string().max(500).optional(),
});

export const rotateDeviceSecretSchema = z.object({
  reason: z.string().max(250).optional(),
});

export const deviceFilterSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  status: deviceStatusSchema.optional(),
  chipModel: chipModelSchema.optional(),
  q: z.string().optional(),
});

// ── Telemetry & MQTT Pipeline (Day 8) ──

export const doorStateSchema = z.enum(['open', 'closed']);

export const mmwaveDataSchema = z.object({
  presence: z.boolean(),
  count: z.number().int().min(0).max(100).optional(),
  distance: z.number().min(0).max(100).optional(),
  energy: z.number().min(0).max(100).optional(),
  stationaryConfidence: z.number().min(0).max(100).optional(),
  movementConfidence: z.number().min(0).max(100).optional(),
});

export const gpsDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  altitude: z.number().optional(),
  satellites: z.number().int().min(0).optional(),
});

export const rfidDataSchema = z.object({
  uid: z.string().min(2).max(64),
  tagType: z.string().max(50).optional(),
});

export const telemetrySensorDataSchema = z
  .object({
    pir: z.boolean().optional(),
    mmwave: mmwaveDataSchema.optional(),
    co2: z.number().min(0).max(50000).optional(),
    temperature: z.number().min(-60).max(160).optional(),
    humidity: z.number().min(0).max(100).optional(),
    soundLevel: z.number().min(0).max(180).optional(),
    door: doorStateSchema.optional(),
    pressure: z.number().min(200).max(1500).optional(),
    light: z.number().min(0).max(250000).optional(),
    smoke: z.union([z.boolean(), z.number()]).optional(),
    gas: z.number().min(0).optional(),
    flame: z.boolean().optional(),
    waterLeak: z.boolean().optional(),
    vibration: z.number().min(0).optional(),
    ultrasonic: z.number().min(0).max(2000).optional(),
    current: z.number().min(0).optional(),
    gps: gpsDataSchema.optional(),
    rfid: rfidDataSchema.optional(),
  })
  .passthrough();

export const telemetryMessageSchema = z.object({
  deviceId: z
    .string()
    .min(2, 'Device ID must have at least 2 characters')
    .max(64),
  timestamp: z
    .string()
    .refine((ts) => !isNaN(Date.parse(ts)), 'Must be a valid ISO-8601 timestamp string'),
  sensors: telemetrySensorDataSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const telemetryFilterSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  deviceId: z.string().optional(),
  sensorType: z.string().optional(),
  validOnly: z.coerce.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});

export const deviceCommandSchema = z.object({
  deviceId: z.string().min(2).max(64),
  command: z.string().min(1).max(50),
  params: z.record(z.unknown()).optional(),
});

// ── Event & Sensor Fusion ──

export const eventStatusSchema = z.enum([
  'ACTIVE',
  'ACKNOWLEDGED',
  'RESOLVED',
  'EXPIRED',
  'DISMISSED',
]);

export const eventTypeSchema = z.enum([
  'ROOM_OCCUPIED',
  'ROOM_VACANT',
  'HIGH_CO2',
  'HIGH_TEMPERATURE',
  'LOW_TEMPERATURE',
  'ABNORMAL_ACTIVITY',
  'ASSISTANCE_INDICATION',
  'PROLONGED_INACTIVITY',
  'AFTER_HOURS_PRESENCE',
  'OVERCAPACITY',
  'PERSON_LEFT_BEHIND',
  'DEVICE_OFFLINE',
  'SENSOR_ERROR',
  'ENVIRONMENTAL_ANOMALY',
]);

export const eventFilterSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  deviceId: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});

export const updateEventStatusSchema = z.object({
  status: eventStatusSchema,
  notes: z.string().max(1000).optional(),
});

export const evaluateEventSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  deviceId: z.string().optional(),
  timestamp: z.string().optional(),
  signals: z.record(z.unknown()),
});

// ── Automation & Actuators ──

export const automationActionTypeSchema = z.enum([
  'HVAC_ECO',
  'HVAC_COMFORT',
  'LIGHT_ON',
  'LIGHT_OFF',
  'VENTILATION_INCREASE',
  'VENTILATION_NORMAL',
  'CREATE_ALERT',
  'SEND_NOTIFICATION',
  'ESCALATE_ALERT',
  'BUZZER',
  'RELAY',
]);

export const automationConditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.unknown()),
    z.record(z.unknown()),
  ]),
});

export const automationActionSchema = z.object({
  type: automationActionTypeSchema,
  params: z.record(z.unknown()).optional(),
  simulated: z.boolean().default(true),
  targetDeviceId: z.string().optional(),
});

export const createAutomationRuleSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  name: z.string().min(1, 'Rule name is required').max(150),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  triggerEventType: eventTypeSchema,
  conditions: z.array(automationConditionSchema).optional().default([]),
  actions: z.array(automationActionSchema).min(1, 'At least one action is required'),
  cooldownMs: z.coerce.number().int().min(0).max(86400000).default(60000),
});

export const updateAutomationRuleSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  triggerEventType: eventTypeSchema.optional(),
  conditions: z.array(automationConditionSchema).optional(),
  actions: z.array(automationActionSchema).min(1).optional(),
  cooldownMs: z.coerce.number().int().min(0).max(86400000).optional(),
});

export const automationFilterSchema = z.object({
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  triggerEventType: eventTypeSchema.optional(),
  enabled: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});

export const automationExecutionFilterSchema = z.object({
  automationId: z.string().optional(),
  facilityId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.enum(['SUCCESS', 'PARTIAL', 'FAILED']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
});

export const testAutomationRuleSchema = z.object({
  ruleId: z.string().optional(),
  rule: createAutomationRuleSchema.optional(),
  syntheticEvent: z.object({
    eventType: eventTypeSchema,
    severity: z.string().optional(),
    roomId: z.string().optional(),
    facilityId: z.string().optional(),
    confidence: z.number().optional(),
    inputSignals: z.record(z.unknown()).optional(),
  }),
});



