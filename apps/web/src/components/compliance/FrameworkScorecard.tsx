// ─────────────────────────────────────────────
// SENTINEL Web — Framework Scorecard Component (Day 15)
// ─────────────────────────────────────────────

import React from 'react';
import type { FrameworkScore } from '@sentinel/types';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wind,
  Thermometer,
  EyeOff,
  GraduationCap,
  Scale,
  HardHat,
  PackageCheck,
  Building,
} from 'lucide-react';

interface FrameworkScorecardProps {
  frameworks: FrameworkScore[];
}

export const FrameworkScorecard: React.FC<FrameworkScorecardProps> = ({ frameworks }) => {
  const getCategoryIcon = (framework: string) => {
    switch (framework) {
      case 'ASHRAE_55':
        return <Thermometer className="w-4 h-4 text-amber-500" />;
      case 'ASHRAE_62_1':
        return <Wind className="w-4 h-4 text-cyan-500" />;
      case 'HIPAA':
        return <EyeOff className="w-4 h-4 text-rose-500" />;
      case 'FERPA_COPPA':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'GDPR_ART9':
        return <Scale className="w-4 h-4 text-purple-500" />;
      case 'OSHA_1910':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'HACCP_FSMA':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case 'WELL_LEED':
      default:
        return <Building className="w-4 h-4 text-teal-500" />;
    }
  };

  const getStatusBadge = (status: string, violationsCount: number) => {
    if (status === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Passing
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> {violationsCount} Warning{violationsCount > 1 ? 's' : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
        <XCircle className="w-3 h-3" /> {violationsCount} Violation{violationsCount > 1 ? 's' : ''}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Enforced Governance Frameworks</h3>
          <p className="text-xs text-slate-500">Live operational compliance scores across active regulatory standards</p>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
          {frameworks.length} Frameworks Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {frameworks.map((fw) => (
          <div
            key={fw.framework}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {getCategoryIcon(fw.framework)}
                </div>
                {getStatusBadge(fw.status, fw.activeViolations)}
              </div>

              {/* Title & Regulatory Body */}
              <div className="mb-3">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-sentinel-700 transition-colors">
                  {fw.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">{fw.regulatoryBody}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {fw.description}
              </p>
            </div>

            {/* Score & Progress Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Compliance Score</span>
                <span
                  className={`font-mono font-black ${
                    fw.score >= 85 ? 'text-emerald-600' : fw.score >= 65 ? 'text-amber-600' : 'text-rose-600'
                  }`}
                >
                  {fw.score}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    fw.score >= 85 ? 'bg-emerald-500' : fw.score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${fw.score}%` }}
                />
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  Rules: <strong className="text-slate-700 font-semibold">{fw.passingRules}/{fw.totalRulesChecked}</strong>
                </span>

                {fw.referenceUrl && (
                  <a
                    href={fw.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Standard <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
