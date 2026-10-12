// ─────────────────────────────────────────────
// @sentinel/types — Facility, Floor, Room
// ─────────────────────────────────────────────

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  facilityId: string;
  organizationId: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  floorId: string;
  facilityId: string;
  organizationId: string;
  name: string;
  roomNumber?: string;
  roomType: RoomType;
  capacity?: number;
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
