// ─────────────────────────────────────────────
// @sentinel/types — Security & Zero-Trust Audit
// ─────────────────────────────────────────────

export type SecurityAction =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'AUTH_LOCKOUT'
  | 'TOKEN_ROTATED'
  | 'TOKEN_REVOKED'
  | 'TOKEN_REUSE_DETECTED'
  | 'ROGUE_DEVICE_BLOCKED'
  | 'DEVICE_CREDENTIAL_ROTATED'
  | 'CROSS_TENANT_ACCESS_DENIED'
  | 'UNAUTHORIZED_SUBSCRIBE_ATTEMPT'
  | 'UNAUTHORIZED_PUBLISH_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_PAYLOAD_BLOCKED'
  | 'SECURITY_SCAN_EXECUTED';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityActorType = 'USER' | 'DEVICE' | 'SYSTEM' | 'ANONYMOUS';

export type SecurityEventStatus = 'SUCCESS' | 'BLOCKED' | 'FLAGGED';

export interface SecurityAuditLog {
  id: string;
  organizationId?: string;
  action: SecurityAction;
  severity: SecuritySeverity;
  actorType: SecurityActorType;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  status: SecurityEventStatus;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface SecurityPostureBreakdown {
  zeroTrustMqtt: boolean;
  deviceSha256: boolean;
  rateLimiting: boolean;
  cspHeaders: boolean;
  tokenRotation: boolean;
  noSqlSanitization: boolean;
}

export interface SecurityOverviewMetrics {
  securityScore: number; // 0 - 100
  totalEvents24h: number;
  blockedThreats24h: number;
  highCriticalIncidents24h: number;
  activeDevicesAudited: number;
  rogueDevicesBlocked: number;
  postureBreakdown: SecurityPostureBreakdown;
}

export type SecurityCheckCategory = 'AUTH' | 'NETWORK' | 'TENANCY' | 'DEVICE' | 'ENCRYPTION';

export interface SecurityCheckItem {
  id: string;
  name: string;
  category: SecurityCheckCategory;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number;
  description: string;
  recommendation?: string;
}

export interface SecurityAuditScanResult {
  scannedAt: string;
  organizationId: string;
  overallScore: number;
  postureGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  checks: SecurityCheckItem[];
  passedCount: number;
  warnCount: number;
  failCount: number;
}

export interface SecurityAuditLogFilterDto {
  severity?: SecuritySeverity;
  action?: SecurityAction;
  actorType?: SecurityActorType;
  actorId?: string;
  status?: SecurityEventStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

