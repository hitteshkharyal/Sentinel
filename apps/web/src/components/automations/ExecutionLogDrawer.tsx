// ─────────────────────────────────────────────
// SENTINEL Web — Real-Time Execution Log Drawer
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import type { AutomationExecution } from '@sentinel/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  RefreshCw,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { getActionIcon, getEventBadgeColor } from './AutomationRuleCard';

interface ExecutionLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  executions: AutomationExecution[];
  isConnected: boolean;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ExecutionLogDrawer: React.FC<ExecutionLogDrawerProps> = ({
  isOpen,
  onClose,
  executions,
  isConnected,
  onRefresh,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PARTIAL' | 'FAILED'>('ALL');

  if (!isOpen) return null;

  const filteredExecutions = executions.filter((e) => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sentinel-500" />
                Execution Audit Stream
              </h2>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isConnected ? 'LIVE WS' : 'RECONNECTING'}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time ledger of triggered policies, digital twin mutations, and edge dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Status:</span>
            {(['ALL', 'SUCCESS', 'PARTIAL', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-sentinel-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing {filteredExecutions.length} of {executions.length} executions
          </span>
        </div>

        {/* Execution Log Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredExecutions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                No Executions Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                Executions will stream live here as authoritative sensor fusion events match your active policies.
              </p>
            </div>
          ) : (
            filteredExecutions.map((exec) => {
              const isExpanded = expandedId === exec.id;

              return (
                <div
                  key={exec.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-2xs transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {exec.ruleName || 'Autonomous Policy'}
                          </h4>
                          {getStatusBadge(exec.status)}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {exec.triggerEvent && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getEventBadgeColor(
                                exec.triggerEvent.eventType
                              )}`}
                            >
                              {exec.triggerEvent.eventType}
                            </span>
                          )}

                          {exec.facilityName && (
                            <span className="flex items-center gap-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {exec.facilityName}
                              {exec.roomName && ` / ${exec.roomName}`}
                            </span>
                          )}

                          {exec.durationMs !== undefined && (
                            <span className="text-slate-400">({exec.durationMs}ms)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(exec.executedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Execution ID:</span>{' '}
                          <code className="text-slate-700 dark:text-slate-300 font-mono">
                            {exec.id}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-400">Trigger Event ID:</span>{' '}
                          <code className="text-slate-700 dark:text-slate-300 font-mono">
                            {exec.eventId}
                          </code>
                        </div>
                      </div>

                      {/* Executed Actions List */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Actions Executed ({exec.actions.length}):
                        </span>
                        <div className="space-y-1.5">
                          {exec.actions.map((act, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5">{getActionIcon(act.type)}</div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                      {act.type.replace(/_/g, ' ')}
                                    </span>
                                    {act.simulated ? (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-sentinel-50 text-sentinel-600 dark:bg-sentinel-950 dark:text-sentinel-400 font-bold uppercase">
                                        Digital Twin
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 font-bold uppercase">
                                        Physical Edge
                                      </span>
                                    )}
                                  </div>
                                  {act.feedback && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {act.feedback}
                                    </p>
                                  )}
                                  {act.error && (
                                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                      Error: {act.error}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                {act.success ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px] font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    OK
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-rose-600 text-[11px] font-medium">
                                    <XCircle className="w-3 h-3" />
                                    FAIL
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
