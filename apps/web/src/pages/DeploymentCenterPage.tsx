// ─────────────────────────────────────────────
// SENTINEL Web — Deployments Main Landing Console
// Simplified Deployment Center with Enterprise Light Theme
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  Plus,
  CheckCircle2,
  Filter,
  Search,
  FolderGit2,
  FileCode,
  Wrench,
  History,
  Radio,
  Building,
  ChevronRight,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';

export const DeploymentCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { deployments, fetchDeployments, isLoading } = useDeployment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const activeCount = deployments.filter((d) => d.status === 'ACTIVE').length;
  const attentionCount = deployments.filter(
    (d) => d.status === 'FAILED' || (!d.isReadinessApproved && d.status === 'ACTIVE')
  ).length;
  const onlineDevicesCount = deployments.filter(
    (d) => d.status === 'ACTIVE' || d.status === 'TESTING'
  ).length;
  const offlineDevicesCount = deployments.length - onlineDevicesCount;

  const filtered = deployments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.industry.toLowerCase().includes(search.toLowerCase()) ||
      (d.facilityName && d.facilityName.toLowerCase().includes(search.toLowerCase())) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#172033] p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Deployments</h1>
              <p className="text-xs text-slate-500">
                Site deployments, sensor assignment, single-file firmware generation, and live hardware verification.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/deployments/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Deployment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-[#DCE3EC] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Deployments</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#172033] font-mono">{deployments.length}</span>
            <span className="text-xs text-slate-500 font-medium">Sites</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE3EC] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Active Deployments</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-600 font-mono">{activeCount}</span>
            <span className="text-xs text-emerald-600 font-medium">Monitored</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE3EC] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Devices Online</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-blue-600 font-mono">{onlineDevicesCount}</span>
            <span className="text-xs text-blue-600 font-medium">ESP Nodes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE3EC] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Devices Offline</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-600 font-mono">{offlineDevicesCount}</span>
            <span className="text-xs text-slate-400 font-medium">Standby</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE3EC] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Requires Attention</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-bold font-mono ${attentionCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {attentionCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">Action Needed</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-7xl mx-auto">
        {[
          { label: 'Create Deployment', to: '/deployments/new', icon: <Plus className="w-4 h-4 text-blue-600" /> },
          { label: 'Industry Blueprints', to: '/deployments/templates', icon: <FolderGit2 className="w-4 h-4 text-purple-600" /> },
          { label: 'Firmware Generator', to: '/deployments/firmware', icon: <FileCode className="w-4 h-4 text-cyan-600" /> },
          { label: 'Device Provisioning', to: '/deployments/provision', icon: <Wrench className="w-4 h-4 text-amber-600" /> },
          { label: 'Hardware Testing', to: '/deployments/test', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
          { label: 'Deployment History', to: '/deployments/history', icon: <History className="w-4 h-4 text-indigo-600" /> },
        ].map((sub, i) => (
          <Link
            key={i}
            to={sub.to}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#DCE3EC] hover:border-blue-500 hover:bg-blue-50/30 text-xs font-semibold text-[#172033] transition-all shadow-xs"
          >
            {sub.icon}
            <span className="truncate">{sub.label}</span>
          </Link>
        ))}
      </div>

      {/* Deployments List with Search and Filters */}
      <div className="bg-white rounded-xl border border-[#DCE3EC] p-6 space-y-4 shadow-sm max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by deployment name, facility, or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TESTING">TESTING</option>
              <option value="FIRMWARE_GENERATED">FIRMWARE GENERATED</option>
              <option value="CONFIGURED">CONFIGURED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>

        {/* Deployments Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading deployments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-semibold text-[#172033]">No deployments found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No site deployments match your filter criteria. Create a new deployment to get started.
              </p>
              <button
                onClick={() => navigate('/deployments/new')}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Create Deployment
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-y border-[#DCE3EC] text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-medium">Deployment / Site</th>
                  <th className="px-5 py-3 font-medium">Industry & Use Case</th>
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Hardware & Sensors</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC]">
                {filtered.map((d) => {
                  const supervisor = d.team?.find((m) => m.role === 'SUPERVISOR');
                  const sensors = d.hardwareConfig?.sensors || [];

                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/deployments/${d.id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#172033] hover:text-[#2563EB] text-sm">
                          {d.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span>{d.facilityName || 'Main Facility'}</span>
                          {d.roomName && <span>• {d.roomName}</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {d.industry.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{d.useCaseName}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-700 font-medium">
                          {supervisor ? supervisor.displayName || supervisor.email : `${d.team?.length || 0} Members`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {supervisor ? 'Supervisor' : 'Team Roster'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Radio className="w-3.5 h-3.5 text-blue-600" />
                          <span>{sensors.length} Sensors</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {d.deviceId || 'Auto-Provisioned'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            d.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'TESTING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-600'
                                : d.status === 'TESTING'
                                ? 'bg-amber-600'
                                : 'bg-blue-600'
                            }`}
                          />
                          {d.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline">
                          Open Workspace <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
