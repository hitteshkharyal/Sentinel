// ─────────────────────────────────────────────
// SENTINEL API — Organization & RBAC Service
// ─────────────────────────────────────────────

import mongoose from 'mongoose';
import {
  OrganizationModel,
  MembershipModel,
  UserModel,
  AllowedEmailModel,
} from '../models/index.js';
import { FacilityService } from './facility.service.js';
import { canManageRole } from '@sentinel/shared';
import { AppError } from '../middleware/error-handler.js';
import type {
  Organization as OrgType,
  OrganizationWithRole,
  OrganizationMember,
  Role,
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
} from '@sentinel/types';

export class OrganizationService {
  /**
   * Helper to generate a URL-friendly slug
   */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Create a new organization and make creator ORGANIZATION_ADMIN
   */
  static async createOrganization(
    userId: string,
    data: CreateOrganizationDTO
  ): Promise<OrgType> {
    const baseSlug = this.slugify(data.name) || 'organization';
    let slug = baseSlug;
    let counter = 1;

    while (await OrganizationModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const org = await OrganizationModel.create({
      name: data.name.trim(),
      slug,
      industry: data.industry,
      description: data.description?.trim(),
      contactEmail: data.contactEmail?.toLowerCase().trim(),
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    // Creator automatically becomes ORGANIZATION_ADMIN
    await MembershipModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: org._id,
      role: 'ORGANIZATION_ADMIN',
      status: 'ACTIVE',
    });

    return org.toSafeOrg();
  }

  /**
   * Get all organizations accessible by a user
   */
  static async getOrganizationsForUser(
    userId: string,
    isSuperAdmin = false
  ): Promise<OrganizationWithRole[]> {
    if (isSuperAdmin) {
      // Super Admin sees all organizations with SUPER_ADMIN privileges
      const allOrgs = await OrganizationModel.find().sort({ name: 1 });
      const memberships = await MembershipModel.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
      const membershipMap = new Map(
        memberships.map((m) => [m.organizationId.toString(), m.role])
      );

      return allOrgs.map((org) => {
        const safe = org.toSafeOrg();
        return {
          ...safe,
          userRole: membershipMap.get(org._id.toString()) || 'SUPER_ADMIN',
        };
      });
    }

    // Normal user: find all active memberships
    const memberships = await MembershipModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
    });

    if (memberships.length === 0) {
      return [];
    }

    const orgIds = memberships.map((m) => m.organizationId);
    const orgs = await OrganizationModel.find({ _id: { $in: orgIds } });
    const orgMap = new Map(orgs.map((o) => [o._id.toString(), o]));

