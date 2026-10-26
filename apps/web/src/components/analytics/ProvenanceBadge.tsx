// ─────────────────────────────────────────────
// SENTINEL Web — Data Provenance Badge
// Adheres strictly to Master Prompt Section 40:
// "Clearly distinguish: MEASURED, ESTIMATED, PREDICTED"
// ─────────────────────────────────────────────

import React from 'react';
import type { MetricProvenance } from '@sentinel/types';
import { Activity, Cpu, Sparkles } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: MetricProvenance;
  className?: string;
  size?: 'sm' | 'xs';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  className = '',
  size = 'xs',
}) => {
  if (provenance === 'MEASURED') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded-md border text-emerald-700 bg-emerald-50/90 border-emerald-200/90 shadow-2xs ${
          size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
        } ${className}`}
        title="Direct Hardware Measurement: Raw sensor signal collected and validated by SENTINEL edge pipeline."
      >
        <Activity className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
        <span>MEASURED</span>
      </span>
    );
  }

  if (provenance === 'ESTIMATED') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded-md border text-sentinel-700 bg-sentinel-50/90 border-sentinel-200/90 shadow-2xs ${
          size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
        } ${className}`}
        title="Digital Twin Estimation: Derived from multi-sensor fusion, spatial state tracking, or setback modeling."
      >
        <Cpu className="w-2.5 h-2.5 text-sentinel-600 shrink-0" />
        <span>ESTIMATED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded-md border text-purple-700 bg-purple-50/90 border-purple-200/90 shadow-2xs ${
        size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      } ${className}`}
      title="Machine Learning Prediction: Forecasted value projected from historical time-series modeling."
    >
      <Sparkles className="w-2.5 h-2.5 text-purple-600 shrink-0" />
      <span>PREDICTED</span>
    </span>
  );
};
