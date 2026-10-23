// ─────────────────────────────────────────────
// SENTINEL API — Multi-Sensor Fusion Engine
// ─────────────────────────────────────────────

import { RoomModel, IRoomDocument } from '../models/index.js';
import type {
  ValidatedTelemetry,
  OccupancySnapshot,
  OccupancyState,
  TelemetrySensorData,
} from '@sentinel/types';

interface HistoricalPoint {
  timestamp: number;
  pir?: boolean;
  mmwavePresence?: boolean;
  mmwaveCount?: number;
  distance?: number;
  stationaryConfidence?: number;
  movementConfidence?: number;
  door?: 'open' | 'closed';
  soundLevel?: number;
  co2?: number;
  temperature?: number;
  pressure?: number;
}

interface RoomTemporalState {
  roomId: string;
  history: HistoricalPoint[];
  lastOccupancyState: OccupancyState;
  lastDoorState?: 'open' | 'closed';
  lastStateChangeAt: number;
  baselineSoundDb: number;
}

// In-memory sliding window cache per room (tracks recent sensory history)
const roomTemporalCache = new Map<string, RoomTemporalState>();

// Maximum historical points kept in sliding buffer (up to ~15 minutes at standard rate)
const MAX_HISTORY_POINTS = 60;

export class FusionService {
  /**
   * Fuse multi-sensor telemetry signals into a contextual spatial occupancy snapshot.
   */
  static async fuseTelemetry(
    roomId: string,
    telemetry: ValidatedTelemetry,
    roomDoc?: IRoomDocument | null
  ): Promise<OccupancySnapshot> {
    const now = Date.now();
    let state = roomTemporalCache.get(roomId);

    if (!state) {
      state = {
        roomId,
        history: [],
        lastOccupancyState: (roomDoc?.occupancyState as OccupancyState) || 'UNKNOWN',
        lastDoorState: roomDoc?.doorState,
        lastStateChangeAt: now,
        baselineSoundDb: 42.0,
      };
      roomTemporalCache.set(roomId, state);
    }

    const s = telemetry.sensors as TelemetrySensorData;

    // Append new sensory reading to rolling temporal window
    const point: HistoricalPoint = {
      timestamp: now,
      pir: s.pir,
      mmwavePresence: s.mmwave?.presence,
      mmwaveCount: s.mmwave?.count,
      distance: s.mmwave?.distance,
      stationaryConfidence: s.mmwave?.stationaryConfidence,
      movementConfidence: s.mmwave?.movementConfidence,
      door: s.door,
      soundLevel: s.soundLevel,
      co2: s.co2,
      temperature: s.temperature,
      pressure: s.pressure,
    };

    state.history.push(point);
    if (state.history.length > MAX_HISTORY_POINTS) {
      state.history.shift();
    }

    // ── 1. Calculate Environmental Trends (CO2) ──
    let co2Trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (state.history.length >= 3 && s.co2 !== undefined) {
      const co2Points = state.history.filter((p) => p.co2 !== undefined);
      if (co2Points.length >= 3 && co2Points[0]?.co2 !== undefined) {
        const earliest = co2Points[0].co2;
        const latest = s.co2;
        const delta = latest - earliest;
        if (delta > 80) co2Trend = 'rising';
        else if (delta < -80) co2Trend = 'falling';
      }
    }

    // ── 2. Multi-Sensor Occupancy State Determination ──
    let occupancyState: OccupancyState = 'UNKNOWN';
    let estimatedOccupancy = 0;
    let occupancyConfidence = 85;

    const hasRadarPresence = Boolean(s.mmwave?.presence);
    const hasPirMotion = Boolean(s.pir);
    const doorState = s.door || state.lastDoorState;

    if (hasRadarPresence) {
      // mmWave radar explicitly reports presence
      estimatedOccupancy = Math.max(1, s.mmwave?.count || 1);

      const stationaryConf = s.mmwave?.stationaryConfidence || 0;
      const movementConf = s.mmwave?.movementConfidence || 0;

      if (movementConf >= 35 || hasPirMotion) {
        // Active motion detected
        occupancyState = 'ACTIVE_OCCUPANCY';
        occupancyConfidence = Math.min(98, Math.max(80, movementConf));
      } else if (stationaryConf >= 70 && !hasPirMotion) {
        // Stationary target (sitting, sleeping, bedside)
        occupancyState = 'STATIONARY_OCCUPANCY';
        occupancyConfidence = Math.min(99, Math.max(85, stationaryConf));
      } else {
        occupancyState = 'OCCUPIED';
        occupancyConfidence = 88;
      }

      // Check for High Density
      if (estimatedOccupancy >= 4 || (co2Trend === 'rising' && estimatedOccupancy >= 2)) {
        occupancyState = 'HIGH_DENSITY';
        occupancyConfidence = 92;
      }
    } else {
      // mmWave radar reports NO presence
      if (hasPirMotion) {
        // Transient motion detected at boundary before radar lock
        occupancyState = 'ACTIVE_OCCUPANCY';
        estimatedOccupancy = 1;
        occupancyConfidence = 65; // Moderate confidence due to single PIR sensor
      } else {
        // Both mmWave and PIR report clear
        // Check if recent door opened and room drained
        occupancyState = 'EMPTY';
        estimatedOccupancy = 0;
        occupancyConfidence = 95;
      }
    }

    // Cap estimated occupancy to reasonable bounds
    if (roomDoc?.capacity && estimatedOccupancy > roomDoc.capacity * 2) {
      estimatedOccupancy = roomDoc.capacity * 2;
    }

    // Track state changes
    if (occupancyState !== state.lastOccupancyState) {
      state.lastOccupancyState = occupancyState;
      state.lastStateChangeAt = now;
    }
    if (s.door) {
      state.lastDoorState = s.door;
    }

    // ── 3. Update Room Model Digital Twin ──
    const roomUpdates: Record<string, unknown> = {
      occupancyState,
      estimatedOccupants: estimatedOccupancy,
      occupancyConfidence,
      doorState,
      lastTelemetryReceivedAt: new Date(),
    };

    if (s.temperature !== undefined) roomUpdates.currentTemperature = s.temperature;
    if (s.humidity !== undefined) roomUpdates.currentHumidity = s.humidity;
    if (s.co2 !== undefined) roomUpdates.currentCo2 = s.co2;
    if (s.soundLevel !== undefined) roomUpdates.currentSoundLevel = s.soundLevel;

    await RoomModel.updateOne({ _id: roomId }, { $set: roomUpdates });

    return {
      roomId,
      estimatedOccupancy,
      occupancyConfidence,
      occupancyState,
      timestamp: new Date().toISOString(),
      inputSignals: {
        pir: s.pir,
        mmwavePresence: s.mmwave?.presence,
        mmwaveCount: s.mmwave?.count,
        door: s.door,
        soundLevel: s.soundLevel,
        co2Trend,
        temperature: s.temperature,
      },
    };
  }

  /**
   * Retrieve cached temporal state for a room.
   */
  static getTemporalState(roomId: string): RoomTemporalState | undefined {
    return roomTemporalCache.get(roomId);
  }

  /**
   * Reset temporal cache (used in tests or manual reconfiguration).
   */
  static clearCache(): void {
    roomTemporalCache.clear();
  }
}
