// ─────────────────────────────────────────────
// SENTINEL API — Production Database Index Management
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import {
  OrganizationModel,
  FacilityModel,
  FloorModel,
  RoomModel,
  DeviceModel,
  DeviceCredentialModel,
  SensorModel,
  TelemetryModel,
  EventModel,
  AutomationRuleModel,
  AutomationExecutionModel,
  AlertModel,
  UserModel,
  SecurityAuditLogModel,
  DeploymentModel,
  FirmwareBuildModel,
  HardwareTestSessionModel,
} from '../models/index.js';
import { ComplianceAuditLogModel } from '../models/ComplianceAuditLog.js';
import { ComplianceProfileModel } from '../models/ComplianceProfile.js';

export interface IndexSyncReport {
  collection: string;
  indexes: string[];
  status: 'SYNCHRONIZED' | 'ERROR';
  error?: string;
}

export class DatabaseIndexManager {
  private static readonly MANAGED_MODELS = [
    OrganizationModel,
    FacilityModel,
    FloorModel,
    RoomModel,
    DeviceModel,
    DeviceCredentialModel,
    SensorModel,
    TelemetryModel,
    EventModel,
    AutomationRuleModel,
    AutomationExecutionModel,
    AlertModel,
    UserModel,
    SecurityAuditLogModel,
    ComplianceAuditLogModel,
    ComplianceProfileModel,
    DeploymentModel,
    FirmwareBuildModel,
    HardwareTestSessionModel,
  ];

  /**
   * Synchronize and build all compound, unique, and TTL indexes across collections.
   */
  static async syncAllIndexes(): Promise<IndexSyncReport[]> {
    const reports: IndexSyncReport[] = [];

    for (const model of this.MANAGED_MODELS) {
      const collectionName = model.collection.name;
      try {
        await model.syncIndexes();
        const indexInfo = await model.collection.indexes();
        const indexNames = indexInfo.map((idx) => idx.name || JSON.stringify(idx.key));

        reports.push({
          collection: collectionName,
          indexes: indexNames,
          status: 'SYNCHRONIZED',
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        reports.push({
          collection: collectionName,
          indexes: [],
          status: 'ERROR',
          error: errorMsg,
        });
      }
    }

    return reports;
  }

  /**
   * Get index statistics across all managed collections.
   */
  static async getIndexStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    for (const model of this.MANAGED_MODELS) {
      try {
        const indexes = await model.collection.indexes();
        stats[model.collection.name] = indexes.length;
      } catch {
        stats[model.collection.name] = 0;
      }
    }

    return stats;
  }

  /**
   * Check whether all models have connected database handles.
   */
  static isReady(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

