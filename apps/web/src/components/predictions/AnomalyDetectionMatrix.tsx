// ─────────────────────────────────────────────
// SENTINEL Web — Statistical Anomaly Detection Matrix Card
// ─────────────────────────────────────────────

import React from 'react';
import { AlertCircle, ShieldAlert, Cpu, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProvenanceBadge } from '../analytics/ProvenanceBadge';
import type { DetectedAnomaly } from '@sentinel/types';

interface AnomalyDetectionMatrixProps {
  anomalies?: DetectedAnomaly[];
}

export const AnomalyDetectionMatrix: React.FC<AnomalyDetectionMatrixProps> = ({
  anomalies = [],
}) => {
  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = anomalies.filter((a) => a.severity === 'WARNING').length;

  return (
    <Card className="p-5 border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">
                  Fleet Multi-Sensor Statistical Anomaly Matrix
                </h3>
                <ProvenanceBadge
                  provenance="PREDICTED"
                  tooltipText="Real-time multi-dimensional Z-score & rate-of-change outlier detection."
                />
              </div>
              <p className="text-xs text-slate-400">
                Model: sentinel-zscore-anomaly-v1.0 • Evaluates CO₂, thermal runaway, off-hours presence, and frozen ADC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {warningCount} Warnings
              </Badge>
            )}
            {anomalies.length === 0 && (
              <Badge variant="success" className="text-xs gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fleet Nominal
              </Badge>
            )}
          </div>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 my-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-200">No Statistical Anomalies Detected</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All multi-sensor telemetry streams are operating within standard 3-sigma variance bounds. No sensor flatlines, thermal runaways, or curfew incursions found.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-2">
            {anomalies.map((anom) => {
              const severityVariant =
                anom.severity === 'CRITICAL'
                  ? 'danger'
                  : anom.severity === 'WARNING'
                  ? 'warning'
                  : 'neutral';

              const timeFormatted = new Date(anom.detectedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={anom.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Badge variant={severityVariant} className="text-xs font-bold uppercase tracking-wider">
                        {anom.severity}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-100 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {anom.anomalyType}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {anom.roomName || 'Monitored Zone'}
                        </span>
                        {anom.deviceId && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Cpu className="w-3 h-3 text-slate-500" />
                            {anom.deviceId}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {anom.explanation}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>
                          Observed: <strong className="text-slate-200">{anom.observedValue}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Expected Baseline: <strong className="text-slate-200">{anom.expectedValue}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-indigo-400 font-semibold">
                          Deviation: +{anom.score} σ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 text-xs text-slate-400 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{timeFormatted}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Confidence: {anom.confidence}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          Anomalies are advisory flags fed into operator triage; safety automations remain deterministic
        </span>
        <span className="font-mono text-[11px] text-slate-500">sentinel-zscore-anomaly-v1.0</span>
      </div>
    </Card>
  );
};
