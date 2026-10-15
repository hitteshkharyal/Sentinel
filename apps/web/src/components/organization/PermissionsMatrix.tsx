// ─────────────────────────────────────────────
// SENTINEL Web — Interactive RBAC Permissions Matrix
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Check, Minus, Search, ShieldCheck } from 'lucide-react';
import type { Role, Permission } from '@sentinel/types';
import { ROLE_PERMISSIONS } from '@sentinel/shared';
import { useOrganization } from '../../context/OrganizationContext';

interface PermissionGroup {
  domain: string;
  permissions: {
    key: Permission;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    domain: 'Organization',
    permissions: [
      { key: 'organization.create', label: 'Create Organization', description: 'Create new organization workspaces' },
      { key: 'organization.read', label: 'View Organization', description: 'View organization details & metadata' },
      { key: 'organization.update', label: 'Update Organization', description: 'Modify name, sector, contact settings' },
      { key: 'organization.delete', label: 'Delete Organization', description: 'Tear down organization and all resources' },
    ],
  },
  {
    domain: 'Team & RBAC',
    permissions: [
      { key: 'member.create', label: 'Invite Members', description: 'Add members and assign initial roles' },
      { key: 'member.read', label: 'View Team Members', description: 'View roster and assigned roles' },
      { key: 'member.update', label: 'Change Member Roles', description: 'Elevate or demote subordinate member roles' },
      { key: 'member.delete', label: 'Remove Members', description: 'Revoke access and remove from organization' },
    ],
  },
  {
    domain: 'Facilities & Buildings',
    permissions: [
      { key: 'facility.create', label: 'Add Facility', description: 'Deploy new buildings and campus structures' },
      { key: 'facility.read', label: 'View Facilities', description: 'Inspect floor plans and facility digital twins' },
      { key: 'facility.update', label: 'Edit Facility', description: 'Modify facility coordinates, metadata and hours' },
      { key: 'facility.delete', label: 'Delete Facility', description: 'Decommission facility and associated floors' },
    ],
  },
  {
    domain: 'Floors & Rooms',
    permissions: [
      { key: 'room.create', label: 'Create Rooms', description: 'Configure room types, bounds, and privacy zones' },
      { key: 'room.read', label: 'View Rooms', description: 'Real-time room occupancy and environment stats' },
      { key: 'room.update', label: 'Edit Rooms', description: 'Update room occupancy limits & privacy policies' },
      { key: 'room.delete', label: 'Delete Rooms', description: 'Remove rooms from digital twin' },
    ],
  },
  {
    domain: 'Devices & Gateways',
    permissions: [
      { key: 'device.register', label: 'Register Device', description: 'Provision IoT gateways, radar & acoustic nodes' },
      { key: 'device.read', label: 'View Devices', description: 'Monitor heartbeat, battery, signal health' },
      { key: 'device.update', label: 'Update Device', description: 'Assign devices to rooms and configure networks' },
      { key: 'device.delete', label: 'Decommission Device', description: 'Remove hardware from fleet registry' },
    ],
  },
  {
    domain: 'Sensors & Telemetry',
    permissions: [
      { key: 'sensor.configure', label: 'Configure Sensor', description: 'Calibrate mmWave radar, CO2/PIR thresholds' },
      { key: 'sensor.read', label: 'View Sensors', description: 'Inspect active sensor telemetry parameters' },
      { key: 'telemetry.read', label: 'Stream Telemetry', description: 'Real-time MQTT telemetry feed stream access' },
    ],
  },
  {
    domain: 'Alerts & Escalation',
    permissions: [
      { key: 'alert.read', label: 'View Alerts', description: 'Monitor live alarms and escalation queues' },
      { key: 'alert.acknowledge', label: 'Acknowledge Alert', description: 'Mark alert acknowledged and halt SLA timer' },
      { key: 'alert.resolve', label: 'Resolve Alert', description: 'Mark alert cleared with root cause log' },
    ],
  },
  {
    domain: 'Automations & Rules',
    permissions: [
      { key: 'automation.create', label: 'Create Rules', description: 'Build autonomous Sense-Understand-Act rules' },
      { key: 'automation.read', label: 'View Automations', description: 'Inspect active automation trigger profiles' },
      { key: 'automation.update', label: 'Edit Automations', description: 'Modify rule conditions and BACnet/MQTT actions' },
      { key: 'automation.delete', label: 'Delete Rules', description: 'Remove automated rules' },
    ],
  },
  {
    domain: 'Governance & Security',
    permissions: [
      { key: 'analytics.read', label: 'ESG & Analytics', description: 'Access occupancy distribution & energy audits' },
      { key: 'firmware.manage', label: 'OTA Firmware', description: 'Trigger over-the-air firmware upgrades' },
      { key: 'audit.read', label: 'Security Audit Log', description: 'Read immutable tamper-proof security audit log' },
    ],
  },
];

