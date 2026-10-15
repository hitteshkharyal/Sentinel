// ─────────────────────────────────────────────
// SENTINEL Web — Organizations & RBAC Management
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Plus,
  UserPlus,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';
import { useOrganization } from '../context/OrganizationContext';
import { CreateOrganizationModal } from '../components/organization/CreateOrganizationModal';
import { InviteMemberModal } from '../components/organization/InviteMemberModal';
import { ChangeMemberRoleModal } from '../components/organization/ChangeMemberRoleModal';
import { PermissionsMatrix } from '../components/organization/PermissionsMatrix';
import type { OrganizationMember, IndustryType } from '@sentinel/types';

const INDUSTRY_ICONS: Record<IndustryType, string> = {
  hospital: '🏥',
  hotel: '🏨',
  school: '🏫',
  transport: '🚌',
  office: '🏢',
  factory: '🏭',
  warehouse: '📦',
  mall: '🛍️',
  parking: '🅿️',
  public_facility: '🏛️',
  general: '🌐',
};

const ROLE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ORGANIZATION_ADMIN: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  FACILITY_ADMIN: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  MANAGER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SECURITY: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  OPERATOR: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  TECHNICIAN: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  VIEWER: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const OrganizationsPage: React.FC = () => {
  const {
    currentOrganization,
    userOrganizations,
    userRole,
    switchOrganization,
    updateOrganization,
    deleteOrganization,
    members,
    removeMember,
    hasPermission,
    canManageRole,
    isLoadingMembers,
  } = useOrganization();

  const [activeTab, setActiveTab] = useState<'members' | 'matrix' | 'settings'>('members');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState(currentOrganization?.name || '');
  const [editDesc, setEditDesc] = useState(currentOrganization?.description || '');
  const [editContact, setEditContact] = useState(currentOrganization?.contactEmail || '');
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Delete org state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  // Keep settings form synced when active organization changes
  React.useEffect(() => {
    if (currentOrganization) {
      setEditName(currentOrganization.name);
      setEditDesc(currentOrganization.description || '');
      setEditContact(currentOrganization.contactEmail || '');
      setSettingsSuccess(false);
      setSettingsError(null);
    }
  }, [currentOrganization]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;
    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(false);

    try {
      await updateOrganization(currentOrganization.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        contactEmail: editContact.trim() || undefined,
      });
      setSettingsSuccess(true);
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to update organization settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!currentOrganization || deleteConfirmText !== currentOrganization.name) return;
    setIsDeletingOrg(true);
    try {
      await deleteOrganization(currentOrganization.id);
      setDeleteConfirmText('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete organization');
    } finally {
      setIsDeletingOrg(false);
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${member.user.displayName || member.user.email} from ${
          currentOrganization?.name
        }?`
      )
    ) {
      return;
    }

    try {
      await removeMember(member.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const industryIcon = currentOrganization
    ? INDUSTRY_ICONS[currentOrganization.industry] || '🏢'
    : '🏢';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{industryIcon}</span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Organizations & Access Control (RBAC)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Multi-tenant workspace isolation, platform role assignments, and granular permission enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateOrgOpen(true)}
            leftIcon={<Building2 className="w-4 h-4 text-sentinel-600" />}
          >
            New Organization
          </Button>

          {hasPermission('member.create') && (
            <Button
              size="sm"
              onClick={() => setInviteMemberOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* ── Active Organization Overview Card ── */}
      {currentOrganization ? (
        <Card variant="glass" className="border-sentinel-200/80 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Organization Switcher & Identity */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sentinel-600 to-indigo-700 flex items-center justify-center text-white text-2xl shadow-md shadow-sentinel-600/20 shrink-0">
                  {industryIcon}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                        className="inline-flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 hover:text-sentinel-600 transition-colors"
                      >
                        <span>{currentOrganization.name}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      {/* Dropdown for switching organizations */}
                      {orgDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOrgDropdownOpen(false)}
                          />
                          <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-40 animate-slide-up">
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Switch Workspace ({userOrganizations.length})
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                              {userOrganizations.map((org) => (
                                <button
                                  key={org.id}
                                  type="button"
                                  onClick={() => {
                                    switchOrganization(org.id);
                                    setOrgDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors ${
                                    org.id === currentOrganization.id
                                      ? 'bg-sentinel-50 text-sentinel-900 font-bold'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-base">
                                      {INDUSTRY_ICONS[org.industry] || '🏢'}
                                    </span>
                                    <span className="truncate">{org.name}</span>
                                  </div>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                    {org.userRole}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setOrgDropdownOpen(false);
                                  setCreateOrgOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-sentinel-600 hover:bg-sentinel-50 flex items-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create New Organization</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-sentinel-50 text-sentinel-700 border-sentinel-200">
                      Sector: {currentOrganization.industry.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 max-w-xl">
                    {currentOrganization.description ||
                      'Privacy-preserving autonomous IoT facility workspace.'}
                  </p>
                </div>
              </div>

              {/* Right: Quick Scope Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Your Platform Role
                  </span>
                  <span className="text-xs font-bold text-sentinel-700">{userRole || 'VIEWER'}</span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Team Roster
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Workspace Slug
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-600">
                    {currentOrganization.slug}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert variant="info" title="No Organization Selected">
          You are not currently viewing any organization. Create one or ask an administrator to invite you.
        </Alert>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'members'
              ? 'bg-sentinel-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-sentinel-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC Permissions Matrix</span>
        </button>

        {hasPermission('organization.update') && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-sentinel-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Organization Settings</span>
          </button>
        )}
      </div>

      {/* ── Tab Content: Team Members ── */}
      {activeTab === 'members' && (
        <Card variant="default">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Team Roster & Role Assignments</CardTitle>
              <CardDescription>
                Authorized personnel with operational permissions in {currentOrganization?.name}.
              </CardDescription>
            </div>

            {hasPermission('member.create') && (
              <Button
                size="sm"
                onClick={() => setInviteMemberOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Member
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingMembers ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading team members...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No team members found in this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Platform Role</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => {
                      const defaultBadgeStyle = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
                      const badgeStyle = (ROLE_BADGES[m.role] as typeof defaultBadgeStyle | undefined) ?? defaultBadgeStyle;
                      const userInitials =
                        m.user.displayName
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'OP';

                      const canEditThisMember = canManageRole(m.role) && hasPermission('member.update');
                      const canRemoveThisMember = canManageRole(m.role) && hasPermission('member.delete');

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {m.user.avatarUrl ? (
                                <img
                                  src={m.user.avatarUrl}
                                  alt={m.user.displayName}
                                  className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                                  {userInitials}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{m.user.displayName}</p>
                                <p className="text-[11px] text-slate-400">{m.user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                            >
                              {m.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant={m.user.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                              {m.user.status}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {new Date(m.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEditThisMember && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingMember(m)}
                                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                                  className="text-xs"
                                >
                                  Change Role
                                </Button>
                              )}

                              {canRemoveThisMember && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab Content: RBAC Matrix ── */}
      {activeTab === 'matrix' && <PermissionsMatrix />}

      {/* ── Tab Content: Settings ── */}
      {activeTab === 'settings' && hasPermission('organization.update') && (
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Organization Configuration</CardTitle>
              <CardDescription>
                Modify operational metadata and facility contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
                {settingsSuccess && (
                  <Alert variant="success" title="Settings updated">
                    Organization settings have been saved.
                  </Alert>
                )}
                {settingsError && (
                  <Alert variant="danger" title="Update failed">
                    {settingsError}
                  </Alert>
                )}

                <Input
                  label="Organization Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sector Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                <Input
                  label="Contact Email"
                  type="email"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                />

                <Button type="submit" size="sm" isLoading={isSavingSettings}>
                  Save Settings
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete Organization */}
          {hasPermission('organization.delete') && (
            <Card variant="default" className="border-rose-200 bg-rose-50/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-rose-900">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-rose-700">
                  Decommissioning an organization irreversibly terminates all facilities, rooms, sensor catalogs, and rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-xl">
                <p className="text-xs text-slate-600">
                  To confirm deletion, type the organization name:{' '}
                  <strong className="text-slate-900 font-bold">{currentOrganization?.name}</strong>
                </p>

                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Confirm organization name"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteConfirmText !== currentOrganization?.name}
                    isLoading={isDeletingOrg}
                    onClick={handleDeleteOrg}
                  >
                    Delete Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateOrganizationModal
        isOpen={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
      />

      <InviteMemberModal
        isOpen={inviteMemberOpen}
        onClose={() => setInviteMemberOpen(false)}
      />

      <ChangeMemberRoleModal
        member={editingMember}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
      />
    </div>
  );
};
