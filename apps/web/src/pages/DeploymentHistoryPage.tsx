// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Audit & Event History
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';

export const DeploymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { deployments, fetchDeployments, isLoading } = useDeployment();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const filtered = deployments.filter(
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
            <History className="w-5 h-5 text-indigo-400" />
            Deployment Audit & Installation History
          </h1>
          <p className="text-xs text-text-secondary">
            Immutable log of all configured installations, firmware build generations, and technician test sign-offs.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full bg-surface-hover border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted">Loading audit log...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">No deployment audit entries found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-hover border-b border-border text-text-secondary uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Deployment Name</th>
                  <th className="py-2.5 px-4">Industry / Use Case</th>
                  <th className="py-2.5 px-4">Device Node</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Readiness</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((dep) => (
                  <tr key={dep.id} className="hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(dep.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-text-primary">
                      {dep.name}
                    </td>
                    <td className="py-2.5 px-4 text-text-secondary">
                      <span className="font-semibold text-text-primary uppercase text-[10px] mr-1">
                        [{dep.industry}]
                      </span>
                      {dep.useCaseName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-cyan-400">
                      {dep.deviceId || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-hover border border-border text-text-primary">
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {dep.isReadinessApproved ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">Pending</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/deployments/${dep.id}`)}
                        className="text-primary hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
