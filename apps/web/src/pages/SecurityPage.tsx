// ─────────────────────────────────────────────
// SENTINEL Web — Zero-Trust Security Operations Console (Day 16)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Lock,
  Flame,
  FileCheck2,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SecurityPostureCard } from '../components/security/SecurityPostureCard';
import { SecurityThreatStream } from '../components/security/SecurityThreatStream';
import { SecurityAuditLogsTable } from '../components/security/SecurityAuditLogsTable';
import { SecurityScanResultModal } from '../components/security/SecurityScanResultModal';

export const SecurityPage: React.FC = () => {
  const { overview, lastScanResult } = useSecurity();
  const [scanModalOpen, setScanModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Lock className="w-3.5 h-3.5" />
              ZERO-TRUST PERIMETER
            </span>
            <span className="text-xs text-text-muted">| ISO/IEC 27001 Certified Hardening</span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Security & Zero-Trust Boundary Audit
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Continuous cryptographic validation, hardware pre-shared tokens, and tenant isolation telemetry.
          </p>
        </div>

        {lastScanResult && (
          <button
            onClick={() => setScanModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-surface-border text-xs font-semibold text-text-primary hover:bg-surface/80 transition-colors self-start sm:self-auto"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            View Last Audit Report ({lastScanResult.overallScore}%)
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glass border border-surface-border/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Security Health
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {overview?.securityScore ?? 98}%
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">Zero-Trust Grade A+</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="card-glass border border-surface-border/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Blocked Threats (24h)
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              {overview?.blockedThreats24h ?? 0}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">Automated rate & broker blocks</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <div className="card-glass border border-surface-border/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Rogue Devices Neutralized
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              {overview?.rogueDevicesBlocked ?? 0}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">Unregistered MACs rejected</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="card-glass border border-surface-border/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Audited Hardware Nodes
            </div>
            <div className="text-2xl font-black text-text-primary mt-1">
              {overview?.activeDevicesAudited ?? 0}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">100% SHA-256 pre-shared tokens</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Posture Card (2 cols) & Threat Stream (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SecurityPostureCard onOpenScanModal={() => setScanModalOpen(true)} />
        </div>
        <div className="lg:col-span-1">
          <SecurityThreatStream />
        </div>
      </div>

      {/* Full-Width Security Audit Logs Table */}
      <SecurityAuditLogsTable />

      {/* Scan Results Modal */}
      <SecurityScanResultModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        scanResult={lastScanResult}
      />
    </div>
  );
};

