// ─────────────────────────────────────────────
// SENTINEL Web — Organization & RBAC Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Organization,
  OrganizationWithRole,
  OrganizationMember,
  Role,
  Permission,
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  InviteMemberDTO,
} from '@sentinel/types';
import { hasPermission as sharedHasPermission, canManageRole as sharedCanManageRole } from '@sentinel/shared';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  currentOrganization: OrganizationWithRole | null;
  userOrganizations: OrganizationWithRole[];
  userRole: Role | null;
  isLoading: boolean;
  isLoadingMembers: boolean;
  members: OrganizationMember[];
  switchOrganization: (orgId: string) => void;
  createOrganization: (dto: CreateOrganizationDTO) => Promise<Organization>;
  updateOrganization: (id: string, dto: UpdateOrganizationDTO) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  fetchMembers: (orgId?: string) => Promise<void>;
  inviteMember: (dto: InviteMemberDTO) => Promise<OrganizationMember>;
  updateMemberRole: (memberId: string, role: Role) => Promise<OrganizationMember>;
  removeMember: (memberId: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canManageRole: (targetRole: Role) => boolean;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const ACTIVE_ORG_KEY = 'sentinel_active_org_id';

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [userOrganizations, setUserOrganizations] = useState<OrganizationWithRole[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationWithRole | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);

  // Helper for authenticated API calls with organization context header
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      if (currentOrganization?.id) {
        headers.set('X-Organization-Id', currentOrganization.id);
      }
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, { ...options, headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'API request failed');
      }
      return json.data;
    },
    [token, currentOrganization?.id]
  );

  // Fetch list of organizations accessible by user
  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setUserOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const orgs: OrganizationWithRole[] = json.data;
        setUserOrganizations(orgs);

        if (orgs.length > 0 && orgs[0]) {
          const savedOrgId = localStorage.getItem(ACTIVE_ORG_KEY);
          const found = orgs.find((o) => o.id === savedOrgId);
          const initialOrg = found ?? orgs[0];
          setCurrentOrganization(initialOrg);
          localStorage.setItem(ACTIVE_ORG_KEY, initialOrg.id);
        } else {
          setCurrentOrganization(null);
          localStorage.removeItem(ACTIVE_ORG_KEY);
        }
      }
    } catch {
      setUserOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Fetch team members for the active organization
  const fetchMembers = useCallback(
    async (orgId?: string) => {
      const targetOrgId = orgId || currentOrganization?.id;
      if (!targetOrgId || !token) {
        setMembers([]);
        return;
      }

      setIsLoadingMembers(true);
      try {
        const res = await fetch(`${API_BASE}/organizations/${targetOrgId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-Id': targetOrgId,
          },
        });

        if (!res.ok) {
          setMembers([]);
          return;
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMembers(json.data);
        }
      } catch {
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    },
    [currentOrganization?.id, token]
  );

  // Re-fetch organizations whenever auth status changes
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Re-fetch members when currentOrganization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchMembers(currentOrganization.id);
    } else {
      setMembers([]);
    }
  }, [currentOrganization?.id, fetchMembers]);

  // Switch organization scope
  const switchOrganization = useCallback(
    (orgId: string) => {
      const target = userOrganizations.find((o) => o.id === orgId);
      if (target) {
        setCurrentOrganization(target);
        localStorage.setItem(ACTIVE_ORG_KEY, target.id);
      }
    },
    [userOrganizations]
  );

  // Create new organization
  const createOrganization = useCallback(
    async (dto: CreateOrganizationDTO): Promise<Organization> => {
      const created = await authFetch(`${API_BASE}/organizations`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      // Refetch organizations and select the newly created one
      await fetchOrganizations();
      if (created?.id) {
        localStorage.setItem(ACTIVE_ORG_KEY, created.id);
      }
      return created;
    },
    [authFetch, fetchOrganizations]
  );

  // Update organization metadata
  const updateOrganization = useCallback(
    async (id: string, dto: UpdateOrganizationDTO): Promise<Organization> => {
      const updated = await authFetch(`${API_BASE}/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });

      setUserOrganizations((prev) =>
        prev.map((org) => (org.id === id ? { ...org, ...updated } : org))
      );
      if (currentOrganization?.id === id) {
        setCurrentOrganization((prev) => (prev ? { ...prev, ...updated } : null));
      }
      return updated;
    },
    [authFetch, currentOrganization?.id]
  );

  // Delete organization
  const deleteOrganization = useCallback(
    async (id: string): Promise<void> => {
      await authFetch(`${API_BASE}/organizations/${id}`, {
        method: 'DELETE',
      });

      await fetchOrganizations();
    },
    [authFetch, fetchOrganizations]
  );

  // Invite member
  const inviteMember = useCallback(
    async (dto: InviteMemberDTO): Promise<OrganizationMember> => {
      if (!currentOrganization?.id) {
        throw new Error('No active organization selected');
      }

      const newMember = await authFetch(
        `${API_BASE}/organizations/${currentOrganization.id}/members`,
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );

      await fetchMembers(currentOrganization.id);
      return newMember;
    },
    [authFetch, currentOrganization?.id, fetchMembers]
  );

  // Update member role
  const updateMemberRole = useCallback(
    async (memberId: string, role: Role): Promise<OrganizationMember> => {
      if (!currentOrganization?.id) {
        throw new Error('No active organization selected');
      }

      const updated = await authFetch(
        `${API_BASE}/organizations/${currentOrganization.id}/members/${memberId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        }
      );

      await fetchMembers(currentOrganization.id);
      return updated;
    },
    [authFetch, currentOrganization?.id, fetchMembers]
  );

  // Remove member
  const removeMember = useCallback(
    async (memberId: string): Promise<void> => {
      if (!currentOrganization?.id) {
        throw new Error('No active organization selected');
      }

      await authFetch(
        `${API_BASE}/organizations/${currentOrganization.id}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );

      await fetchMembers(currentOrganization.id);
    },
    [authFetch, currentOrganization?.id, fetchMembers]
  );

  // Effective user role in active organization
  const userRole = useMemo<Role | null>(() => {
    if (user?.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    return currentOrganization?.userRole || null;
  }, [user?.role, currentOrganization?.userRole]);

  // Client-side permission check for UI gating
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!userRole) return false;
      return sharedHasPermission(userRole, permission);
    },
    [userRole]
  );

  // Client-side role hierarchy management check
  const canManageRole = useCallback(
    (targetRole: Role): boolean => {
      if (!userRole) return false;
      return sharedCanManageRole(userRole, targetRole);
    },
    [userRole]
  );

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        userOrganizations,
        userRole,
        isLoading,
        isLoadingMembers,
        members,
        switchOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        fetchMembers,
        inviteMember,
        updateMemberRole,
        removeMember,
        hasPermission,
        canManageRole,
        refetchOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
