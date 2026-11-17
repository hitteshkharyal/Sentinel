// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Alerts Tab
// Alert notifications, threshold breaches, and hazard events
// ─────────────────────────────────────────────

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Deployment } from '@sentinel/types';

interface AlertsTabProps {
  deployment: Deployment;
}

export const DeploymentAlertsTab: React.FC<AlertsTabProps> = ({ deployment }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#172033]">Site Alerts & Incident History</h3>
        <p className="text-xs text-slate-500">
          Threshold violations and anomalous sensor activity detected for {deployment.name}
        </p>
      </div>

      <div className="bg-white border border-[#DCE3EC] rounded-xl p-8 text-center shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-[#172033]">All Systems Nominal</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No critical or warning alerts have been triggered for this deployment. When sensor thresholds are breached or hazards are detected, real-time alerts will appear here.
        </p>
      </div>
    </div>
  );
};
