// ─────────────────────────────────────────────
// @sentinel/types — Compliance & Industry Policies (Day 15)
// ─────────────────────────────────────────────

import type { IndustryType } from './organization.js';
import type { EventType } from './event.js';
import type { AutomationCondition, AutomationAction } from './automation.js';

export type ComplianceFramework =
  | 'ASHRAE_55'
  | 'ASHRAE_62_1'
  | 'HIPAA'
  | 'FERPA_COPPA'
  | 'GDPR_ART9'
  | 'OSHA_1910'
  | 'HACCP_FSMA'
  | 'WELL_LEED';

export type FrameworkCategory =
  | 'ENVIRONMENTAL'
  | 'PRIVACY'
  | 'LIFE_SAFETY'
  | 'OCCUPATIONAL'
  | 'LOGISTICS';

export type ComplianceStrictness = 'STRICT' | 'BALANCED' | 'PERMISSIVE';

export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ComplianceViolation {
  id: string;
  framework: ComplianceFramework;
  severity: ViolationSeverity;
  title: string;
  description: string;
  facilityId?: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  detectedValue?: string | number;
  requiredValue?: string | number;
  detectedAt: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  remediationAction?: string;
  suggestedRuleTemplateId?: string;
}

export interface FrameworkScore {
  framework: ComplianceFramework;
  name: string;
  regulatoryBody: string;
  category: FrameworkCategory;
  score: number; // 0 - 100
  status: ComplianceStatus;
  activeViolations: number;
  totalRulesChecked: number;
  passingRules: number;
  description: string;
  referenceUrl?: string;
}

export interface ComplianceProfile {
  id: string;
  organizationId: string;
  enabledFrameworks: ComplianceFramework[];
  strictness: ComplianceStrictness;
  autoRemediationEnabled: boolean;
  auditFrequencyHours: number;
  privacyLevel: 'ZERO_VIDEO' | 'AGGREGATED_ONLY' | 'ANONYMIZED';
  lastAuditedAt?: string;
  overallScore: number;
  overallStatus: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAuditResult {
  organizationId: string;
  auditedAt: string;
  overallScore: number;
  overallStatus: ComplianceStatus;
  frameworkScores: FrameworkScore[];
  violations: ComplianceViolation[];
  recommendations: string[];
  stats: {
    evaluatedRooms: number;
    activeRules: number;
    activeDevices: number;
    openViolations: number;
  };
}

export interface IndustryPolicyTemplate {
  id: string;
  industry: IndustryType;
  code: string;
  name: string;
  description: string;
  category: 'SAFETY' | 'COMFORT' | 'ENERGY' | 'SECURITY' | 'COMPLIANCE';
  frameworks: ComplianceFramework[];
  triggerEventType: EventType;
  defaultConditions: AutomationCondition[];
  defaultActions: AutomationAction[];
  cooldownMs: number;
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD';
  privacyPreservingNote: string;
}

export interface PolicyPack {
  industry: IndustryType;
  industryName: string;
  tagline: string;
  code: string;
  description: string;
  primaryFrameworks: ComplianceFramework[];
  templates: IndustryPolicyTemplate[];
  stat: string;
  statLabel: string;
}

export interface ApplyPolicyPackDTO {
  industry: IndustryType;
  overwriteExisting?: boolean;
  enableRulesImmediately?: boolean;
}

export interface PolicyPackApplicationResult {
  organizationId: string;
  industry: IndustryType;
  appliedRules: Array<{ id: string; name: string; enabled: boolean }>;
  skippedRulesCount: number;
  status: 'APPLIED' | 'PARTIAL';
  message: string;
}

export interface UpdateComplianceProfileDTO {
  enabledFrameworks?: ComplianceFramework[];
  strictness?: ComplianceStrictness;
  autoRemediationEnabled?: boolean;
  auditFrequencyHours?: number;
  privacyLevel?: 'ZERO_VIDEO' | 'AGGREGATED_ONLY' | 'ANONYMIZED';
}

export interface RemediateViolationDTO {
  violationId: string;
  action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS';
  notes?: string;
}