const ALL_ROLES: { role: Role; short: string; label: string }[] = [
  { role: 'SUPER_ADMIN', short: 'SUPER', label: 'Super Admin' },
  { role: 'ORGANIZATION_ADMIN', short: 'ORG_ADMIN', label: 'Org Admin' },
  { role: 'FACILITY_ADMIN', short: 'FAC_ADMIN', label: 'Facility Admin' },
  { role: 'MANAGER', short: 'MGR', label: 'Manager' },
  { role: 'OPERATOR', short: 'OPR', label: 'Operator' },
  { role: 'SECURITY', short: 'SEC', label: 'Security' },
  { role: 'TECHNICIAN', short: 'TECH', label: 'Technician' },
  { role: 'VIEWER', short: 'VIEW', label: 'Viewer' },
];

export const PermissionsMatrix: React.FC = () => {
  const { userRole } = useOrganization();
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const filteredGroups = PERMISSION_GROUPS.map((group) => {
    if (selectedDomain !== 'ALL' && group.domain !== selectedDomain) {
      return null;
    }
    const filteredPerms = group.permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
    if (filteredPerms.length === 0) return null;
    return { ...group, permissions: filteredPerms };
  }).filter(Boolean) as PermissionGroup[];

  const domains = ['ALL', ...PERMISSION_GROUPS.map((g) => g.domain)];

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Role-Based Access Matrix</h4>
            <p className="text-xs text-slate-500">
              Your active authorization tier:{' '}
              <span className="font-semibold text-sentinel-700">{userRole || 'VIEWER'}</span>
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search permission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 w-44"
            />
          </div>

          {/* Domain tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {domains.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDomain(d)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedDomain === d
                    ? 'bg-sentinel-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4 min-w-[240px]">Permission & Capability</th>
                {ALL_ROLES.map((r) => {
                  const isCurrentRole = r.role === userRole;
                  return (
                    <th
                      key={r.role}
                      className={`py-3 px-2 text-center min-w-[80px] ${
                        isCurrentRole ? 'bg-sentinel-50/90 text-sentinel-900 border-x border-sentinel-200' : ''
                      }`}
                      title={r.label}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold">{r.short}</span>
                        {isCurrentRole && (
                          <span className="text-[9px] uppercase tracking-wider text-sentinel-600 font-extrabold mt-0.5">
                            You
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.map((group) => (
                <React.Fragment key={group.domain}>
                  <tr className="bg-slate-100/50">
                    <td
                      colSpan={ALL_ROLES.length + 1}
                      className="py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {group.domain}
                    </td>
                  </tr>
                  {group.permissions.map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-900">{perm.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</p>
                      </td>
                      {ALL_ROLES.map((r) => {
                        const hasPerm =
                          r.role === 'SUPER_ADMIN' ||
                          (ROLE_PERMISSIONS[r.role] &&
                            ROLE_PERMISSIONS[r.role].includes(perm.key));
                        const isCurrentRole = r.role === userRole;

                        return (
                          <td
                            key={r.role}
                            className={`py-2 px-2 text-center ${
                              isCurrentRole ? 'bg-sentinel-50/50 border-x border-sentinel-100' : ''
                            }`}
                          >
                            {hasPerm ? (
                              <div className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 shadow-2xs">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-5 h-5 text-slate-300">
                                <Minus className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
