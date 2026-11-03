// ─────────────────────────────────────────────
// SENTINEL Web — Sector Deployment Templates Catalog
// ─────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Rocket,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';

export const DeploymentTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { templates, fetchTemplates } = useDeployment();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const industries: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Sectors' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'school', label: 'School' },
    { id: 'school_bus', label: 'School Bus' },
    { id: 'office', label: 'Office' },
    { id: 'mall', label: 'Mall' },
    { id: 'factory', label: 'Factory' },
    { id: 'warehouse', label: 'Warehouse' },
    { id: 'parking', label: 'Parking' },
    { id: 'public_facility', label: 'Public Facility' },
    { id: 'custom', label: 'Custom' },
  ];

  const filtered = templates.filter(
    (t) => selectedIndustry === 'ALL' || t.industry === selectedIndustry
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-400" />
            Sector Deployment Templates
          </h1>
          <p className="text-xs text-text-secondary">
            Pre-certified deployment blueprints containing recommended sensor suites, compliance frameworks, and event rules.
          </p>
        </div>

        <button
          onClick={() => navigate('/deployments/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Rocket className="w-4 h-4" />
          Create from Template
        </button>
      </div>

      {/* Sector filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {industries.map((ind) => (
          <button
            key={ind.id}
            onClick={() => setSelectedIndustry(ind.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedIndustry === ind.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface hover:bg-surface-hover border border-border text-text-secondary'
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  {tpl.industry}
                </span>
                <span className="text-[11px] text-text-muted font-mono">{tpl.recommendedChipModel}</span>
              </div>

              <div>
                <h3 className="font-bold text-text-primary text-base">{tpl.name}</h3>
                <p className="text-xs text-text-secondary mt-1">{tpl.description}</p>
              </div>

              {/* Recommended Sensors */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-text-muted uppercase">
                  Sensors ({tpl.recommendedSensors.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.recommendedSensors.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-surface-hover text-text-primary border border-border"
                    >
                      {s.sensorType} ({s.model})
                    </span>
                  ))}
                </div>
              </div>

              {/* Compliance notes */}
              {tpl.complianceFrameworks?.length > 0 && (
                <div className="pt-2 border-t border-border flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tpl.complianceFrameworks.join(' • ')}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/deployments/new')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-surface-hover hover:bg-border text-text-primary rounded-lg text-xs font-semibold border border-border transition-colors"
            >
              Use This Template <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
