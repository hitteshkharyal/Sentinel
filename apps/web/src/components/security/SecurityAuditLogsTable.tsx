// ─────────────────────────────────────────────
// SENTINEL Web — Security Audit Logs Table (Day 16)
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import type { SecuritySeverity, SecurityEventStatus } from '@sentinel/types';

export const SecurityAuditLogsTable: React.FC = () => {
  const { auditLogs, auditMeta, isLoading, fetchAuditLogs } = useSecurity();

  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleFilterChange = (sev: string, stat: string) => {
    setSelectedSeverity(sev);
    setSelectedStatus(stat);
    setCurrentPage(1);
    void fetchAuditLogs({
      page: 1,
      limit: 15,
      severity: sev !== 'ALL' ? (sev as SecuritySeverity) : undefined,
      status: stat !== 'ALL' ? (stat as SecurityEventStatus) : undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    void fetchAuditLogs({
      page: newPage,
      limit: 15,
      severity: selectedSeverity !== 'ALL' ? (selectedSeverity as SecuritySeverity) : undefined,
      status: selectedStatus !== 'ALL' ? (selectedStatus as SecurityEventStatus) : undefined,
    });
  };

  const getSeverityBadge = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/20 text-slate-400 border border-slate-500/40">
            Info
          </span>
        );
    }
  };

  const getStatusBadge = (status: SecurityEventStatus) => {
    if (status === 'BLOCKED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
          <ShieldAlert className="w-3 h-3" />
          Blocked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3 h-3" />
        Success
      </span>
    );
  };

  return (
    <div className="card-glass border border-surface-border/60 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Verifiable Security Audit Trail</h3>
            <p className="text-xs text-text-muted">
              Tamper-evident logs of authentication events, token lifecycles, and boundary denials
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <select
            value={selectedSeverity}
            onChange={(e) => handleFilterChange(e.target.value, selectedStatus)}
            aria-label="Filter by Severity"
            className="text-xs px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border/60 text-text-primary focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
            <option value="INFO">Informational</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange(selectedSeverity, e.target.value)}
            aria-label="Filter by Status"
            className="text-xs px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border/60 text-text-primary focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="BLOCKED">Blocked Only</option>
            <option value="SUCCESS">Success Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border/40 text-text-muted uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Timestamp</th>
              <th className="pb-3 font-semibold">Action / Event</th>
              <th className="pb-3 font-semibold">Severity</th>
              <th className="pb-3 font-semibold">Actor / Identifier</th>
              <th className="pb-3 font-semibold">IP Address</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/20">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading audit logs...
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  No security events recorded matching current filters.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-3 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-text-primary">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3">{getSeverityBadge(log.severity)}</td>
                  <td className="py-3 text-text-secondary font-mono text-[11px]">
                    <span className="font-semibold text-text-primary">{log.actorType}:</span>{' '}
                    {log.actorEmail || log.actorId || 'anonymous'}
                  </td>
                  <td className="py-3 font-mono text-text-muted text-[11px]">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="py-3">{getStatusBadge(log.status)}</td>
                  <td className="py-3 max-w-xs font-mono text-[10px] text-text-muted truncate">
                    {log.details && Object.keys(log.details).length > 0
                      ? JSON.stringify(log.details)
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {auditMeta && auditMeta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-border/40 text-xs text-text-muted">
          <span>
            Showing page {auditMeta.page} of {auditMeta.totalPages} ({auditMeta.total} total events)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-surface-border/60 hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold text-text-primary">{currentPage}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= auditMeta.totalPages}
              className="p-1.5 rounded border border-surface-border/60 hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

