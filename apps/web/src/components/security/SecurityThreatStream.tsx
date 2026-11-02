// ─────────────────────────────────────────────
// SENTINEL Web — Recent Threats Stream (Day 16)
// ─────────────────────────────────────────────

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  Clock,
  Terminal,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import type { SecurityAuditLog } from '@sentinel/types';

export const SecurityThreatStream: React.FC = () => {
  const { recentThreats, fetchRecentThreats } = useSecurity();

  const getSeverityBadge = (severity: SecurityAuditLog['severity']) => {
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
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
            {severity}
          </span>
        );
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="card-glass border border-surface-border/60 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-surface-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Threat Interception & Attack Stream
            </h3>
            <p className="text-xs text-text-muted">Live perimeter blocks and honeypot traps</p>
          </div>
        </div>

        <button
          onClick={() => void fetchRecentThreats()}
          title="Refresh Threat Stream"
          className="p-1.5 rounded-lg border border-surface-border/50 hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
        {recentThreats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
            <p className="text-xs font-semibold text-text-secondary">No High-Severity Threats Detected</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Zero unauthorized boundary crossings in the last monitoring cycle.
            </p>
          </div>
        ) : (
          recentThreats.map((threat) => (
            <div
              key={threat.id}
              className="p-3 rounded-lg bg-surface/40 border border-surface-border/40 hover:border-surface-border transition-colors text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {formatActionName(threat.action)}
                </span>
                {getSeverityBadge(threat.severity)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1 font-mono">
                  <Terminal className="w-3 h-3" />
                  {threat.actorType}:{threat.actorId || 'unknown'}
                  {threat.ipAddress ? ` (${threat.ipAddress})` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(threat.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {threat.details && Object.keys(threat.details).length > 0 && (
                <div className="mt-1 px-2 py-1 rounded bg-slate-900/60 font-mono text-[10px] text-slate-300 truncate">
                  {JSON.stringify(threat.details)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

