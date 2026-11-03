// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Center Dashboard
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  Plus,
  Activity,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  FolderGit2,
  FileCode,
  Wrench,
  History,
} from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import type { DeploymentStatus } from '@sentinel/types';

export const DeploymentCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { deployments, fetchDeployments, isLoading } = useDeployment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const activeCount = deployments.filter((d) => d.status === 'ACTIVE').length;
  const testingCount = deployments.filter((d) => d.status === 'TESTING').length;
  const firmwareCount = deployments.filter((d) => !!d.latestFirmwareBuildId).length;

  const filtered = deployments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.industry.toLowerCase().includes(search.toLowerCase()) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeploymentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ACTIVE
          </span>
        );
      case 'TESTING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Activity className="w-3 h-3" /> TESTING
          </span>
        );
      case 'FIRMWARE_GENERATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
            <FileCode className="w-3 h-3" /> FIRMWARE READY
          </span>
        );
      case 'PROVISIONING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> PROVISIONING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-hover text-text-secondary border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Deployment Center
              </h1>
              <p className="text-xs text-text-secondary">
                Autonomous ESP32 hardware configuration, modular PlatformIO generator & testing console.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/deployments/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Launch Deployment Wizard
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-sm">
          <span className="text-xs text-text-muted font-medium">Total Installations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary font-mono">{deployments.length}</span>
            <span className="text-xs text-text-secondary">Across Facilities</span>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-sm">
          <span className="text-xs text-text-muted font-medium">Active & Verified Nodes</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{activeCount}</span>
            <span className="text-xs text-emerald-400 font-medium">Production Live</span>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-sm">
          <span className="text-xs text-text-muted font-medium">Firmware Projects Built</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400 font-mono">{firmwareCount}</span>
            <span className="text-xs text-cyan-400 font-medium">PlatformIO Bundles</span>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-sm">
          <span className="text-xs text-text-muted font-medium">In Diagnostics / Testing</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 font-mono">{testingCount}</span>
            <span className="text-xs text-amber-400 font-medium">Pre-Flight Review</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Wizard', to: '/deployments/new', icon: <Plus className="w-4 h-4 text-primary" /> },
          { label: 'Sector Templates', to: '/deployments/templates', icon: <FolderGit2 className="w-4 h-4 text-purple-400" /> },
          { label: 'Firmware Generator', to: '/deployments/firmware', icon: <FileCode className="w-4 h-4 text-cyan-400" /> },
          { label: 'Device Provisioning', to: '/deployments/provision', icon: <Wrench className="w-4 h-4 text-amber-400" /> },
          { label: 'Hardware Testing', to: '/deployments/test', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
          { label: 'Audit History', to: '/deployments/history', icon: <History className="w-4 h-4 text-indigo-400" /> },
        ].map((sub, i) => (
          <Link
            key={i}
            to={sub.to}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border hover:border-primary/40 hover:bg-surface-hover text-xs font-semibold text-text-primary transition-all shadow-sm"
          >
            {sub.icon}
            <span className="truncate">{sub.label}</span>
          </Link>
        ))}
      </div>

      {/* Deployments List with Search and Filters */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by deployment, industry or device ID..."
              className="w-full bg-surface-hover border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:border-primary outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TESTING">Testing</option>
              <option value="FIRMWARE_GENERATED">Firmware Ready</option>
              <option value="PROVISIONING">Provisioning</option>
              <option value="CONFIGURED">Configured</option>
            </select>
          </div>
        </div>

        {/* Deployments Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted">
            Loading deployments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted space-y-3">
            <p>No deployments found matching the filter criteria.</p>
            <button
              onClick={() => navigate('/deployments/new')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
            >
              Create First Deployment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((dep) => (
              <div
                key={dep.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/50 rounded-lg px-2 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-text-primary text-sm">
                      {dep.name}
                    </h3>
                    {getStatusBadge(dep.status)}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-hover text-text-muted border border-border">
                      {dep.industry}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    <span>Use Case: <strong className="text-text-primary">{dep.useCaseName}</strong></span>
                    <span>•</span>
                    <span>Facility: <strong className="text-text-primary">{dep.facilityName || 'Unassigned'}</strong></span>
                    {dep.roomName && (
                      <>
                        <span>•</span>
                        <span>Room: <strong className="text-text-primary">{dep.roomName}</strong></span>
                      </>
                    )}
                    {dep.deviceId && (
                      <>
                        <span>•</span>
                        <span>Device: <strong className="font-mono text-cyan-400">{dep.deviceId}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/deployments/${dep.id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border hover:border-primary/50 text-text-primary text-xs font-semibold transition-colors"
                  >
                    Open Console <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
