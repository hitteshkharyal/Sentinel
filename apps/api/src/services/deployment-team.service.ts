// ─────────────────────────────────────────────
// SENTINEL API — Deployment Team Service
// Manages team member assignment, roles, and invitations
// ─────────────────────────────────────────────

import { DeploymentModel } from '../models/Deployment.js';
import { UserModel } from '../models/User.js';
import type { DeploymentRole, DeploymentTeamMember } from '@sentinel/types';

export class DeploymentTeamService {
  /**
   * Add or invite a team member to a deployment by email
   */
  public static async addMember(
    organizationId: string,
    deploymentId: string,
    email: string,
    role: DeploymentRole,
    assignedByUserId: string,
    displayName?: string
  ): Promise<DeploymentTeamMember[]> {
    const deployment = await DeploymentModel.findOne({
      _id: deploymentId,
      organizationId,
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in the system
    const existingUser = await UserModel.findOne({ email: cleanEmail });

    // Initialize team array if missing
    if (!deployment.team) {
      deployment.team = [];
    }
    const team = deployment.team;

    // Check if already in deployment
    const memberIndex = team.findIndex(
      (m) => m.email.toLowerCase() === cleanEmail
    );

    if (memberIndex >= 0) {
      // Update existing member
      const existingMember = team[memberIndex]!;
      existingMember.role = role;
      existingMember.status = 'ACTIVE';
      if (existingUser) {
        existingMember.userId = existingUser._id.toString();
        existingMember.displayName = existingUser.displayName;
      } else if (displayName) {
        existingMember.displayName = displayName;
      }
    } else {
      // Add new member
      team.push({
        userId: existingUser ? existingUser._id.toString() : undefined,
        email: cleanEmail,
        displayName: existingUser ? existingUser.displayName : (displayName || cleanEmail.split('@')[0]),
        role,
        assignedAt: new Date().toISOString(),
        assignedBy: assignedByUserId,
        status: existingUser ? 'ACTIVE' : 'INVITED',
      });
    }

    await deployment.save();
    return deployment.toSafeDeployment().team || [];
  }

  /**
   * Remove a member from the deployment
   */
  public static async removeMember(
    organizationId: string,
    deploymentId: string,
    emailOrUserId: string
  ): Promise<DeploymentTeamMember[]> {
    const deployment = await DeploymentModel.findOne({
      _id: deploymentId,
      organizationId,
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (!deployment.team) {
      return [];
    }

    const target = emailOrUserId.trim().toLowerCase();
    deployment.team = deployment.team.filter(
      (m) => m.email.toLowerCase() !== target && m.userId !== target
    );

    await deployment.save();
    return deployment.toSafeDeployment().team || [];
  }

  /**
   * Update a member's role
   */
  public static async updateMemberRole(
    organizationId: string,
    deploymentId: string,
    emailOrUserId: string,
    newRole: DeploymentRole
  ): Promise<DeploymentTeamMember[]> {
    const deployment = await DeploymentModel.findOne({
      _id: deploymentId,
      organizationId,
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    if (!deployment.team) {
      return [];
    }

    const target = emailOrUserId.trim().toLowerCase();
    const member = deployment.team.find(
      (m) => m.email.toLowerCase() === target || m.userId === target
    );

    if (!member) {
      throw new Error('Member not found in deployment');
    }

    member.role = newRole;
    await deployment.save();
    return deployment.toSafeDeployment().team || [];
  }

  /**
   * List all team members for a deployment
   */
  public static async getMembers(
    organizationId: string,
    deploymentId: string
  ): Promise<DeploymentTeamMember[]> {
    const deployment = await DeploymentModel.findOne({
      _id: deploymentId,
      organizationId,
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    return deployment.toSafeDeployment().team || [];
  }
}
