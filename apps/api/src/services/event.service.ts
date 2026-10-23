// ─────────────────────────────────────────────
// SENTINEL API — Event Engine & Multi-Sensor Intelligence
// ─────────────────────────────────────────────

import { EventEmitter } from 'node:events';
import mongoose from 'mongoose';
import {
  EventModel,
  RoomModel,
  FacilityModel,
} from '../models/index.js';
import { FusionService } from './fusion.service.js';
import type {
  ValidatedTelemetry,
  SentinelEvent,
  EventType,
  EventStatus,
  EventFilterQuery,
  EventStats,
  OccupancySnapshot,
  TelemetrySensorData,
} from '@sentinel/types';
import type { AlertSeverity } from '@sentinel/types';

export class EventBus extends EventEmitter {}
export const eventBus = new EventBus();

// Event cooldown windows (milliseconds) to prevent alert flooding
const COOLDOWN_MS: Record<EventType, number> = {
  ROOM_OCCUPIED: 60 * 1000,
  ROOM_VACANT: 60 * 1000,
  HIGH_CO2: 5 * 60 * 1000,
  HIGH_TEMPERATURE: 5 * 60 * 1000,
  LOW_TEMPERATURE: 5 * 60 * 1000,
  ABNORMAL_ACTIVITY: 3 * 60 * 1000,
  ASSISTANCE_INDICATION: 2 * 60 * 1000,
  PROLONGED_INACTIVITY: 10 * 60 * 1000,
  AFTER_HOURS_PRESENCE: 5 * 60 * 1000,
  OVERCAPACITY: 3 * 60 * 1000,
  PERSON_LEFT_BEHIND: 1 * 60 * 1000,
  DEVICE_OFFLINE: 5 * 60 * 1000,
  SENSOR_ERROR: 5 * 60 * 1000,
  ENVIRONMENTAL_ANOMALY: 3 * 60 * 1000,
};

