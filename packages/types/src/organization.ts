// ─────────────────────────────────────────────
// @sentinel/types — Organization & RBAC
// ─────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: IndustryType;
  description?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export type IndustryType =
  | 'hotel'
  | 'hospital'
  | 'school'
  | 'transport'
  | 'office'
  | 'mall'
  | 'factory'
  | 'warehouse'
  | 'parking'
  | 'public_facility'
  | 'general';

export type Role =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'FACILITY_ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'SECURITY'
  | 'TECHNICIAN'
  | 'VIEWER';

export type Permission =
  | 'organization.create'
  | 'organization.read'
  | 'organization.update'
  | 'organization.delete'
  | 'member.create'
  | 'member.read'
  | 'member.update'
  | 'member.delete'
  | 'facility.create'
  | 'facility.read'
  | 'facility.update'
  | 'facility.delete'
  | 'room.create'
  | 'room.read'
  | 'room.update'
  | 'room.delete'
  | 'device.register'
  | 'device.read'
  | 'device.update'
  | 'device.delete'
  | 'sensor.configure'
  | 'sensor.read'
  | 'telemetry.read'
  | 'alert.read'
  | 'alert.acknowledge'
  | 'alert.resolve'
  | 'automation.create'
  | 'automation.read'
  | 'automation.update'
  | 'automation.delete'
  | 'analytics.read'
  | 'firmware.manage'
  | 'audit.read';

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  facilityIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  facilityIds?: string[];
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    status: string;
  };
  createdAt: string;
  invitedBy?: string;
}

export interface OrganizationWithRole extends Organization {
  userRole: Role;
  facilityCount?: number;
  deviceCount?: number;
  memberCount?: number;
}

export interface CreateOrganizationDTO {
  name: string;
  industry: IndustryType;
  description?: string;
  contactEmail?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  industry?: IndustryType;
  description?: string;
  contactEmail?: string;
}

export interface InviteMemberDTO {
  email: string;
  role: Role;
  facilityIds?: string[];
}

