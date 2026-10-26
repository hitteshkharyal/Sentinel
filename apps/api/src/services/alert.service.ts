// ─────────────────────────────────────────────
// SENTINEL API — Alert Engine, Escalation Matrix & SLA Management
// ─────────────────────────────────────────────

import { EventEmitter } from 'node:events';
import mongoose from 'mongoose';
import {
  AlertModel,
  RoomModel,
  FacilityModel,
  UserModel,
} from '../models/index.js';
import { eventBus } from './event.service.js';
import type {
  Alert,
  AlertSeverity,
  CreateAlertDTO,
  UpdateAlertStatusDTO,
  AlertFilterQuery,
  AlertStats,
  SentinelEvent,
} from '@sentinel/types';

export class AlertEventBus extends EventEmitter {}
export const alertBus = new AlertEventBus();

// SLA Acknowledgement Deadlines by Severity (milliseconds)
const SLA_DEADLINES_MS: Record<AlertSeverity, number> = {
  CRITICAL: 5 * 60 * 1000, // 5 minutes SLA
  HIGH: 15 * 60 * 1000,    // 15 minutes SLA
  WARNING: 60 * 60 * 1000, // 1 hour SLA
  INFO: 4 * 60 * 60 * 1000,// 4 hours SLA
};

export class AlertService {
  private static isInitialized = false;

  /**
   * Initialize Alert Engine listeners for incoming authoritative events.
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to authoritative events from Sensor Fusion Engine
    eventBus.on('event', async (event: SentinelEvent) => {
      try {
        await AlertService.handleIncomingEvent(event);
      } catch (err) {
        console.error('[AlertService] Error handling incoming event:', err);
      }
    });

    // Periodic SLA escalation checker every 60 seconds
    setInterval(async () => {
      try {
        await AlertService.evaluateAllSlaDeadlines();
      } catch (err) {
        console.error('[AlertService] Error in SLA escalation heartbeat:', err);
      }
    }, 60000);
  }

  /**
   * Handle incoming event: Auto-generate incident alert for HIGH or CRITICAL severity.
   */
  static async handleIncomingEvent(event: SentinelEvent): Promise<Alert | null> {
    const isCriticalOrHigh =
      event.severity === 'CRITICAL' ||
      event.severity === 'HIGH' ||
      event.eventType === 'PERSON_LEFT_BEHIND' ||
      event.eventType === 'ASSISTANCE_INDICATION';

    if (!isCriticalOrHigh) {
      return null;
    }

    const orgObjId = new mongoose.Types.ObjectId(event.organizationId);

    // Anti-flooding deduplication: check if active alert already exists for this room/event type
    const existingActiveAlert = await AlertModel.findOne({
      organizationId: orgObjId,
      facilityId: event.facilityId && mongoose.Types.ObjectId.isValid(event.facilityId)
        ? new mongoose.Types.ObjectId(event.facilityId)
        : undefined,
      roomId: event.roomId && mongoose.Types.ObjectId.isValid(event.roomId)
        ? new mongoose.Types.ObjectId(event.roomId)
        : undefined,
      title: event.title,
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingActiveAlert) {
      // Deduplicated; do not spam duplicate active incident
      return existingActiveAlert.toSafeAlert();
    }

    // Recommended actions mapping based on event type
    let recommendedAction = 'Inspect room telemetry and confirm spatial safety status.';
    if (event.eventType === 'PERSON_LEFT_BEHIND') {
      recommendedAction = 'IMMEDIATE ACTION: Dispatch on-site operator to unlock vehicle and confirm occupant safety.';
    } else if (event.eventType === 'HIGH_CO2') {
      recommendedAction = 'Check fresh air ERV dampers and reduce room occupant density.';
    } else if (event.eventType === 'ASSISTANCE_INDICATION') {
      recommendedAction = 'Dispatch on-duty clinical/security personnel to room coordinates immediately.';
    }

    return await this.createAlert(event.organizationId, {
      facilityId: event.facilityId,
      roomId: event.roomId,
      deviceId: event.deviceId,
      eventId: event.id,
      title: event.title,
      description: event.description || `Authoritative event triggered: ${event.eventType}`,
      severity: (event.severity as AlertSeverity) || 'HIGH',
      confidence: event.confidence ?? 95,
      sensorEvidence: event.inputSignals || {},
      recommendedAction,
    });
  }

  /**
   * Create an Alert record with calculated SLA deadline.
   */
  static async createAlert(
    organizationId: string,
    dto: CreateAlertDTO,
    creatorUserId?: string,
    creatorUserName?: string
  ): Promise<Alert> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const facilityObjId = new mongoose.Types.ObjectId(dto.facilityId);
    const roomObjId = dto.roomId && mongoose.Types.ObjectId.isValid(dto.roomId)
      ? new mongoose.Types.ObjectId(dto.roomId)
      : undefined;

    // Resolve facility & room names
    const facility = await FacilityModel.findById(facilityObjId);
    let roomName: string | undefined;
    if (roomObjId) {
      const room = await RoomModel.findById(roomObjId);
      if (room) {
        roomName = room.name;
        // Mark room with active alert
        await RoomModel.updateOne(
          { _id: roomObjId },
          {
            $set: {
              hasActiveAlert: true,
              activeAlertSeverity: dto.severity || 'WARNING',
            },
          }
        );
      }
    }

    const severity: AlertSeverity = dto.severity || 'WARNING';
    const slaMs = SLA_DEADLINES_MS[severity] || SLA_DEADLINES_MS.WARNING;
    const slaDeadline = new Date(Date.now() + slaMs);

    const doc = new AlertModel({
      organizationId: orgObjId,
      facilityId: facilityObjId,
      facilityName: facility?.name,
      roomId: roomObjId,
      roomName,
      deviceId: dto.deviceId,
      eventId: dto.eventId && mongoose.Types.ObjectId.isValid(dto.eventId)
        ? new mongoose.Types.ObjectId(dto.eventId)
        : undefined,
      title: dto.title.trim(),
      description: dto.description.trim(),
      severity,
      confidence: dto.confidence ?? 90,
      status: 'CREATED',
      assignedTo: dto.assignedTo && mongoose.Types.ObjectId.isValid(dto.assignedTo)
        ? new mongoose.Types.ObjectId(dto.assignedTo)
        : undefined,
      sensorEvidence: dto.sensorEvidence || {},
      recommendedAction: dto.recommendedAction,
      escalationLevel: 1,
      isEscalated: false,
      slaDeadline,
      history: [
        {
          action: 'CREATED',
          userId: creatorUserId || undefined,
          userName: creatorUserName || 'System Incident Engine',
          timestamp: new Date().toISOString(),
          note: `Incident registered with ${severity} severity (${Math.round(slaMs / 60000)}m SLA).`,
        },
      ],
    });

    await doc.save();
    const safeAlert = doc.toSafeAlert();

    // Broadcast across Alert bus and WebSocket stream
    alertBus.emit('alert:created', safeAlert);

    return safeAlert;
  }

