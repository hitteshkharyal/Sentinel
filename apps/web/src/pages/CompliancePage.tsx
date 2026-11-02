// ─────────────────────────────────────────────
// SENTINEL Web — Compliance & Industry Policies Console (Day 15)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useCompliance } from '../context/ComplianceContext';
import { useOrganization } from '../context/OrganizationContext';
import { ComplianceScoreGauge } from '../components/compliance/ComplianceScoreGauge';
import { FrameworkScorecard } from '../components/compliance/FrameworkScorecard';
import { ComplianceViolationsTable } from '../components/compliance/ComplianceViolationsTable';
import { IndustryPolicyPackModal } from '../components/compliance/IndustryPolicyPackModal';
import { ComplianceProfileSettingsModal } from '../components/compliance/ComplianceProfileSettingsModal';
import { Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  Zap,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const {
    profile,
    auditResult,
    policyPacks,
    isAuditing,
    error,
    runAudit,
    updateProfile,
    applyPolicyPack,
    remediateViolation,
  } = useCompliance();
  const { currentOrganization } = useOrganization();

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const overallScore = auditResult?.overallScore ?? profile?.overallScore ?? 100;
  const overallStatus = auditResult?.overallStatus ?? profile?.overallStatus ?? 'COMPLIANT';
  const frameworks = auditResult?.frameworkScores ?? [];
  const violations = auditResult?.violations ?? [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm" dot>
              {isAuditing ? 'Evaluating Compliance...' : 'Compliance Engine Active'}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Day 15 Implementation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Industry Policies & Compliance Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sense → Understand → Decide → Act → Enforce Statutory Standards & Sector Guarantees.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Configure Profile
          </button>

          <button
            onClick={() => setPolicyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-sentinel-600 text-white hover:bg-sentinel-700 transition-all shadow-xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Industry Policy Packs
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. Top Summary KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Compliance Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{overallScore}%</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {overallStatus === 'COMPLIANT' ? '100% Passing Audits' : `${violations.length} Excursions Flagged`}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Active Standards</span>
            <CheckCircle2 className="w-4 h-4 text-sentinel-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {profile?.enabledFrameworks?.length || 3}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ASHRAE, HIPAA, FERPA, OSHA, HACCP
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Open Violations</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {violations.filter((v) => v.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            {profile?.autoRemediationEnabled ? 'Auto-Remediation Active' : 'Manual Intervention Required'}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Spatial Digital Twins</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {auditResult?.stats?.evaluatedRooms ?? 0}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
            {auditResult?.stats?.activeRules ?? 0} Policies Enforced
          </span>
        </div>
      </div>

      {/* ── 3. Compliance Gauge & Framework Scorecards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ComplianceScoreGauge
            score={overallScore}
            status={overallStatus}
            privacyLevel={profile?.privacyLevel}
            lastAuditedAt={auditResult?.auditedAt || profile?.lastAuditedAt}
            isAuditing={isAuditing}
            onRunAudit={() => runAudit()}
          />
        </div>

        <div className="lg:col-span-2">
          <FrameworkScorecard frameworks={frameworks} />
        </div>
      </div>

      {/* ── 4. Live Violations Table ── */}
      <ComplianceViolationsTable
        violations={violations}
        onRemediate={remediateViolation}
      />

      {/* ── 5. Modals ── */}
      <IndustryPolicyPackModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policyPacks={policyPacks}
        currentOrgIndustry={currentOrganization?.industry}
        onApplyPack={(ind, overwrite) => applyPolicyPack(ind, overwrite)}
      />

      <ComplianceProfileSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        profile={profile}
        onSave={(dto) => updateProfile(dto)}
      />
    </div>
  );
};