    return memberships
      .map((m) => {
        const org = orgMap.get(m.organizationId.toString());
        if (!org) return null;
        return {
          ...org.toSafeOrg(),
          userRole: m.role,
        };
      })
      .filter((o): o is OrganizationWithRole => o !== null);
  }

  /**
   * Get organization by ID with user role verification
   */
  static async getOrganizationById(
    orgId: string,
    userId: string,
    isSuperAdmin = false
  ): Promise<{ organization: OrgType; role: Role }> {
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw new AppError(404, 'Organization not found.');
    }

    if (isSuperAdmin) {
      return { organization: org.toSafeOrg(), role: 'SUPER_ADMIN' };
    }

    const membership = await MembershipModel.findOne({
      organizationId: org._id,
      userId: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
    });

    if (!membership) {
      throw new AppError(403, 'Access denied: You are not a member of this organization.');
    }

    return {
      organization: org.toSafeOrg(),
      role: membership.role,
    };
  }

  /**
   * Update organization details
   */
  static async updateOrganization(
    orgId: string,
    data: UpdateOrganizationDTO
  ): Promise<OrgType> {
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw new AppError(404, 'Organization not found.');
    }

    if (data.name) org.name = data.name.trim();
    if (data.industry) org.industry = data.industry;
    if (data.description !== undefined) org.description = data.description.trim();
    if (data.contactEmail !== undefined)
      org.contactEmail = data.contactEmail?.toLowerCase().trim();

    await org.save();
    return org.toSafeOrg();
  }

  /**
   * Delete organization and cascade delete memberships
   */
  static async deleteOrganization(orgId: string): Promise<void> {
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw new AppError(404, 'Organization not found.');
    }

    await OrganizationModel.findByIdAndDelete(orgId);
    await MembershipModel.deleteMany({ organizationId: orgId });
  }

  /**
   * Get all members of an organization with user profile details
   */
  static async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const memberships = await MembershipModel.find({
      organizationId: new mongoose.Types.ObjectId(orgId),
    }).sort({ createdAt: 1 });

    const userIds = memberships.map((m) => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const members: OrganizationMember[] = [];
    for (const m of memberships) {
      const u = userMap.get(m.userId.toString());
      if (u) {
        members.push({
          id: m._id.toString(),
          userId: m.userId.toString(),
          organizationId: m.organizationId.toString(),
          role: m.role,
          facilityIds: m.facilityIds?.map((id) => id.toString()),
          user: {
            id: u._id.toString(),
            email: u.email,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            status: u.status || 'ACTIVE',
          },
          createdAt: m.createdAt.toISOString(),
          invitedBy: m.invitedBy?.toString(),
        });
      }
    }

    return members;
  }


  /**
   * Add or invite a member to the organization
   */
  static async addMember(
    orgId: string,
    email: string,
    role: Role,
    actorUserId: string,
    actorRole: Role,
    facilityIds?: string[]
  ): Promise<OrganizationMember> {
    const normalizedEmail = email.toLowerCase().trim();

    // Enforce role hierarchy: cannot grant role higher than or equal to own role (unless SUPER_ADMIN)
    if (actorRole !== 'SUPER_ADMIN' && !canManageRole(actorRole, role)) {
      throw new AppError(
        403,
        `Forbidden: As ${actorRole}, you cannot assign the role ${role}.`
      );
    }

    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      throw new AppError(404, 'Organization not found.');
    }

    // Find or provision user
    let user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      // Pre-create user account and allowlist
      user = await UserModel.create({
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        status: 'ACTIVE',
        role,
        emailVerified: false,
      });

      await AllowedEmailModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            role,
            status: 'APPROVED',
            notes: `Invited to ${org.name}`,
            addedBy: new mongoose.Types.ObjectId(actorUserId),
            approvedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // Check if membership already exists
    const existingMembership = await MembershipModel.findOne({
      organizationId: org._id,
      userId: user._id,
    });

    if (existingMembership) {
      throw new AppError(409, 'This user is already a member of this organization.');
    }

    const membership = await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role,
      facilityIds: facilityIds?.map((id) => new mongoose.Types.ObjectId(id)),
      invitedBy: new mongoose.Types.ObjectId(actorUserId),
      status: 'ACTIVE',
    });

    return {
      id: membership._id.toString(),
      userId: user._id.toString(),
      organizationId: org._id.toString(),
      role: membership.role,
      facilityIds: membership.facilityIds?.map((id) => id.toString()),
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status || 'ACTIVE',
      },
      createdAt: membership.createdAt.toISOString(),
      invitedBy: actorUserId,
    };
  }

  /**
   * Update member role in organization
   */
  static async updateMemberRole(
    orgId: string,
    memberId: string,
    newRole: Role,
    actorRole: Role
  ): Promise<OrganizationMember> {
    const membership = await MembershipModel.findOne({
      _id: memberId,
      organizationId: orgId,
    });

    if (!membership) {
      throw new AppError(404, 'Organization member not found.');
    }

    if (actorRole !== 'SUPER_ADMIN') {
      if (!canManageRole(actorRole, membership.role)) {
        throw new AppError(
          403,
          `Forbidden: You cannot modify a member with equal or higher role (${membership.role}).`
        );
      }
      if (!canManageRole(actorRole, newRole)) {
        throw new AppError(
          403,
          `Forbidden: You cannot elevate a member to ${newRole}.`
        );
      }
    }

    membership.role = newRole;
    await membership.save();

    const user = await UserModel.findById(membership.userId);
    if (!user) {
      throw new AppError(404, 'Associated user profile not found.');
    }

    return {
      id: membership._id.toString(),
      userId: user._id.toString(),
      organizationId: orgId,
      role: membership.role,
      facilityIds: membership.facilityIds?.map((id) => id.toString()),
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status || 'ACTIVE',
      },
      createdAt: membership.createdAt.toISOString(),
      invitedBy: membership.invitedBy?.toString(),
    };
  }

  /**
   * Remove member from organization
   */
  static async removeMember(
    orgId: string,
    memberId: string,
    actorRole: Role
  ): Promise<void> {
    const membership = await MembershipModel.findOne({
      _id: memberId,
      organizationId: orgId,
    });

    if (!membership) {
      throw new AppError(404, 'Member not found.');
    }

    if (actorRole !== 'SUPER_ADMIN' && !canManageRole(actorRole, membership.role)) {
      throw new AppError(
        403,
        `Forbidden: You cannot remove a member with equal or higher role (${membership.role}).`
      );
    }

    // Ensure we do not remove the sole ORGANIZATION_ADMIN
    if (membership.role === 'ORGANIZATION_ADMIN') {
      const adminCount = await MembershipModel.countDocuments({
        organizationId: orgId,
        role: 'ORGANIZATION_ADMIN',
      });
      if (adminCount <= 1) {
        throw new AppError(
          400,
          'Cannot remove the only Organization Administrator. Assign another admin first.'
        );
      }
    }

    await MembershipModel.findByIdAndDelete(memberId);
  }

  /**
   * Seed default multi-tenant organizations for the 8 platform sectors
   */
  static async seedDefaultOrganizations(adminUserId?: string): Promise<void> {
    const SEED_ORGS: Array<{ name: string; slug: string; industry: OrgType['industry']; description: string }> = [
      {
        name: "St. Jude Children's Medical Center",
        slug: 'st-jude-hospital',
        industry: 'hospital',
        description: 'Multi-wing acute care hospital with pediatric wards, ICU, and surgical recovery suites.',
      },
      {
        name: 'Grand Horizon Luxury Resort & Suites',
        slug: 'grand-horizon-hotel',
        industry: 'hotel',
        description: '5-star 320-key hotel with guest suites, presidential wing, executive lounges, and spa.',
      },
      {
        name: 'Oakridge Academy High School',
        slug: 'oakridge-academy',
        industry: 'school',
        description: 'Secondary educational campus with STEM science laboratories, smart classrooms, and transit bus fleet.',
      },
      {
        name: 'Metro Regional Transit Authority',
        slug: 'metro-transit',
        industry: 'transport',
        description: 'Municipal bus fleet with active mmWave child-left-behind detection across all 48 route buses.',
      },
      {
        name: 'Apex Global Headquarters',
        slug: 'apex-headquarters',
        industry: 'office',
        description: 'Corporate commercial tower with flexible hot-desking floors, executive conference rooms, and ESG optimization.',
      },
      {
        name: 'Titan Heavy Manufacturing Complex',
        slug: 'titan-manufacturing',
        industry: 'factory',
        description: 'Heavy assembly factory floor with hazardous robotic workcell perimeters and safety laser tripwires.',
      },
      {
        name: 'Pinnacle Logistics Cold Storage',
        slug: 'pinnacle-warehouse',
        industry: 'warehouse',
        description: 'Automated high-bay fulfillment center with cold chain zones and hazardous materials bays.',
      },
      {
        name: 'Westfield Galleria Mall & Lifestyle Center',
        slug: 'westfield-galleria',
        industry: 'mall',
        description: 'Retail shopping complex with food courts, anchor retail stores, and 3-level underground parking.',
      },
    ];

    let targetAdminId: mongoose.Types.ObjectId;
    if (adminUserId) {
      targetAdminId = new mongoose.Types.ObjectId(adminUserId);
    } else {
      const admin = await UserModel.findOne({ role: 'SUPER_ADMIN' });
      if (!admin) return;
      targetAdminId = admin._id as mongoose.Types.ObjectId;
    }

    for (const orgData of SEED_ORGS) {
      const org = await OrganizationModel.findOneAndUpdate(
        { slug: orgData.slug },
        {
          $set: {
            name: orgData.name,
            industry: orgData.industry,
            description: orgData.description,
            status: 'ACTIVE',
            createdBy: targetAdminId,
          },
        },
        { upsert: true, new: true }
      );

      // Ensure admin has ORGANIZATION_ADMIN membership
      await MembershipModel.findOneAndUpdate(
        { userId: targetAdminId, organizationId: org._id },
        {
          $set: {
            role: 'ORGANIZATION_ADMIN',
            status: 'ACTIVE',
          },
        },
        { upsert: true }
      );

      // Seed default representative facilities and rooms for this sector
      await FacilityService.seedDefaultFacilities(org._id.toString(), orgData.industry);
    }
  }
}
