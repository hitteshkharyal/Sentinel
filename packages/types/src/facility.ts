// ─────────────────────────────────────────────
// @sentinel/types — Facility, Floor, Room
// ─────────────────────────────────────────────

export type FacilityStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type FacilityType =
  | 'hospital_wing'
  | 'hotel_tower'
  | 'academic_building'
  | 'transit_depot'
  | 'corporate_tower'
  | 'manufacturing_plant'
  | 'logistics_hub'
  | 'retail_center'
  | 'parking_structure'
  | 'civic_center'
  | 'general';

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  type?: FacilityType;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  status: FacilityStatus;
  totalFloors?: number;
  totalRooms?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  facilityId: string;
  organizationId: string;
  name: string;
  level: number;
  roomCount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomType =
  | 'hotel_room'
  | 'hospital_room'
  | 'classroom'
  | 'office'
  | 'meeting_room'
  | 'lobby'
  | 'corridor'
  | 'restroom'
  | 'storage'
  | 'parking_zone'
  | 'factory_zone'
  | 'warehouse_zone'
  | 'mall_zone'
  | 'elevator'
  | 'bus'
  | 'general';

export type RoomOccupancyState =
  | 'EMPTY'
  | 'OCCUPIED'
  | 'STATIONARY_OCCUPANCY'
  | 'ACTIVE_OCCUPANCY'
  | 'HIGH_DENSITY'
  | 'UNKNOWN';

export type RoomPrivacyLevel = 'STANDARD' | 'HIGH_PRIVACY' | 'RESTRICTED_ACCESS';

export type HvacState = 'ECO' | 'COMFORT' | 'OFF' | 'VENTILATION_BOOST';

export interface Room {
  id: string;
  floorId: string;
  facilityId: string;
  organizationId: string;
  name: string;
  roomNumber?: string;
  roomType: RoomType;
  capacity: number;
  description?: string;
  privacyLevel: RoomPrivacyLevel;
  occupancyState: RoomOccupancyState;
  estimatedOccupants: number;
  occupancyConfidence: number; // 0-100%
  hvacState: HvacState;
  hvacIsSimulated: boolean;
  currentTemperature?: number;
  currentHumidity?: number;
  currentCo2?: number;
  currentSoundLevel?: number;
  doorState?: 'open' | 'closed';
  hasActiveAlert?: boolean;
  activeAlertSeverity?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityDTO {
  name: string;
  code?: string;
  type?: FacilityType;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  status?: FacilityStatus;
}

export interface UpdateFacilityDTO {
  name?: string;
  code?: string;
  type?: FacilityType;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  status?: FacilityStatus;
}

export interface CreateFloorDTO {
  name: string;
  level: number;
  description?: string;
}

export interface UpdateFloorDTO {
  name?: string;
  level?: number;
  description?: string;
}

export interface CreateRoomDTO {
  floorId: string;
  facilityId: string;
  name: string;
  roomNumber?: string;
  roomType: RoomType;
  capacity?: number;
  description?: string;
  privacyLevel?: RoomPrivacyLevel;
  hvacState?: HvacState;
}

export interface UpdateRoomDTO {
  name?: string;
  roomNumber?: string;
  roomType?: RoomType;
  capacity?: number;
  description?: string;
  privacyLevel?: RoomPrivacyLevel;
  occupancyState?: RoomOccupancyState;
  estimatedOccupants?: number;
  occupancyConfidence?: number;
  hvacState?: HvacState;
}

export interface RoomFilterQuery {
  facilityId?: string;
  floorId?: string;
  q?: string;
  roomType?: RoomType;
  occupancyState?: RoomOccupancyState;
  privacyLevel?: RoomPrivacyLevel;
}
