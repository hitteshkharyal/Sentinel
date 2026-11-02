// ─────────────────────────────────────────────
// SENTINEL Web — Industry Policy Pack Modal (Day 15)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { PolicyPack, IndustryType } from '@sentinel/types';
import {
  X,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Bus,
  Stethoscope,
  GraduationCap,
  Hotel,
  Building,
  ShoppingBag,
  Factory,
  Warehouse,
  Lock,
} from 'lucide-react';

interface IndustryPolicyPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyPacks: PolicyPack[];
  currentOrgIndustry?: string;
  onApplyPack: (industry: IndustryType, overwriteExisting: boolean) => Promise<{ message?: string } | null | void>;
}

export const IndustryPolicyPackModal: React.FC<IndustryPolicyPackModalProps> = ({
  isOpen,
  onClose,
  policyPacks,
  currentOrgIndustry,
  onApplyPack,
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    currentOrgIndustry || 'transport'
  );
  const [overwrite, setOverwrite] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPack = policyPacks.find((p) => p.industry === selectedIndustry) || policyPacks[0];

  const getIndustryIcon = (ind: string) => {
    switch (ind) {
      case 'transport':
        return <Bus className="w-4 h-4" />;
      case 'hospital':
        return <Stethoscope className="w-4 h-4" />;
      case 'school':
        return <GraduationCap className="w-4 h-4" />;
      case 'hotel':
        return <Hotel className="w-4 h-4" />;
      case 'office':
        return <Building className="w-4 h-4" />;
      case 'mall':
        return <ShoppingBag className="w-4 h-4" />;
      case 'factory':
        return <Factory className="w-4 h-4" />;
      case 'warehouse':
      default:
        return <Warehouse className="w-4 h-4" />;
    }
  };

  const handleDeploy = async () => {
    if (!currentPack) return;
    setIsDeploying(true);
    setDeployResult(null);
    try {
      const res = await onApplyPack(currentPack.industry, overwrite);
      if (res?.message) {
        setDeployResult(res.message);
      } else {
        setDeployResult(`Successfully deployed policy pack for ${currentPack.industryName}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDeployResult(`Deployment failed: ${msg}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sentinel-50 text-sentinel-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Industry Policy Packs Catalog</h2>
              <p className="text-xs text-slate-500">
                1-Click deploy tailored enterprise policy packs across all 8 primary sectors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sector Tabs */}
        <div className="px-6 py-2 border-b border-slate-100 overflow-x-auto flex items-center gap-2 bg-slate-50/50">
          {policyPacks.map((pack) => (
            <button
              key={pack.industry}
              onClick={() => {
                setSelectedIndustry(pack.industry);
                setDeployResult(null);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedIndustry === pack.industry
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              {getIndustryIcon(pack.industry)}
              {pack.industryName}
            </button>
          ))}
        </div>

        {/* Pack Details Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {currentPack ? (
            <>
              {/* Hero Banner for Sector */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-emerald-300 border border-white/10">
                    <ShieldCheck className="w-3 h-3" />
                    Sector Pack: {currentPack.code}
                  </div>
                  <h3 className="text-xl font-bold text-white">{currentPack.tagline}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{currentPack.description}</p>

                  <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-300">
                    <span>
                      Primary Frameworks:{' '}
                      <strong className="text-white font-mono">{currentPack.primaryFrameworks.join(', ')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Guaranteed Outcome:{' '}
                      <strong className="text-emerald-400 font-bold">{currentPack.stat}</strong> {currentPack.statLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deployment Status Notice */}
              {deployResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{deployResult}</span>
                </div>
              )}

              {/* Policies List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Included Policy Automation Rules ({currentPack.templates.length})
                </h4>

                <div className="space-y-3">
                  {currentPack.templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sentinel-700 bg-sentinel-50 px-2 py-0.5 rounded border border-sentinel-200">
                            {tmpl.code}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900">{tmpl.name}</h5>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                          Trigger: {tmpl.triggerEventType}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{tmpl.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          {tmpl.privacyPreservingNote}
                        </span>
                        <span>Cooldown: {tmpl.cooldownMs / 1000}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select an industry pack to preview policies.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="rounded border-slate-300 text-sentinel-600 focus:ring-sentinel-500"
            />
            <span>Overwrite duplicate rules with standard factory presets</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !currentPack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sentinel-600 text-white hover:bg-sentinel-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {isDeploying ? 'Deploying...' : `Deploy ${currentPack?.industryName} Pack`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