  /**
   * List paginated alerts with multi-criteria filtering.
   */
  static async listAlerts(
    organizationId: string,
    filter: AlertFilterQuery = {}
  ): Promise<{
    alerts: Alert[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 50;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };

    if (filter.facilityId && mongoose.Types.ObjectId.isValid(filter.facilityId)) {
      query.facilityId = new mongoose.Types.ObjectId(filter.facilityId);
    }
    if (filter.roomId && mongoose.Types.ObjectId.isValid(filter.roomId)) {
      query.roomId = new mongoose.Types.ObjectId(filter.roomId);
    }
    if (filter.deviceId) {
      query.deviceId = filter.deviceId;
    }
    if (filter.severity) {
      query.severity = filter.severity;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.assignedTo && mongoose.Types.ObjectId.isValid(filter.assignedTo)) {
      query.assignedTo = new mongoose.Types.ObjectId(filter.assignedTo);
    }
    if (filter.isEscalated !== undefined) {
      query.isEscalated = filter.isEscalated;
    }

    if (filter.startTime || filter.endTime) {
      query.createdAt = {};
      if (filter.startTime) {
        (query.createdAt as Record<string, unknown>).$gte = new Date(filter.startTime);
      }
      if (filter.endTime) {
        (query.createdAt as Record<string, unknown>).$lte = new Date(filter.endTime);
      }
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const total = await AlertModel.countDocuments(query);
    const docs = await AlertModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'displayName email role');

    const alerts: Alert[] = docs.map((doc) => {
      const safe = doc.toSafeAlert();
      const populatedUser = doc.assignedTo as unknown as {
        _id: mongoose.Types.ObjectId;
        displayName?: string;
        email: string;
        role?: string;
      };
      if (populatedUser && populatedUser.email) {
        safe.assignedToUser = {
          id: populatedUser._id.toString(),
          fullName: populatedUser.displayName || populatedUser.email,
          email: populatedUser.email,
          role: populatedUser.role,
        };
      }
      return safe;
    });

    return {
      alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single alert by ID with populated assigned user.
   */
  static async getAlertById(organizationId: string, alertId: string): Promise<Alert | null> {
    if (!mongoose.Types.ObjectId.isValid(alertId)) return null;

    const doc = await AlertModel.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).populate('assignedTo', 'displayName email role');

    if (!doc) return null;

    const safe = doc.toSafeAlert();
    const populatedUser = doc.assignedTo as unknown as {
      _id: mongoose.Types.ObjectId;
      displayName?: string;
      email: string;
      role?: string;
    };
    if (populatedUser && populatedUser.email) {
      safe.assignedToUser = {
        id: populatedUser._id.toString(),
        fullName: populatedUser.displayName || populatedUser.email,
        email: populatedUser.email,
        role: populatedUser.role,
      };
    }
    return safe;
  }

  /**
   * Acknowledge an active alert.
   */
  static async acknowledgeAlert(
    organizationId: string,
    alertId: string,
    userId: string,
    note?: string
  ): Promise<Alert> {
    const doc = await AlertModel.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) {
      throw new Error('Alert not found');
    }

    const user = await UserModel.findById(userId);
    const userName = user ? user.displayName || user.email : 'Operator';

    doc.status = 'ACKNOWLEDGED';
    doc.acknowledgedAt = new Date();
    doc.history.push({
      action: 'ACKNOWLEDGED',
      userId,
      userName,
      timestamp: new Date().toISOString(),
      note: note || 'Alert acknowledged by operator.',
    });

    await doc.save();
    const safe = doc.toSafeAlert();
    alertBus.emit('alert:updated', safe);
    return safe;
  }

