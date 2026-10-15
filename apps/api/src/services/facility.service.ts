// ─────────────────────────────────────────────
// SENTINEL API — Facility, Floor & Room Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import { FacilityModel } from '../models/Facility.js';
import { FloorModel } from '../models/Floor.js';
import { RoomModel } from '../models/Room.js';
import { AppError } from '../middleware/error-handler.js';
import type {
  Facility,
  Floor,
  Room,
  CreateFacilityDTO,
  UpdateFacilityDTO,
  CreateFloorDTO,
  UpdateFloorDTO,
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomFilterQuery,
} from '@sentinel/types';

export class FacilityService {
  // ─────────────────────────────────────────────
  // FACILITY OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Create a new facility under an organization
   */
  static async createFacility(
    orgId: string,
    userId: string,
    dto: CreateFacilityDTO
  ): Promise<Facility> {
    const existing = await FacilityModel.findOne({
      organizationId: new mongoose.Types.ObjectId(orgId),
      name: dto.name.trim(),
    });

    if (existing) {
      throw new AppError(409, `Facility "${dto.name}" already exists in this organization.`);
    }

    const facility = await FacilityModel.create({
      organizationId: new mongoose.Types.ObjectId(orgId),
      name: dto.name.trim(),
      code: dto.code?.trim().toUpperCase(),
      type: dto.type || 'general',
      address: dto.address?.trim(),
      city: dto.city?.trim(),
      country: dto.country?.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone || 'UTC',
      status: dto.status || 'ACTIVE',
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return facility.toSafeFacility();
  }

  /**
   * Get all facilities for an organization with floor and room aggregations
   */
  static async getFacilities(orgId: string): Promise<(Facility & { totalFloors: number; totalRooms: number })[]> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const facilities = await FacilityModel.find({ organizationId: orgObjectId }).sort({ name: 1 });

    // Aggregate counts
    const facilityIds = facilities.map((f) => f._id);
    const floorCounts = await FloorModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { facilityId: { $in: facilityIds } } },
      { $group: { _id: '$facilityId', count: { $sum: 1 } } },
    ]);
    const floorMap = new Map(floorCounts.map((fc) => [fc._id.toString(), fc.count]));

    const roomCounts = await RoomModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { facilityId: { $in: facilityIds } } },
      { $group: { _id: '$facilityId', count: { $sum: 1 } } },
    ]);
    const roomMap = new Map(roomCounts.map((rc) => [rc._id.toString(), rc.count]));

    return facilities.map((f) => {
      const safe = f.toSafeFacility();
      return {
        ...safe,
        totalFloors: floorMap.get(f._id.toString()) || 0,
        totalRooms: roomMap.get(f._id.toString()) || 0,
      };
    });
  }

  /**
   * Get single facility with its floors
   */
  static async getFacilityById(
    orgId: string,
    facilityId: string
  ): Promise<Facility & { floors: (Floor & { roomCount: number })[] }> {
    const facility = await FacilityModel.findOne({
      _id: new mongoose.Types.ObjectId(facilityId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!facility) {
      throw new AppError(404, 'Facility not found.');
    }

    const floors = await FloorModel.find({ facilityId: facility._id }).sort({ level: 1 });
    const floorIds = floors.map((fl) => fl._id);

    const roomCounts = await RoomModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { floorId: { $in: floorIds } } },
      { $group: { _id: '$floorId', count: { $sum: 1 } } },
    ]);
    const roomCountMap = new Map(roomCounts.map((rc) => [rc._id.toString(), rc.count]));

    const safeFloors = floors.map((fl) => {
      const count = roomCountMap.get(fl._id.toString()) || 0;
      return {
        ...fl.toSafeFloor(count),
        roomCount: count,
      };
    });

    return {
      ...facility.toSafeFacility(),
      totalFloors: floors.length,
      floors: safeFloors,
    };
  }

  /**
   * Update facility
   */
  static async updateFacility(
    orgId: string,
    facilityId: string,
    dto: UpdateFacilityDTO
  ): Promise<Facility> {
    const facility = await FacilityModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(facilityId),
        organizationId: new mongoose.Types.ObjectId(orgId),
      },
      {
        $set: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.address !== undefined && { address: dto.address.trim() }),
          ...(dto.city !== undefined && { city: dto.city.trim() }),
          ...(dto.country !== undefined && { country: dto.country.trim() }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.timezone !== undefined && { timezone: dto.timezone }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      },
      { new: true }
    );

    if (!facility) {
      throw new AppError(404, 'Facility not found.');
    }

    return facility.toSafeFacility();
  }

  /**
   * Delete facility and cascade delete floors and rooms
   */
  static async deleteFacility(orgId: string, facilityId: string): Promise<void> {
    const facility = await FacilityModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(facilityId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!facility) {
      throw new AppError(404, 'Facility not found.');
    }

    // Cascade remove floors and rooms
    await FloorModel.deleteMany({ facilityId: facility._id });
    await RoomModel.deleteMany({ facilityId: facility._id });
  }

  // ─────────────────────────────────────────────
  // FLOOR OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Create a new floor in a facility
   */
  static async createFloor(
    orgId: string,
    facilityId: string,
    userId: string,
    dto: CreateFloorDTO
  ): Promise<Floor> {
    const facility = await FacilityModel.findOne({
      _id: new mongoose.Types.ObjectId(facilityId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!facility) {
      throw new AppError(404, 'Facility not found.');
    }

    const existingLevel = await FloorModel.findOne({
      facilityId: facility._id,
      level: dto.level,
    });

    if (existingLevel) {
      throw new AppError(409, `Floor level ${dto.level} already exists in this facility.`);
    }

    const floor = await FloorModel.create({
      facilityId: facility._id,
      organizationId: facility.organizationId,
      name: dto.name.trim(),
      level: dto.level,
      description: dto.description?.trim(),
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return floor.toSafeFloor(0);
  }

  /**
   * Get all floors for a facility with room counts
   */
  static async getFloorsByFacility(orgId: string, facilityId: string): Promise<Floor[]> {
    const floors = await FloorModel.find({
      facilityId: new mongoose.Types.ObjectId(facilityId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    }).sort({ level: 1 });

    const floorIds = floors.map((f) => f._id);
    const roomCounts = await RoomModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { floorId: { $in: floorIds } } },
      { $group: { _id: '$floorId', count: { $sum: 1 } } },
    ]);
    const roomCountMap = new Map(roomCounts.map((rc) => [rc._id.toString(), rc.count]));

    return floors.map((f) => f.toSafeFloor(roomCountMap.get(f._id.toString()) || 0));
  }

  /**
   * Update floor
   */
  static async updateFloor(
    orgId: string,
    floorId: string,
    dto: UpdateFloorDTO
  ): Promise<Floor> {
    const floor = await FloorModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(floorId),
        organizationId: new mongoose.Types.ObjectId(orgId),
      },
      {
        $set: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.level !== undefined && { level: dto.level }),
          ...(dto.description !== undefined && { description: dto.description.trim() }),
        },
      },
      { new: true }
    );

    if (!floor) {
      throw new AppError(404, 'Floor not found.');
    }

    return floor.toSafeFloor();
  }

  /**
   * Delete floor and cascade delete its rooms
   */
  static async deleteFloor(orgId: string, floorId: string): Promise<void> {
    const floor = await FloorModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(floorId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!floor) {
      throw new AppError(404, 'Floor not found.');
    }

    await RoomModel.deleteMany({ floorId: floor._id });
  }

  // ─────────────────────────────────────────────
  // ROOM OPERATIONS
  // ─────────────────────────────────────────────

  /**
   * Create a new room / spatial area
   */
  static async createRoom(
    orgId: string,
    userId: string,
    dto: CreateRoomDTO
  ): Promise<Room> {
    const facility = await FacilityModel.findOne({
      _id: new mongoose.Types.ObjectId(dto.facilityId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });
    if (!facility) {
      throw new AppError(404, 'Facility not found.');
    }

    const floor = await FloorModel.findOne({
      _id: new mongoose.Types.ObjectId(dto.floorId),
      facilityId: facility._id,
    });
    if (!floor) {
      throw new AppError(404, 'Floor not found.');
    }

    const room = await RoomModel.create({
      floorId: floor._id,
      facilityId: facility._id,
      organizationId: facility.organizationId,
      name: dto.name.trim(),
      roomNumber: dto.roomNumber?.trim(),
      roomType: dto.roomType,
      capacity: dto.capacity || 4,
      description: dto.description?.trim(),
      privacyLevel: dto.privacyLevel || 'STANDARD',
      occupancyState: 'EMPTY',
      estimatedOccupants: 0,
      occupancyConfidence: 0,
      hvacState: dto.hvacState || 'ECO',
      hvacIsSimulated: true,
      currentTemperature: 21.5,
      currentHumidity: 45,
      currentCo2: 450,
      currentSoundLevel: 32,
      doorState: 'closed',
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return room.toSafeRoom();
  }

  /**
   * Get rooms across organization with optional spatial and search filters
   */
  static async getRooms(orgId: string, filter: RoomFilterQuery): Promise<Room[]> {
    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(orgId),
    };

    if (filter.facilityId) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.floorId) {
      query.floorId = new mongoose.Types.ObjectId(filter.floorId);
    }
    if (filter.roomType) {
      query.roomType = filter.roomType;
    }
    if (filter.occupancyState) {
      query.occupancyState = filter.occupancyState;
    }
    if (filter.privacyLevel) {
      query.privacyLevel = filter.privacyLevel;
    }

    if (filter.q) {
      const q = filter.q.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const rooms = await RoomModel.find(query).sort({ roomNumber: 1, name: 1 });
    return rooms.map((r) => r.toSafeRoom());
  }

  /**
   * Get room by ID
   */
  static async getRoomById(orgId: string, roomId: string): Promise<Room> {
    const room = await RoomModel.findOne({
      _id: new mongoose.Types.ObjectId(roomId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!room) {
      throw new AppError(404, 'Room not found.');
    }

    return room.toSafeRoom();
  }

  /**
   * Update room metadata and digital twin telemetry parameters
   */
  static async updateRoom(
    orgId: string,
    roomId: string,
    dto: UpdateRoomDTO
  ): Promise<Room> {
    const room = await RoomModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(roomId),
        organizationId: new mongoose.Types.ObjectId(orgId),
      },
      {
        $set: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.roomNumber !== undefined && { roomNumber: dto.roomNumber.trim() }),
          ...(dto.roomType !== undefined && { roomType: dto.roomType }),
          ...(dto.capacity !== undefined && { capacity: dto.capacity }),
          ...(dto.description !== undefined && { description: dto.description.trim() }),
          ...(dto.privacyLevel !== undefined && { privacyLevel: dto.privacyLevel }),
          ...(dto.occupancyState !== undefined && { occupancyState: dto.occupancyState }),
          ...(dto.estimatedOccupants !== undefined && { estimatedOccupants: dto.estimatedOccupants }),
          ...(dto.occupancyConfidence !== undefined && { occupancyConfidence: dto.occupancyConfidence }),
          ...(dto.hvacState !== undefined && { hvacState: dto.hvacState }),
        },
      },
      { new: true }
    );

    if (!room) {
      throw new AppError(404, 'Room not found.');
    }

    return room.toSafeRoom();
  }

  /**
   * Delete room
   */
  static async deleteRoom(orgId: string, roomId: string): Promise<void> {
    const room = await RoomModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(roomId),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!room) {
      throw new AppError(404, 'Room not found.');
    }
  }

  /**
   * Global Search (Prompt #37): debounced backend room lookup across name, roomNumber, floor & facility
   */
  static async searchRooms(orgId: string, queryText: string, limit = 20): Promise<Room[]> {
    if (!queryText.trim()) return [];

    const regex = new RegExp(queryText.trim(), 'i');
    const rooms = await RoomModel.find({
      organizationId: new mongoose.Types.ObjectId(orgId),
      $or: [{ name: regex }, { roomNumber: regex }, { description: regex }],
    })
      .limit(limit)
      .sort({ roomNumber: 1 });

    return rooms.map((r) => r.toSafeRoom());
  }

  // ─────────────────────────────────────────────
  // SEED DEFAULT DIGITAL TWIN FACILITIES & ROOMS
  // ─────────────────────────────────────────────

  /**
   * Auto-seed representative facilities, floors, and rooms for the 8 industry sectors
   */
  static async seedDefaultFacilities(orgId: string, industry: string): Promise<void> {
    const orgObjectId = new mongoose.Types.ObjectId(orgId);
    const existing = await FacilityModel.findOne({ organizationId: orgObjectId });
    if (existing) return; // Already seeded

    switch (industry) {
      case 'hospital': {
        const fac = await FacilityModel.create({
          organizationId: orgObjectId,
          name: 'Main Pediatric & Inpatient Pavilion',
          code: 'STJ-MAIN',
          type: 'hospital_wing',
          address: '262 Danny Thomas Place',
          city: 'Memphis',
          country: 'United States',
          timezone: 'America/Chicago',
          status: 'ACTIVE',
        });

        const fl1 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Ground Level - Triage & Imaging',
          level: 0,
        });

        const fl2 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Floor 2 - Pediatric Care Wing',
          level: 2,
        });

        await RoomModel.create([
          {
            floorId: fl2._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Inpatient Care Room 204',
            roomNumber: '204',
            roomType: 'hospital_room',
            capacity: 2,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'STATIONARY_OCCUPANCY',
            estimatedOccupants: 1,
            occupancyConfidence: 94,
            hvacState: 'COMFORT',
            hvacIsSimulated: true,
            currentTemperature: 22.1,
            currentHumidity: 46,
            currentCo2: 520,
            currentSoundLevel: 68,
            doorState: 'closed',
            hasActiveAlert: true,
            activeAlertSeverity: 'HIGH',
            description: 'Bathroom acoustic spike & floor stationary posture detected. Assistance indication active.',
          },
          {
            floorId: fl2._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Pediatric Suite 201',
            roomNumber: '201',
            roomType: 'hospital_room',
            capacity: 2,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'OCCUPIED',
            estimatedOccupants: 2,
            occupancyConfidence: 98,
            hvacState: 'COMFORT',
            hvacIsSimulated: true,
            currentTemperature: 21.8,
            currentHumidity: 48,
            currentCo2: 580,
            doorState: 'closed',
          },
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Emergency Triage Bay A',
            roomNumber: 'TRI-01',
            roomType: 'hospital_room',
            capacity: 4,
            privacyLevel: 'STANDARD',
            occupancyState: 'ACTIVE_OCCUPANCY',
            estimatedOccupants: 3,
            occupancyConfidence: 95,
            hvacState: 'COMFORT',
            hvacIsSimulated: true,
            currentTemperature: 21.0,
            currentCo2: 650,
          },
        ]);
        break;
      }

      case 'transport': {
        const fac = await FacilityModel.create({
          organizationId: orgObjectId,
          name: 'Metro Central Bus Terminal & Depot',
          code: 'DEPOT-01',
          type: 'transit_depot',
          address: '800 Transit Way',
          city: 'Metro City',
          country: 'United States',
          timezone: 'America/New_York',
          status: 'ACTIVE',
        });

        const fl1 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Active Route Bus Fleet',
          level: 1,
        });

        await RoomModel.create([
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Route Bus 12 - Passenger Cabin',
            roomNumber: 'BUS-12',
            roomType: 'bus',
            capacity: 48,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'OCCUPIED',
            estimatedOccupants: 1,
            occupancyConfidence: 96,
            hvacState: 'OFF',
            hvacIsSimulated: true,
            doorState: 'closed',
            hasActiveAlert: true,
            activeAlertSeverity: 'CRITICAL',
            description: 'Post-route inspection alert: mmWave sensor detected passenger movement after driver engine-cutoff sequence.',
          },
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Route Bus 08 - Passenger Cabin',
            roomNumber: 'BUS-08',
            roomType: 'bus',
            capacity: 48,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'EMPTY',
            estimatedOccupants: 0,
            occupancyConfidence: 99,
            hvacState: 'OFF',
            hvacIsSimulated: true,
            doorState: 'closed',
          },
        ]);
        break;
      }

      case 'school': {
        const fac = await FacilityModel.create({
          organizationId: orgObjectId,
          name: 'Oakridge Science & STEM Wing',
          code: 'STEM-BLD',
          type: 'academic_building',
          address: '100 Academy Drive',
          city: 'Westwood',
          country: 'United States',
          timezone: 'America/New_York',
          status: 'ACTIVE',
        });

        const fl1 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Floor 1 - Senior Classrooms',
          level: 1,
        });

        await RoomModel.create([
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Senior Science Classroom 8A',
            roomNumber: '8A',
            roomType: 'classroom',
            capacity: 28,
            privacyLevel: 'STANDARD',
            occupancyState: 'HIGH_DENSITY',
            estimatedOccupants: 26,
            occupancyConfidence: 92,
            hvacState: 'VENTILATION_BOOST',
            hvacIsSimulated: true,
            currentCo2: 1450,
            currentTemperature: 24.2,
            hasActiveAlert: true,
            activeAlertSeverity: 'WARNING',
            description: 'CO2 exceeded configured threshold (1,450 ppm). Autonomous actuator triggered ventilation boost.',
          },
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Physics Laboratory 8B',
            roomNumber: '8B',
            roomType: 'classroom',
            capacity: 24,
            privacyLevel: 'STANDARD',
            occupancyState: 'EMPTY',
            estimatedOccupants: 0,
            occupancyConfidence: 99,
            hvacState: 'ECO',
            hvacIsSimulated: true,
            currentCo2: 430,
            currentTemperature: 19.5,
          },
        ]);
        break;
      }

      case 'hotel': {
        const fac = await FacilityModel.create({
          organizationId: orgObjectId,
          name: 'Grandview Oceanfront Hotel Tower',
          code: 'GV-TOWER',
          type: 'hotel_tower',
          address: '500 Boardwalk Ave',
          city: 'Miami',
          country: 'United States',
          timezone: 'America/New_York',
          status: 'ACTIVE',
        });

        const fl4 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Level 4 - Deluxe Suites',
          level: 4,
        });

        await RoomModel.create([
          {
            floorId: fl4._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Executive Deluxe Suite 401',
            roomNumber: '401',
            roomType: 'hotel_room',
            capacity: 3,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'EMPTY',
            estimatedOccupants: 0,
            occupancyConfidence: 98,
            hvacState: 'ECO',
            hvacIsSimulated: true,
            currentTemperature: 20.0,
            doorState: 'closed',
            description: 'Guest checked out. HVAC placed in ECO setback mode to preserve energy.',
          },
          {
            floorId: fl4._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Executive Deluxe Suite 402',
            roomNumber: '402',
            roomType: 'hotel_room',
            capacity: 3,
            privacyLevel: 'HIGH_PRIVACY',
            occupancyState: 'OCCUPIED',
            estimatedOccupants: 2,
            occupancyConfidence: 95,
            hvacState: 'COMFORT',
            hvacIsSimulated: true,
            currentTemperature: 22.5,
            doorState: 'closed',
          },
        ]);
        break;
      }

      default: {
        // Generic facility for other sectors
        const fac = await FacilityModel.create({
          organizationId: orgObjectId,
          name: 'Primary Operations Facility',
          code: 'MAIN-01',
          type: 'general',
          timezone: 'UTC',
          status: 'ACTIVE',
        });

        const fl1 = await FloorModel.create({
          facilityId: fac._id,
          organizationId: orgObjectId,
          name: 'Main Level',
          level: 1,
        });

        await RoomModel.create([
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Operational Suite 101',
            roomNumber: '101',
            roomType: 'office',
            capacity: 6,
            privacyLevel: 'STANDARD',
            occupancyState: 'OCCUPIED',
            estimatedOccupants: 3,
            occupancyConfidence: 91,
            hvacState: 'COMFORT',
            hvacIsSimulated: true,
            currentTemperature: 21.8,
            currentCo2: 520,
          },
          {
            floorId: fl1._id,
            facilityId: fac._id,
            organizationId: orgObjectId,
            name: 'Operational Suite 102',
            roomNumber: '102',
            roomType: 'meeting_room',
            capacity: 10,
            privacyLevel: 'STANDARD',
            occupancyState: 'EMPTY',
            estimatedOccupants: 0,
            occupancyConfidence: 99,
            hvacState: 'ECO',
            hvacIsSimulated: true,
            currentTemperature: 20.2,
            currentCo2: 440,
          },
        ]);
        break;
      }
    }
  }
}
