// ─────────────────────────────────────────────
// SENTINEL Web — Active & Verified Deployments Grid
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';

export const ActiveDeploymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { deployments, fetchDeployments, isLoading } = useDeployment();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDeployments({ status: 'ACTIVE' });
  }, [fetchDeployments]);

  const activeOnly = deployments.filter((d) => d.status === 'ACTIVE');
  const filtered = activeOnly.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.industry.toLowerCase().includes(search.toLowerCase()) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Active Production Deployments
          </h1>
          <p className="text-xs text-text-secondary">
            Hardware installations verified with passing 7-point diagnostic scorecards and active automated policies.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active nodes..."
            className="w-full bg-surface-hover border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-text-muted">Loading active fleet...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-xl border border-border text-xs text-text-muted space-y-3">
          <p>No active production deployments found.</p>
          <button
            onClick={() => navigate('/deployments')}
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
          >
            Go to Deployment Center
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dep) => (
            <div
              key={dep.id}
              onClick={() => navigate(`/deployments/${dep.id}`)}
              className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {dep.industry}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                </span>
              </div>

              <div>
                <h3 className="font-bold text-text-primary text-base truncate">{dep.name}</h3>
                <p className="text-xs text-text-secondary truncate mt-0.5">{dep.useCaseName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                <div className="p-2 rounded bg-surface-hover border border-border">
                  <span className="text-[10px] text-text-muted block">Device ID</span>
                  <span className="font-mono font-bold text-cyan-400 truncate block">
                    {dep.deviceId || 'ESP32'}
                  </span>
                </div>
                <div className="p-2 rounded bg-surface-hover border border-border">
                  <span className="text-[10px] text-text-muted block">Sensors</span>
                  <span className="font-semibold text-text-primary block">
                    {dep.hardwareConfig.sensors.length} Channels
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-secondary">
                <span>Facility: <strong className="text-text-primary">{dep.facilityName || 'Global'}</strong></span>
                <span className="text-primary flex items-center gap-1 font-semibold text-[11px]">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