  /**
   * Assign alert to a responsible technician/operator.
   */
  static async assignAlert(
    organizationId: string,
    alertId: string,
    assignedToUserId: string,
    assignerUserId: string,
    note?: string
  ): Promise<Alert> {
    const doc = await AlertModel.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) {
      throw new Error('Alert not found');
    }

    const assignedUser = await UserModel.findById(assignedToUserId);
    if (!assignedUser) {
      throw new Error('Assigned user not found');
    }
    const assignerUser = await UserModel.findById(assignerUserId);
    const assignerName = assignerUser
      ? assignerUser.displayName || assignerUser.email
      : 'Operator';

    const assignedName = assignedUser.displayName || assignedUser.email;

    doc.assignedTo = new mongoose.Types.ObjectId(assignedToUserId);
    doc.status = 'ASSIGNED';
    doc.history.push({
      action: 'ASSIGNED',
      userId: assignerUserId,
      userName: assignerName,
      timestamp: new Date().toISOString(),
      note: note || `Assigned to ${assignedName} (${assignedUser.role || 'Member'}).`,
    });

    await doc.save();
    const safe = doc.toSafeAlert();
    safe.assignedToUser = {
      id: assignedUser._id.toString(),
      fullName: assignedName,
      email: assignedUser.email,
      role: assignedUser.role,
    };
    alertBus.emit('alert:updated', safe);
    return safe;
  }

  /**
   * Update alert lifecycle status (IN_PROGRESS, RESOLVED, DISMISSED).
   */
  static async updateStatus(
    organizationId: string,
    alertId: string,
    userId: string,
    dto: UpdateAlertStatusDTO
  ): Promise<Alert> {
    const doc = await AlertModel.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) {
      throw new Error('Alert not found');
    }

    const user = await UserModel.findById(userId);
    const userName = user
      ? user.displayName || user.email
      : 'Operator';

    doc.status = dto.status;
    if (dto.assignedTo && mongoose.Types.ObjectId.isValid(dto.assignedTo)) {
      doc.assignedTo = new mongoose.Types.ObjectId(dto.assignedTo);
    }

    if (dto.status === 'RESOLVED') {
      doc.resolvedAt = new Date();
      // If room has no other active alerts, clear room active alert state
      if (doc.roomId) {
        const otherActive = await AlertModel.countDocuments({
          roomId: doc.roomId,
          _id: { $ne: doc._id },
          status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
        });
        if (otherActive === 0) {
          await RoomModel.updateOne(
            { _id: doc.roomId },
            { $set: { hasActiveAlert: false, activeAlertSeverity: undefined } }
          );
        }
      }
    }

    doc.history.push({
      action: dto.status,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      note: dto.resolutionNotes || dto.note || `Status transitioned to ${dto.status}.`,
    });

    await doc.save();
    const safe = doc.toSafeAlert();

    if (dto.status === 'RESOLVED') {
      alertBus.emit('alert:resolved', safe);
    } else {
      alertBus.emit('alert:updated', safe);
    }

    return safe;
  }

  /**
   * Escalate alert tier due to SLA breach or manual escalation.
   */
  static async escalateAlert(
    organizationId: string,
    alertId: string,
    userId?: string,
    reason?: string
  ): Promise<Alert> {
    const doc = await AlertModel.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!doc) {
      throw new Error('Alert not found');
    }

    let userName = 'SLA Escalation Engine';
    if (userId) {
      const user = await UserModel.findById(userId);
      if (user) {
        userName = user.displayName || user.email;
      }
    }

    doc.escalationLevel = (doc.escalationLevel || 0) + 1;
    doc.isEscalated = true;

    doc.history.push({
      action: 'ESCALATED',
      userId: userId || undefined,
      userName,
      timestamp: new Date().toISOString(),
      note: reason || `Alert escalated to Tier ${doc.escalationLevel} due to SLA threshold breach.`,
    });

    await doc.save();
    const safe = doc.toSafeAlert();
    alertBus.emit('alert:escalated', safe);
    return safe;
  }

  /**
   * Evaluate all SLA deadlines across active alerts and escalate breached items.
   */
  static async evaluateAllSlaDeadlines(): Promise<number> {
    const now = new Date();
    const breachedAlerts = await AlertModel.find({
      status: { $in: ['CREATED', 'ACKNOWLEDGED'] },
      slaDeadline: { $lte: now },
      escalationLevel: { $lt: 3 }, // Cap at Tier 3
    });

    for (const alert of breachedAlerts) {
      await this.escalateAlert(
        alert.organizationId.toString(),
        alert._id.toString(),
        undefined,
        `Automated SLA breach: Unresolved after deadline ${alert.slaDeadline?.toLocaleTimeString()}`
      );
    }

    return breachedAlerts.length;
  }

  /**
   * Get aggregate alert statistics for an organization.
   */
  static async getAlertStats(organizationId: string): Promise<AlertStats> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const totalAlerts = await AlertModel.countDocuments({ organizationId: orgObjId });
    const activeAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const criticalAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      severity: 'CRITICAL',
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const highAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      severity: 'HIGH',
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const warningAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      severity: 'WARNING',
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const infoAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      severity: 'INFO',
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const acknowledgedAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      status: 'ACKNOWLEDGED',
    });
    const inProgressAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      status: 'IN_PROGRESS',
    });
    const resolvedAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      status: 'RESOLVED',
    });
    const escalatedAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      isEscalated: true,
      status: { $in: ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
    });
    const unassignedAlerts = await AlertModel.countDocuments({
      organizationId: orgObjId,
      assignedTo: { $exists: false },
      status: { $in: ['CREATED', 'ACKNOWLEDGED'] },
    });

    // Compute average resolution time from resolved alerts
    const resolvedDocs = await AlertModel.find({
      organizationId: orgObjId,
      status: 'RESOLVED',
      resolvedAt: { $exists: true },
    }).select('createdAt resolvedAt');

    let avgResolutionTimeMs = 0;
    if (resolvedDocs.length > 0) {
      const totalTime = resolvedDocs.reduce((acc, doc) => {
        if (doc.resolvedAt && doc.createdAt) {
          return acc + (doc.resolvedAt.getTime() - doc.createdAt.getTime());
        }
        return acc;
      }, 0);
      avgResolutionTimeMs = Math.round(totalTime / resolvedDocs.length);
    }

    return {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      highAlerts,
      warningAlerts,
      infoAlerts,
      acknowledgedAlerts,
      inProgressAlerts,
      resolvedAlerts,
      escalatedAlerts,
      unassignedAlerts,
      avgResolutionTimeMs,
    };
  }
}
