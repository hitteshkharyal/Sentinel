// ─────────────────────────────────────────────
// SENTINEL Web — Compliance Profile Settings Modal (Day 15)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type {
  ComplianceProfile,
  ComplianceFramework,
  ComplianceStrictness,
  UpdateComplianceProfileDTO,
} from '@sentinel/types';
import { X, Sliders, ShieldCheck, Check, Lock } from 'lucide-react';

interface ComplianceProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ComplianceProfile | null;
  onSave: (dto: UpdateComplianceProfileDTO) => Promise<unknown>;
}

const ALL_FRAMEWORKS: Array<{ id: ComplianceFramework; name: string; org: string }> = [
  { id: 'ASHRAE_55', name: 'ASHRAE 55', org: 'Thermal Environmental Comfort (20-24°C)' },
  { id: 'ASHRAE_62_1', name: 'ASHRAE 62.1', org: 'Indoor Air Quality & Fresh Air Ventilation (<1000 ppm CO2)' },
  { id: 'HIPAA', name: 'HIPAA Title II', org: 'Healthcare Non-Optical Sensing & Patient Fall SLA' },
  { id: 'FERPA_COPPA', name: 'FERPA & COPPA', org: 'Minor Privacy & Zero School Video Surveillance' },
  { id: 'GDPR_ART9', name: 'GDPR Article 9', org: 'Workplace & Retail Biometric Privacy Protection' },
  { id: 'OSHA_1910', name: 'OSHA 1910', org: 'General Industry Hazardous Machinery Interlocks' },
  { id: 'HACCP_FSMA', name: 'HACCP / FSMA', org: 'Perishable Food & Cold Storage Logistics' },
  { id: 'WELL_LEED', name: 'WELL v2 / LEED', org: 'ESG Operational Sustainability & Setbacks' },
];

export const ComplianceProfileSettingsModal: React.FC<ComplianceProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [enabledFrameworks, setEnabledFrameworks] = useState<ComplianceFramework[]>(
    profile?.enabledFrameworks || ['ASHRAE_55', 'ASHRAE_62_1', 'WELL_LEED']
  );
  const [strictness, setStrictness] = useState<ComplianceStrictness>(
    profile?.strictness || 'BALANCED'
  );
  const [autoRemediation, setAutoRemediation] = useState<boolean>(
    profile?.autoRemediationEnabled ?? true
  );
  const [privacyLevel, setPrivacyLevel] = useState<'ZERO_VIDEO' | 'AGGREGATED_ONLY' | 'ANONYMIZED'>(
    profile?.privacyLevel || 'ZERO_VIDEO'
  );
  const [auditHours, setAuditHours] = useState<number>(profile?.auditFrequencyHours || 24);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleFramework = (fw: ComplianceFramework) => {
    if (enabledFrameworks.includes(fw)) {
      setEnabledFrameworks(enabledFrameworks.filter((f) => f !== fw));
    } else {
      setEnabledFrameworks([...enabledFrameworks, fw]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        enabledFrameworks,
        strictness,
        autoRemediationEnabled: autoRemediation,
        privacyLevel,
        auditFrequencyHours: auditHours,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Governance & Compliance Settings</h2>
              <p className="text-xs text-slate-500">Configure statutory frameworks, evaluation strictness, and auto-fixes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Framework Checkbox Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Regulatory Frameworks ({enabledFrameworks.length}/{ALL_FRAMEWORKS.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_FRAMEWORKS.map((fw) => {
                const checked = enabledFrameworks.includes(fw.id);
                return (
                  <div
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                      checked
                        ? 'bg-sentinel-50/60 border-sentinel-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        checked ? 'bg-sentinel-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{fw.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{fw.org}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strictness Level Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Evaluation Strictness
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['STRICT', 'BALANCED', 'PERMISSIVE'] as ComplianceStrictness[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setStrictness(lvl)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    strictness === lvl
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {lvl === 'STRICT' ? 'Zero tolerance' : lvl === 'BALANCED' ? 'Standard Enterprise' : 'High tolerance'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Statutory Privacy Enforcement Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['ZERO_VIDEO', 'AGGREGATED_ONLY', 'ANONYMIZED'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setPrivacyLevel(tier)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    privacyLevel === tier
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    {tier}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {tier === 'ZERO_VIDEO' ? 'Non-optical only' : tier === 'AGGREGATED_ONLY' ? 'Zone counts' : 'De-identified'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audit Frequency */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Automated Audit Frequency
            </label>
            <select
              value={auditHours}
              onChange={(e) => setAuditHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value={1}>Every 1 Hour (Continuous High-Precision)</option>
              <option value={6}>Every 6 Hours</option>
              <option value={24}>Every 24 Hours (Standard Enterprise Daily)</option>
              <option value={168}>Every 7 Days (Weekly Summary)</option>
            </select>
          </div>

          {/* Auto Remediation Toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Autonomous Policy Auto-Remediation</span>
              <span className="text-[11px] text-slate-500 block">
                Automatically deploy missing standard safety & environmental policies upon violation detection.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRemediation}
              onChange={(e) => setAutoRemediation(e.target.checked)}
              className="w-4 h-4 rounded text-sentinel-600 focus:ring-sentinel-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
