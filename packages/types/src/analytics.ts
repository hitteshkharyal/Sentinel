// ─────────────────────────────────────────────
// @sentinel/types — Analytics & ESG Digital Twin
// ─────────────────────────────────────────────

export type AnalyticsTimeframe = '1h' | '24h' | '7d' | '30d' | 'custom';

export type MetricProvenance = 'MEASURED' | 'ESTIMATED' | 'PREDICTED';

export type AggregationInterval = '15m' | '1h' | '1d';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  min?: number;
  max?: number;
  provenance: MetricProvenance;
}

export interface OccupancyAnalytics {
  provenance: MetricProvenance; // 'ESTIMATED' (derived from radar/PIR fusion)
  utilizationRate: number; // percentage (0 - 100%)
  peakOccupancyHour: string; // e.g. "14:00"
  peakOccupantCount: number;
  avgOccupants: number;
  totalOccupiedHours: number;
  occupancyDistribution: {
    EMPTY: number;
    OCCUPIED: number;
    STATIONARY_OCCUPANCY: number;
    ACTIVE_OCCUPANCY: number;
    HIGH_DENSITY: number;
  };
  hourlyTrend: {
    hour: string;
    avgOccupancy: number;
    peakOccupancy: number;
  }[];
}

export interface EnvironmentalAnalytics {
  provenance: MetricProvenance; // 'MEASURED' (direct NDIR & thermistor sensors)
  avgCo2: number;
  peakCo2: number;
  co2HazardHours: number; // hours co2 > 1400 ppm
  comfortComplianceRate: number; // % of time within 20-24°C and 30-60% RH
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  avgSoundLevel: number;
  peakSoundLevel: number;
  trends: {
    timestamp: string;
    co2: number;
    temperature: number;
    humidity: number;
    soundLevel?: number;
  }[];
}

export interface EsgEnergyAnalytics {
  provenance: MetricProvenance; // 'ESTIMATED' (calculated from autonomous HVAC setback delta)
  totalKwhSaved: number;
  estimatedCostSaved: number; // in USD
  carbonOffsetKg: number; // kg CO2 equivalent
  hvacHoursByState: {
    ECO: number;
    COMFORT: number;
    VENTILATION_BOOST: number;
    OFF: number;
  };
  setbackExecutionsCount: number;
  efficiencyRating: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface SlaIncidentAnalytics {
  provenance: MetricProvenance; // 'MEASURED' (from audit timestamps)
  totalIncidents: number;
  avgMttaMinutes: number; // Mean Time to Acknowledge
  avgMttrMinutes: number; // Mean Time to Resolve
  slaComplianceRate: number; // % acknowledged within deadline
  breachedCount: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    WARNING: number;
    INFO: number;
  };
  byEscalationTier: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

export interface AutomationPerformanceAnalytics {
  provenance: MetricProvenance; // 'MEASURED' (from policy engine logs)
  totalExecutions: number;
  successRate: number; // 0 - 100%
  byActionType: Record<string, number>;
  byRuleName: {
    ruleId: string;
    ruleName: string;
    executionCount: number;
  }[];
}

export interface DeviceFleetAnalytics {
  provenance: MetricProvenance; // 'MEASURED'
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  fleetUptimePercent: number;
  avgSignalRssi: number;
  activeSensorsCount: number;
  sensorHealthRates: {
    operational: number;
    degraded: number;
    error: number;
  };
}

export interface AnalyticsOverview {
  organizationId: string;
  facilityId?: string;
  timeframe: AnalyticsTimeframe;
  startTime: string;
  endTime: string;
  generatedAt: string;
  occupancy: OccupancyAnalytics;
  environment: EnvironmentalAnalytics;
  esg: EsgEnergyAnalytics;
  sla: SlaIncidentAnalytics;
  automation: AutomationPerformanceAnalytics;
  devices: DeviceFleetAnalytics;
}

export interface AnalyticsFilterQuery {
  facilityId?: string;
  roomId?: string;
  timeframe?: AnalyticsTimeframe;
  startTime?: string;
  endTime?: string;
  interval?: AggregationInterval;
}
