// ─────────────────────────────────────────────
// SENTINEL Web — Prediction Disclaimer Banner
// Master Prompt Section 41 (Epistemological Integrity)
// ─────────────────────────────────────────────

import React from 'react';
import { Sparkles, Info, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const PredictionDisclaimerBanner: React.FC = () => {
  return (
    <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">
                Predictive Intelligence & Forward Statistical Modeling
              </span>
              <Badge variant="primary" className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                PREDICTED
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Target projections are mathematical estimates derived from mass-balance accumulation, thermal decay
              inertia, and circadian diurnal profiles. In accordance with Section 41 of the Sentinel Architecture,
              predictions are strictly advisory, carry confidence bands, and never substitute for deterministic safety
              rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safety Interlocks Deterministic</span>
          <Info className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>
    </Card>
  );
};
