// ─────────────────────────────────────────────
// SENTINEL Web — Change Member Role Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Role, OrganizationMember } from '@sentinel/types';
import { useOrganization } from '../../context/OrganizationContext';

interface ChangeMemberRoleModalProps {
  member: OrganizationMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ROLES: { role: Role; label: string; desc: string; badgeColor: string }[] = [
  {
    role: 'ORGANIZATION_ADMIN',
    label: 'Organization Admin',
    desc: 'Full control over facilities, members, automations, and settings.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    role: 'FACILITY_ADMIN',
    label: 'Facility Admin',
    desc: 'Manages all rooms, devices, sensors, and automations within facilities.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'MANAGER',
    label: 'Operations Manager',
    desc: 'Supervises occupancy, acknowledges alerts, and oversees daily operations.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    role: 'SECURITY',
    label: 'Security Officer',
    desc: 'Triage emergency intrusion events, door states, and rapid alerts.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    role: 'OPERATOR',
    label: 'Field Operator',
    desc: 'Real-time room monitoring, sensor telemetry views, and operational triage.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    role: 'TECHNICIAN',
    label: 'Hardware Technician',
    desc: 'Sensor calibration, device deployment, and firmware management.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    role: 'VIEWER',
    label: 'Auditor / Viewer',
    desc: 'Read-only access to sensor values, dashboards, and ESG compliance reports.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
];

export const ChangeMemberRoleModal: React.FC<ChangeMemberRoleModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateMemberRole, canManageRole } = useOrganization();
  const [selectedRole, setSelectedRole] = useState<Role>(member?.role || 'OPERATOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selectedRole if member changes
  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  if (!member) return null;

  // Check if actor has authority to manage this member's current role
  const canManageCurrent = canManageRole(member.role);

  // Filter list of selectable roles to only those strictly below the actor
  const availableRoles = ROLES.filter((r) => canManageRole(r.role));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRole === member.role) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMemberRole(member.id, selectedRole);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Modify Member Role</span>
        </div>
      }
      description={`Update role permissions for ${member.user.displayName || member.user.email}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Role update failed">
            {error}
          </Alert>
        )}

        {!canManageCurrent && (
          <Alert variant="warning" title="Hierarchy Restriction">
            You cannot modify this member&apos;s role because their current authorization tier is equal
            to or higher than yours.
          </Alert>
        )}

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">{member.user.displayName}</p>
            <p className="text-[11px] text-slate-500">{member.user.email}</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
            Current: {member.role}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select New Platform Role
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {availableRoles.map((item) => (
              <label
                key={item.role}
                onClick={() => setSelectedRole(item.role)}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedRole === item.role
                    ? 'border-sentinel-500 bg-sentinel-50/60 ring-1 ring-sentinel-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="change-role"
                  value={item.role}
                  checked={selectedRole === item.role}
                  onChange={() => setSelectedRole(item.role)}
                  className="mt-0.5 text-sentinel-600 focus:ring-sentinel-500"
                  disabled={!canManageCurrent}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.label}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canManageCurrent || selectedRole === member.role}
            isLoading={isSubmitting}
            leftIcon={<ShieldAlert className="w-4 h-4" />}
          >
            Apply Role Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
