// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Overview Tab
// High-level deployment KPIs, health, and quick actions
// ─────────────────────────────────────────────

import React from 'react';
import {
  Activity,
  Users,
  Radio,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Deployment } from '@sentinel/types';

interface OverviewTabProps {
  deployment: Deployment;
  onNavigateTab: (tab: string) => void;
}

export const DeploymentOverviewTab: React.FC<OverviewTabProps> = ({
  deployment,
  onNavigateTab,
}) => {
  const sensors = deployment.hardwareConfig?.sensors || [];
  const teamCount = deployment.team?.length || 0;
  const isOnline = deployment.status === 'ACTIVE' || deployment.status === 'TESTING';

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE3EC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deployment Status</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                deployment.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : deployment.status === 'TESTING'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {deployment.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{deployment.industry.replace('_', ' ')}</p>
          <p className="text-xs text-slate-500 mt-1">{deployment.useCaseName}</p>
        </div>

        <div className="bg-white border border-[#DCE3EC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Sensors</span>
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{sensors.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {sensors.map(s => s.model || s.sensorType).slice(0, 3).join(', ')}
            {sensors.length > 3 ? ` +${sensors.length - 3} more` : ''}
          </p>
        </div>

        <div className="bg-white border border-[#DCE3EC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Team Roster</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{teamCount} Members</p>
          <p className="text-xs text-slate-500 mt-1">Supervisors, Techs, Operators</p>
        </div>

        <div className="bg-white border border-[#DCE3EC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hardware Health</span>
            <Activity className={`w-4 h-4 ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{isOnline ? 'ONLINE' : 'STANDBY'}</p>
          <p className="text-xs text-slate-500 mt-1">
            Board: {deployment.hardwareConfig?.boardName || 'ESP32 / ESP8266'}
          </p>
        </div>
      </div>

      {/* Quick Launchpad & Next Steps */}
      <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#172033] mb-2">Guided Setup Progress</h3>
        <p className="text-xs text-slate-500 mb-6">
          Complete the guided steps below to verify hardware connectivity and activate continuous monitoring.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTab('sensors')}
            className="cursor-pointer border border-[#DCE3EC] hover:border-blue-500 rounded-lg p-4 transition-all bg-[#F8FAFC] hover:bg-blue-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Configure Sensors</h4>
            <p className="text-xs text-slate-500 mt-1">{sensors.length} sensors selected</p>
          </div>

          <div
            onClick={() => onNavigateTab('team')}
            className="cursor-pointer border border-[#DCE3EC] hover:border-blue-500 rounded-lg p-4 transition-all bg-[#F8FAFC] hover:bg-blue-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              {teamCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Assign Site Team</h4>
            <p className="text-xs text-slate-500 mt-1">{teamCount} staff assigned</p>
          </div>

          <div
            onClick={() => onNavigateTab('firmware')}
            className="cursor-pointer border border-[#DCE3EC] hover:border-blue-500 rounded-lg p-4 transition-all bg-[#F8FAFC] hover:bg-blue-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              {deployment.latestFirmwareVersion ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <FileCode className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Generate Firmware</h4>
            <p className="text-xs text-slate-500 mt-1">Single-file .ino sketch</p>
          </div>

          <div
            onClick={() => onNavigateTab('testing')}
            className="cursor-pointer border border-[#DCE3EC] hover:border-blue-500 rounded-lg p-4 transition-all bg-[#F8FAFC] hover:bg-blue-50/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                4
              </span>
              {deployment.isReadinessApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Activity className="w-4 h-4 text-amber-600" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Live Test & Activate</h4>
            <p className="text-xs text-slate-500 mt-1">
              {deployment.isReadinessApproved ? 'Readiness signed off' : 'Pending verification'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Meta Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCE3EC] rounded-xl p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-[#172033] mb-4">Location & Facility</h4>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500">Facility</dt>
              <dd className="font-medium text-[#172033] mt-0.5">{deployment.facilityName || 'Primary Facility'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Room / Zone</dt>
              <dd className="font-medium text-[#172033] mt-0.5">{deployment.roomName || 'Unassigned Zone'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Assigned Device ID</dt>
              <dd className="font-mono text-[#2563EB] font-medium mt-0.5">
                {deployment.deviceId || `SENT-${deployment.name.substring(0, 6).toUpperCase()}`}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Power Source</dt>
              <dd className="font-medium text-[#172033] mt-0.5">
                {deployment.hardwareConfig?.powerSource || 'MAINS / USB'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-[#DCE3EC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-[#172033]">Device Access Key</h4>
            <button
              onClick={() => onNavigateTab('devices')}
              className="text-xs text-[#2563EB] font-medium hover:underline inline-flex items-center gap-1"
            >
              Manage Key <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Hardware uses this cryptographic API key in the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">X-Device-API-Key</code> header to post sensor telemetry.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <span className="font-mono text-xs text-slate-600">sent_dev_••••••••••••••••••••••••</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">PROTECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
