// ─────────────────────────────────────────────
// SENTINEL Web — Compliance & Governance Context (Day 15)
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  ComplianceProfile,
  ComplianceAuditResult,
  PolicyPack,
  UpdateComplianceProfileDTO,
  IndustryType,
  PolicyPackApplicationResult,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

const API_BASE = '/api/v1';

interface ComplianceContextType {
  profile: ComplianceProfile | null;
  auditResult: ComplianceAuditResult | null;
  policyPacks: PolicyPack[];
  auditHistory: ComplianceAuditResult[];
  isLoading: boolean;
  isAuditing: boolean;
  error: string | null;
  runAudit: () => Promise<ComplianceAuditResult | null>;
  updateProfile: (dto: UpdateComplianceProfileDTO) => Promise<ComplianceProfile | null>;
  applyPolicyPack: (industry: IndustryType, overwriteExisting?: boolean) => Promise<PolicyPackApplicationResult | null>;
  remediateViolation: (violationId: string, action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS', notes?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [profile, setProfile] = useState<ComplianceProfile | null>(null);
  const [auditResult, setAuditResult] = useState<ComplianceAuditResult | null>(null);
  const [policyPacks, setPolicyPacks] = useState<PolicyPack[]>([]);
  const [auditHistory, setAuditHistory] = useState<ComplianceAuditResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(currentOrganization ? { 'X-Organization-Id': currentOrganization.id } : {}),
    };
  }, [token, currentOrganization]);

  // Fetch Policy Packs catalog
  const fetchPolicyPacks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/policies/packs`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setPolicyPacks(json.data || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load policy packs:', err);
    }
  }, [token, getHeaders]);

  // Fetch Profile & Latest Audit
  const refresh = useCallback(async () => {
    if (!token || !currentOrganization) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Profile
      const profileRes = await fetch(`${API_BASE}/compliance/profile`, { headers: getHeaders() });
      if (profileRes.ok) {
        const json = await profileRes.json();
        setProfile(json.data);
      }

      // 2. Fetch Latest Audit
      const auditRes = await fetch(`${API_BASE}/compliance/audit`, { headers: getHeaders() });
      if (auditRes.ok) {
        const json = await auditRes.json();
        setAuditResult(json.data);
      }

      // 3. Fetch History
      const histRes = await fetch(`${API_BASE}/compliance/history?limit=5`, { headers: getHeaders() });
      if (histRes.ok) {
        const json = await histRes.json();
        setAuditHistory(json.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading compliance telemetry.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentOrganization, getHeaders]);

  useEffect(() => {
    if (token && currentOrganization) {
      refresh();
      fetchPolicyPacks();
    } else {
      setProfile(null);
      setAuditResult(null);
      setAuditHistory([]);
    }
  }, [token, currentOrganization, refresh, fetchPolicyPacks]);

  // Run live compliance audit
  const runAudit = async (): Promise<ComplianceAuditResult | null> => {
    if (!token || !currentOrganization) return null;
    setIsAuditing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/compliance/audit`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Compliance evaluation failed.');
      const json = await res.json();
      setAuditResult(json.data);

      // Refresh profile to update cached scores
      const profileRes = await fetch(`${API_BASE}/compliance/profile`, { headers: getHeaders() });
      if (profileRes.ok) {
        const pJson = await profileRes.json();
        setProfile(pJson.data);
      }

      return json.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Audit execution failed.';
      setError(msg);
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  // Update Profile
  const updateProfile = async (dto: UpdateComplianceProfileDTO): Promise<ComplianceProfile | null> => {
    if (!token || !currentOrganization) return null;
    try {
      const res = await fetch(`${API_BASE}/compliance/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('Failed to update compliance profile.');
      const json = await res.json();
      setProfile(json.data);
      // Re-run audit with updated parameters
      await runAudit();
      return json.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setError(msg);
      return null;
    }
  };

  // Apply Industry Policy Pack
  const applyPolicyPack = async (
    industry: IndustryType,
    overwriteExisting = false
  ): Promise<PolicyPackApplicationResult | null> => {
    if (!token || !currentOrganization) return null;
    try {
      const res = await fetch(`${API_BASE}/policies/apply-pack`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ industry, overwriteExisting }),
      });
      if (!res.ok) throw new Error('Failed to apply policy pack.');
      const json = await res.json();
      // Re-run audit to reflect newly deployed policies
      await runAudit();
      return json.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply policy pack.';
      setError(msg);
      return null;
    }
  };

  // Remediate or Suppress Violation
  const remediateViolation = async (
    violationId: string,
    action: 'AUTO_FIX' | 'SUPPRESS' | 'DISMISS',
    notes?: string
  ): Promise<boolean> => {
    if (!token || !currentOrganization) return false;
    try {
      const res = await fetch(`${API_BASE}/compliance/remediate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ violationId, action, notes }),
      });
      if (!res.ok) throw new Error('Failed to remediate violation.');
      // Re-run audit to update violations state
      await runAudit();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remediate violation.';
      setError(msg);
      return false;
    }
  };

  return (
    <ComplianceContext.Provider
      value={{
        profile,
        auditResult,
        policyPacks,
        auditHistory,
        isLoading,
        isAuditing,
        error,
        runAudit,
        updateProfile,
        applyPolicyPack,
        remediateViolation,
        refresh,
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
};

export const useCompliance = (): ComplianceContextType => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};
