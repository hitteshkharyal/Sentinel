// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Team Assignment Tab
// Manage team member roles, permissions, and staff invites
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Deployment, DeploymentRole, DeploymentTeamMember } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface TeamTabProps {
  deployment: Deployment;
}

const ROLES: { value: DeploymentRole; label: string; desc: string }[] = [
  { value: 'SUPERVISOR', label: 'Supervisor', desc: 'Full authority over deployment, test sign-offs and rules' },
  { value: 'TECHNICIAN', label: 'Technician', desc: 'Hardware flashing, wiring verification, sensor calibration' },
  { value: 'OPERATOR', label: 'Operator', desc: 'Day-to-day zone monitoring and incident acknowledgment' },
  { value: 'SECURITY', label: 'Security', desc: 'Emergency event receipt, perimeter and access monitoring' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access to sensor telemetry and reports' },
  { value: 'INSTALLER', label: 'Installer', desc: 'Physical device mount, commissioning and pre-flight checks' },
];

export const DeploymentTeamTab: React.FC<TeamTabProps> = ({ deployment }) => {
  const { getDeploymentTeam, addTeamMember, updateTeamMemberRole, removeTeamMember } = useDeployment();
  const [team, setTeam] = useState<DeploymentTeamMember[]>(deployment.team || []);
  const [emailInput, setEmailInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<DeploymentRole>('TECHNICIAN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDeploymentTeam(deployment.id)
      .then((data) => {
        if (mounted) {
          setTeam(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [deployment.id, getDeploymentTeam]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await addTeamMember(deployment.id, {
        email: emailInput.trim(),
        role: selectedRole,
        displayName: displayNameInput.trim() || undefined,
      });
      setTeam(updated);
      setEmailInput('');
      setDisplayNameInput('');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: DeploymentRole) => {
    try {
      const updated = await updateTeamMemberRole(deployment.id, email, newRole);
      setTeam(updated);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update role');
    }
  };

  const handleRemove = async (email: string) => {
    if (!window.confirm(`Remove ${email} from this deployment?`)) return;
    try {
      const updated = await removeTeamMember(deployment.id, email);
      setTeam(updated);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#172033]">Site Team & Responsibility Assignment</h3>
        <p className="text-xs text-slate-500">
          Assign on-site technicians, supervisors, and operators to manage this deployment
        </p>
      </div>

      {/* Add Member Form */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl p-5 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Assign New Team Member
        </h4>
        <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">User Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@domain.com"
                className="w-full text-xs pl-9 pr-3 py-2 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Display Name (Optional)</label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Alex Tech"
              className="w-full text-xs px-3 py-2 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Role *</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as DeploymentRole)}
              className="w-full text-xs px-3 py-2 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="w-full text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Assigning...' : 'Assign Member'}
            </button>
          </div>
        </form>
      </div>

      {/* Team Roster Table */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#DCE3EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-[#172033]">Assigned Team ({team.length})</h4>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading team roster...</div>
        ) : team.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No team members assigned yet. Use the form above to add supervisors or technicians.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3EC] text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Assigned Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC]">
                {team.map((member) => (
                  <tr key={member.email} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#172033]">
                        {member.displayName || member.email}
                      </div>
                      <div className="text-[11px] text-slate-400">{member.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.email, e.target.value as DeploymentRole)}
                        className="text-xs px-2 py-1 border border-[#DCE3EC] rounded bg-white text-[#172033] font-medium"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          member.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {member.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {member.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemove(member.email)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
