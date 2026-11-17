// ─────────────────────────────────────────────
// SENTINEL Web — Dedicated Deployment Workspace Layout
// 8-Tab sub-workspace: Overview, Sensors, Devices, Team, Firmware, Live Testing, Alerts, Settings
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Radio,
  Cpu,
  Users,
  FileCode,
  Activity,
  Bell,
  Settings,
} from 'lucide-react';
import type { Deployment } from '@sentinel/types';
import { DeploymentOverviewTab } from './DeploymentOverviewTab';
import { DeploymentSensorsTab } from './DeploymentSensorsTab';
import { DeploymentDevicesTab } from './DeploymentDevicesTab';
import { DeploymentTeamTab } from './DeploymentTeamTab';
import { DeploymentFirmwareTab } from './DeploymentFirmwareTab';
import { DeploymentLiveTestingTab } from './DeploymentLiveTestingTab';
import { DeploymentAlertsTab } from './DeploymentAlertsTab';
import { DeploymentSettingsTab } from './DeploymentSettingsTab';

interface DeploymentWorkspaceProps {
  deployment: Deployment;
  onRefresh?: () => void;
}

type TabKey =
  | 'overview'
  | 'sensors'
  | 'devices'
  | 'team'
  | 'firmware'
  | 'testing'
  | 'alerts'
  | 'settings';

export const DeploymentWorkspaceLayout: React.FC<DeploymentWorkspaceProps> = ({
  deployment,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'sensors', label: 'Sensors', icon: Radio },
    { key: 'devices', label: 'Devices & Keys', icon: Cpu },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'firmware', label: 'Firmware (.ino)', icon: FileCode },
    { key: 'testing', label: 'Live Testing', icon: Activity },
    { key: 'alerts', label: 'Alerts', icon: Bell },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#172033] pb-16">
      {/* Workspace Header */}
      <div className="bg-white border-b border-[#DCE3EC] sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/deployments')}
                className="p-1.5 rounded-lg border border-[#DCE3EC] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                title="Back to All Deployments"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#172033]">{deployment.name}</h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{deployment.industry.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{deployment.useCaseName}</span>
                  <span>•</span>
                  <span>{deployment.facilityName || 'Main Facility'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('firmware')}
                className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5" />
                Generate .ino Firmware
              </button>
            </div>
          </div>

          {/* Sub-workspace Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 border-t border-slate-100 pt-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-[#2563EB] border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <DeploymentOverviewTab
            deployment={deployment}
            onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
          />
        )}
        {activeTab === 'sensors' && <DeploymentSensorsTab deployment={deployment} />}
        {activeTab === 'devices' && <DeploymentDevicesTab deployment={deployment} />}
        {activeTab === 'team' && <DeploymentTeamTab deployment={deployment} />}
        {activeTab === 'firmware' && <DeploymentFirmwareTab deployment={deployment} />}
        {activeTab === 'testing' && (
          <DeploymentLiveTestingTab deployment={deployment} onActivated={onRefresh} />
        )}
        {activeTab === 'alerts' && <DeploymentAlertsTab deployment={deployment} />}
        {activeTab === 'settings' && (
          <DeploymentSettingsTab deployment={deployment} onUpdated={onRefresh} />
        )}
      </div>
    </div>
  );
};