export class EventService {
  /**
   * Authoritative multi-sensor event evaluation from validated telemetry.
   */
  static async evaluateTelemetry(
    telemetry: ValidatedTelemetry
  ): Promise<{ occupancy: OccupancySnapshot; events: SentinelEvent[] }> {
    const generatedEvents: SentinelEvent[] = [];
    if (!telemetry.roomId) {
      // Unassigned devices don't have spatial room context
      return {
        occupancy: {
          roomId: '',
          estimatedOccupancy: 0,
          occupancyConfidence: 0,
          occupancyState: 'UNKNOWN',
          timestamp: telemetry.timestamp,
          inputSignals: {},
        },
        events: [],
      };
    }

    const room = await RoomModel.findById(telemetry.roomId);
    if (!room) {
      return {
        occupancy: {
          roomId: telemetry.roomId,
          estimatedOccupancy: 0,
          occupancyConfidence: 0,
          occupancyState: 'UNKNOWN',
          timestamp: telemetry.timestamp,
          inputSignals: {},
        },
        events: [],
      };
    }

    const facility = await FacilityModel.findById(telemetry.facilityId);
    const prevOccupancyState = room.occupancyState;

    // ── 1. Run Sensor Fusion Engine ──
    const occupancy = await FusionService.fuseTelemetry(telemetry.roomId, telemetry, room);
    const s = telemetry.sensors as TelemetrySensorData;

    // ── 2. Evaluate Event Conditions ──

    // Condition A: Occupancy Transitions (ROOM_OCCUPIED / ROOM_VACANT)
    if (prevOccupancyState === 'EMPTY' && occupancy.occupancyState !== 'EMPTY') {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'ROOM_OCCUPIED',
        severity: 'INFO',
        confidence: occupancy.occupancyConfidence,
        title: `Room Occupied: ${room.name}`,
        description: `Occupancy confirmed via sensor fusion (${occupancy.estimatedOccupancy} occupant(s) estimated).`,
        inputSignals: occupancy.inputSignals,
      });
      if (ev) generatedEvents.push(ev);
    } else if (prevOccupancyState !== 'EMPTY' && occupancy.occupancyState === 'EMPTY') {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'ROOM_VACANT',
        severity: 'INFO',
        confidence: 95,
        title: `Room Vacant: ${room.name}`,
        description: `All occupants cleared. Verified via mmWave radar and PIR vacancy confirmation.`,
        inputSignals: occupancy.inputSignals,
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition B: Privacy-Preserving Assistance / Fall Indication (Master Prompt Section 11 & 12)
    // Anti-False-Positive: Normal sleep/stationary with normal sound and CO2 MUST NOT trigger!
    const isSleepingOrResting =
      occupancy.occupancyState === 'STATIONARY_OCCUPANCY' &&
      (!s.soundLevel || s.soundLevel < 55) &&
      (!s.co2 || s.co2 < 1200) &&
      s.mmwave?.distance !== undefined &&
      s.mmwave.distance > 0.9; // Bed height / standard distance

    const isBedsideFallOrDescent =
      s.mmwave?.presence &&
      s.mmwave.distance !== undefined &&
      s.mmwave.distance <= 0.85 && // Low altitude near floor
      (s.mmwave.stationaryConfidence || 0) >= 80 && // Person immobile on floor
      ((s.soundLevel || 0) >= 70 || s.pir); // Acoustic impact / thud or sudden transition

    if (isBedsideFallOrDescent && !isSleepingOrResting) {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'ASSISTANCE_INDICATION',
        severity: 'CRITICAL',
        confidence: Math.min(99, Math.max(88, s.mmwave?.stationaryConfidence || 92)),
        title: `Assistance Indication Detected: ${room.name}`,
        description: `Potential patient fall or sudden descent detected with low altitude stationary radar presence (${s.mmwave?.distance}m) and ${s.soundLevel ? `${s.soundLevel} dB acoustic thud.` : 'motion trigger.'}`,
        recommendation:
          'An unusual combination of sensor signals was detected. Human verification is recommended.',
        inputSignals: {
          mmwaveDistance: s.mmwave?.distance,
          stationaryConfidence: s.mmwave?.stationaryConfidence,
          soundLevel: s.soundLevel,
          pir: s.pir,
          door: s.door,
        },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition C: School Bus Safety — Left-Behind Child (Master Prompt Section 13)
    const isBusRoom = room.roomType === 'bus' || room.name.toLowerCase().includes('bus');
    const isDoorClosed = s.door === 'closed' || room.doorState === 'closed';
    const isVehicleStationary = !s.gps || (s.gps.speed !== undefined && s.gps.speed < 1.0);
    const hasChildPresence = Boolean(s.mmwave?.presence || s.pir);

    if (isBusRoom && isDoorClosed && isVehicleStationary && hasChildPresence) {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'PERSON_LEFT_BEHIND',
        severity: 'CRITICAL',
        confidence: 96,
        title: `Critical Alert: Person Left Behind aboard ${room.name}`,
        description: `Unattended occupant detected aboard stationary vehicle with passenger doors closed. Immediate cabin verification required.`,
        recommendation:
          'Immediate physical vehicle inspection required. Dispatching emergency notification to driver and transport coordinator.',
        inputSignals: {
          door: s.door || 'closed',
          mmwavePresence: s.mmwave?.presence,
          radarCount: s.mmwave?.count,
          stationaryConfidence: s.mmwave?.stationaryConfidence,
          temperature: s.temperature,
          gps: s.gps,
        },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition D: Indoor Air Quality & CO2 Hazard
    if (s.co2 !== undefined && s.co2 >= 1400) {
      const severity: AlertSeverity = s.co2 >= 2000 ? 'HIGH' : 'WARNING';
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'HIGH_CO2',
        severity,
        confidence: 98,
        title: `Elevated CO₂ Concentration in ${room.name}`,
        description: `Indoor carbon dioxide reached ${s.co2} ppm, exceeding healthy threshold (1,400 ppm).`,
        recommendation:
          'Automated HVAC ventilation trigger recommended. Ensure window or air handler intake is unobstructed.',
        inputSignals: {
          co2Ppm: s.co2,
          occupancyState: occupancy.occupancyState,
          estimatedOccupancy: occupancy.estimatedOccupancy,
        },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition E: Thermal Excursions (High & Low Temperature)
    if (s.temperature !== undefined) {
      if (s.temperature >= 32.0) {
        const ev = await this.triggerOrUpdateEvent({
          organizationId: telemetry.organizationId,
          facilityId: telemetry.facilityId,
          roomId: telemetry.roomId,
          deviceId: telemetry.deviceId,
          facilityName: facility?.name,
          roomName: room.name,
          eventType: 'HIGH_TEMPERATURE',
          severity: s.temperature >= 38.0 ? 'CRITICAL' : 'HIGH',
          confidence: 95,
          title: `High Temperature Breach in ${room.name}`,
          description: `Ambient temperature recorded at ${s.temperature} °C, exceeding comfort and safety limits.`,
          inputSignals: { temperature: s.temperature, humidity: s.humidity },
        });
        if (ev) generatedEvents.push(ev);
      } else if (s.temperature <= 14.0 && room.roomType !== 'storage') {
        const ev = await this.triggerOrUpdateEvent({
          organizationId: telemetry.organizationId,
          facilityId: telemetry.facilityId,
          roomId: telemetry.roomId,
          deviceId: telemetry.deviceId,
          facilityName: facility?.name,
          roomName: room.name,
          eventType: 'LOW_TEMPERATURE',
          severity: 'WARNING',
          confidence: 95,
          title: `Low Temperature Warning in ${room.name}`,
          description: `Ambient temperature dropped to ${s.temperature} °C.`,
          inputSignals: { temperature: s.temperature },
        });
        if (ev) generatedEvents.push(ev);
      }
    }

    // Condition F: Abnormal Activity & Acoustic Spikes
    if (
      s.soundLevel !== undefined &&
      s.soundLevel >= 75.0 &&
      occupancy.occupancyState === 'ACTIVE_OCCUPANCY' &&
      !isBedsideFallOrDescent
    ) {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'ABNORMAL_ACTIVITY',
        severity: 'WARNING',
        confidence: 84,
        title: `Abnormal Acoustic & Activity Pattern in ${room.name}`,
        description: `Unusual acoustic spike (${s.soundLevel} dB) detected concurrent with active room movement.`,
        recommendation:
          'An unusual combination of sensor signals was detected. Human verification is recommended.',
        inputSignals: {
          soundLevelDb: s.soundLevel,
          pir: s.pir,
          movementConfidence: s.mmwave?.movementConfidence,
        },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition G: Room Overcapacity
    if (room.capacity && occupancy.estimatedOccupancy > room.capacity) {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'OVERCAPACITY',
        severity: 'WARNING',
        confidence: 88,
        title: `Overcapacity Warning in ${room.name}`,
        description: `Estimated occupancy (${occupancy.estimatedOccupancy}) exceeds designated maximum room capacity (${room.capacity}).`,
        inputSignals: {
          estimatedOccupancy: occupancy.estimatedOccupancy,
          roomCapacity: room.capacity,
          radarCount: s.mmwave?.count,
        },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Condition H: Cleanroom Pressure Differential Loss / Environmental Anomaly
    if (s.pressure !== undefined && s.pressure < 100.5 && s.door === 'open') {
      const ev = await this.triggerOrUpdateEvent({
        organizationId: telemetry.organizationId,
        facilityId: telemetry.facilityId,
        roomId: telemetry.roomId,
        deviceId: telemetry.deviceId,
        facilityName: facility?.name,
        roomName: room.name,
        eventType: 'ENVIRONMENTAL_ANOMALY',
        severity: 'HIGH',
        confidence: 94,
        title: `Airlock Pressure Breach in ${room.name}`,
        description: `Pressure differential dropped to ${s.pressure} kPa while door remains open. Particulate containment compromised.`,
        recommendation: 'Verify cleanroom airlock seal and ensure positive pressure cascade.',
        inputSignals: { pressureKpa: s.pressure, door: s.door },
      });
      if (ev) generatedEvents.push(ev);
    }

    // Update Room alert state if critical or high severity events generated
    const hasActiveSevere = generatedEvents.some(
      (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH'
    );
    if (hasActiveSevere) {
      const topSeverity = generatedEvents.some((e) => e.severity === 'CRITICAL')
        ? 'CRITICAL'
        : 'HIGH';
      await RoomModel.updateOne(
        { _id: room._id },
        {
          $set: {
            hasActiveAlert: true,
            activeAlertSeverity: topSeverity,
          },
        }
      );
    }

    return {
      occupancy,
      events: generatedEvents,
    };
  }

  /**
   * Internal dampening & de-duplication helper:
   * Reuses active event if within cooldown period, updating input signals rather than spamming.
   */
  private static async triggerOrUpdateEvent(params: {
    organizationId: string;
    facilityId: string;
    roomId?: string;
    deviceId?: string;
    facilityName?: string;
    roomName?: string;
    deviceName?: string;
    eventType: EventType;
    severity: AlertSeverity;
    confidence: number;
    title: string;
    description: string;
    recommendation?: string;
    inputSignals: Record<string, unknown>;
  }): Promise<SentinelEvent | null> {
    const cooldownDuration = COOLDOWN_MS[params.eventType] || 2 * 60 * 1000;
    const cooldownBoundary = new Date(Date.now() - cooldownDuration);

    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      eventType: params.eventType,
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
      timestamp: { $gte: cooldownBoundary },
    };

    if (params.roomId) {
      query.roomId = new mongoose.Types.ObjectId(params.roomId);
    }

    // Check for existing unexpired event
    const existing = await EventModel.findOne(query);

    if (existing) {
      // Update existing event signals & confidence instead of spamming duplicates
      existing.inputSignals = params.inputSignals;
      existing.confidence = params.confidence;
      existing.timestamp = new Date();
      await existing.save();
      return existing.toSafeEvent();
    }

    // Create fresh authoritative event
    const newDoc = new EventModel({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      facilityId: new mongoose.Types.ObjectId(params.facilityId),
      roomId: params.roomId ? new mongoose.Types.ObjectId(params.roomId) : undefined,
      deviceId: params.deviceId,
      facilityName: params.facilityName,
      roomName: params.roomName,
      deviceName: params.deviceName,
      eventType: params.eventType,
      severity: params.severity,
      confidence: params.confidence,
      timestamp: new Date(),
      title: params.title,
      description: params.description,
      recommendation: params.recommendation,
      inputSignals: params.inputSignals,
      status: 'ACTIVE',
    });

    await newDoc.save();
    const safeEvent = newDoc.toSafeEvent();

    // Broadcast across event bus
    eventBus.emit('event', safeEvent);

    return safeEvent;
  }

  /**
   * List paginated events with full multi-parameter filtering.
   */
  static async listEvents(
    organizationId: string,
    filter: EventFilterQuery = {}
  ): Promise<{ events: SentinelEvent[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };

    if (filter.facilityId) query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    if (filter.roomId) query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    if (filter.deviceId) query.deviceId = filter.deviceId.trim().toUpperCase();
    if (filter.eventType) query.eventType = filter.eventType;
    if (filter.severity) query.severity = filter.severity;
    if (filter.status) query.status = filter.status;

    if (filter.startTime || filter.endTime) {
      query.timestamp = {};
      if (filter.startTime) (query.timestamp as Record<string, unknown>).$gte = new Date(filter.startTime);
      if (filter.endTime) (query.timestamp as Record<string, unknown>).$lte = new Date(filter.endTime);
    }

    if (filter.search) {
      const term = filter.search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { roomName: { $regex: term, $options: 'i' } },
        { facilityName: { $regex: term, $options: 'i' } },
        { deviceId: { $regex: term, $options: 'i' } },
      ];
    }

    const total = await EventModel.countDocuments(query);
    const docs = await EventModel.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return {
      events: docs.map((d) => d.toSafeEvent()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve aggregate KPI metrics for events in an organization.
   */
  static async getEventStats(organizationId: string): Promise<EventStats> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const totalEvents = await EventModel.countDocuments({ organizationId: orgObjId });
    const activeEvents = await EventModel.countDocuments({
      organizationId: orgObjId,
      status: 'ACTIVE',
    });
    const criticalEvents = await EventModel.countDocuments({
      organizationId: orgObjId,
      severity: 'CRITICAL',
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
    });
    const acknowledgedEvents = await EventModel.countDocuments({
      organizationId: orgObjId,
      status: 'ACKNOWLEDGED',
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const resolvedToday = await EventModel.countDocuments({
      organizationId: orgObjId,
      status: 'RESOLVED',
      resolvedAt: { $gte: startOfToday },
    });

    // Breakdown by eventType
    const typeAgg = await EventModel.aggregate([
      { $match: { organizationId: orgObjId } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);
    const eventsByType: Record<string, number> = {};
    for (const item of typeAgg) {
      eventsByType[item._id] = item.count;
    }

    // Breakdown by severity
    const sevAgg = await EventModel.aggregate([
      { $match: { organizationId: orgObjId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const eventsBySeverity: Record<string, number> = {};
    for (const item of sevAgg) {
      eventsBySeverity[item._id] = item.count;
    }

    return {
      totalEvents,
      activeEvents,
      criticalEvents,
      acknowledgedEvents,
      resolvedToday,
      eventsByType,
      eventsBySeverity,
    };
  }

  /**
   * Get single event by ID.
   */
  static async getEventById(id: string, organizationId: string): Promise<SentinelEvent | null> {
    const doc = await EventModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });
    return doc ? doc.toSafeEvent() : null;
  }

  /**
   * Update event status (ACKNOWLEDGED, RESOLVED, DISMISSED) with resolution notes.
   */
  static async updateEventStatus(
    id: string,
    organizationId: string,
    status: EventStatus,
    userId?: string,
    notes?: string
  ): Promise<SentinelEvent | null> {
    const doc = await EventModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) return null;

    doc.status = status;
    if (status === 'ACKNOWLEDGED') {
      doc.acknowledgedAt = new Date();
      if (userId) doc.acknowledgedBy = new mongoose.Types.ObjectId(userId);
    } else if (status === 'RESOLVED' || status === 'DISMISSED') {
      doc.resolvedAt = new Date();
      if (userId) doc.resolvedBy = new mongoose.Types.ObjectId(userId);
      if (notes) doc.resolutionNotes = notes.trim();
    }

    await doc.save();

    // Check if room has remaining active alerts
    if (doc.roomId && (status === 'RESOLVED' || status === 'DISMISSED')) {
      const remainingSevere = await EventModel.findOne({
        roomId: doc.roomId,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] },
        severity: { $in: ['CRITICAL', 'HIGH'] },
      });

      if (!remainingSevere) {
        await RoomModel.updateOne(
          { _id: doc.roomId },
          {
            $set: {
              hasActiveAlert: false,
              activeAlertSeverity: undefined,
            },
          }
        );
      }
    }

    const updated = doc.toSafeEvent();
    eventBus.emit('event:status', updated);
    return updated;
  }
}
