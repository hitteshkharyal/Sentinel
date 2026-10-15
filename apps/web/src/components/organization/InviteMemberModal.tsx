// ─────────────────────────────────────────────
// SENTINEL Web — Invite / Add Team Member Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { UserPlus, Shield, Info } from 'lucide-react';
import type { Role } from '@sentinel/types';
import { useOrganization } from '../../context/OrganizationContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ROLE_DETAILS: { role: Role; label: string; desc: string; badgeColor: string }[] = [
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

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { inviteMember, canManageRole, currentOrganization } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('OPERATOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter roles based on whether the current actor's hierarchy allows granting this role
  const allowedRoles = ROLE_DETAILS.filter((r) => canManageRole(r.role));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteMember({
        email: email.trim().toLowerCase(),
        role,
      });

      setEmail('');
      setRole('OPERATOR');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoleMeta = ROLE_DETAILS.find((r) => r.role === role) || ROLE_DETAILS[4];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
          <span>Add Team Member</span>
        </div>
      }
      description={`Grant role-based operational permissions for ${currentOrganization?.name || 'this organization'}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Unable to add member">
            {error}
          </Alert>
        )}

        <Input
          label="User Email Address"
          type="email"
          placeholder="colleague@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Platform Role Assignment
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {allowedRoles.map((item) => (
              <label
                key={item.role}
                onClick={() => setRole(item.role)}
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  role === item.role
                    ? 'border-sentinel-500 bg-sentinel-50/60 ring-1 ring-sentinel-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={item.role}
                  checked={role === item.role}
                  onChange={() => setRole(item.role)}
                  className="mt-0.5 text-sentinel-600 focus:ring-sentinel-500"
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

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
          <Info className="w-4 h-4 text-sentinel-600 shrink-0 mt-0.5" />
          <p>
            Role permissions are cryptographically verified server-side on every REST route and
            MQTT telemetry command. <strong>{selectedRoleMeta?.label || role}</strong> permissions will take
            effect immediately upon addition.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Shield className="w-4 h-4" />}
          >
            Confirm & Assign Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};
