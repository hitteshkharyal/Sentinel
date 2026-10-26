import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  LogOut,
  ShieldAlert,
  Building2,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { AccessApprovalsModal } from '../auth/AccessApprovalsModal';

export interface TopNavProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  onOpenSimulator?: () => void;
  title?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
  onOpenSimulator,
  title = 'Operations Center',
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);

  const userInitials =
    user?.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

  // Active platform alerts
  const alerts = [
    {
      id: 'alt-bus-12',
      title: '🚨 Bus 12 — Person Detected Post-Route',
      time: '2 mins ago',
      level: 'Critical Escalation',
      desc: 'mmWave sensor detected student movement after driver engine-cutoff sequence.',
    },
    {
      id: 'alt-room-204',
      title: '⚠️ Room 204 — Assistance Indication',
      time: '8 mins ago',
      level: 'Urgent',
      desc: 'Acoustic spike & bathroom floor stationary posture detected in St. Jude Wing.',
    },
    {
      id: 'alt-cls-8a',
      title: '⚠️ Classroom 8A — High CO₂ (1,450 ppm)',
      time: '14 mins ago',
      level: 'Warning',
      desc: 'Air threshold exceeded. Actuator command sent to increase HVAC intake.',
    },
  ];

  return (
    <header className="min-h-[4.5rem] sm:min-h-[5rem] px-4 sm:px-6 lg:px-8 py-3 bg-[#030712]/95 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20 text-slate-100">
      {/* ── Left: Mobile Toggle & Page Title ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40 focus:outline-none min-w-[38px] min-h-[38px] flex items-center justify-center border border-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-mono font-bold text-white tracking-wide leading-tight truncate max-w-[130px] sm:max-w-none">
            {title}
          </h1>
          <p className="hidden sm:block text-[10px] text-cyan-400/80 font-mono truncate">
            Autonomous Sense → Understand → Decide → Act Loop: ACTIVE
          </p>
        </div>
      </div>

      {/* ── Center / Right: Global Search Trigger & System Health ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Organization Scope Pill */}
        {currentOrganization && (
          <button
            type="button"
            onClick={() => navigate('/organizations')}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#071224] hover:bg-[#0c1e3d] border border-cyan-500/20 text-xs text-slate-300 transition-colors font-mono"
            title="View Organizations & Access Control (RBAC)"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white truncate max-w-[130px]">
              {currentOrganization.name}
            </span>
            <span className="text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
              {currentOrganization.userRole}
            </span>
          </button>
        )}

        {/* Search Input Bar Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#071224] hover:bg-[#0a1930] border border-cyan-500/20 text-slate-400 hover:text-slate-200 transition-colors text-xs text-left font-mono"
          aria-label="Search rooms, devices, or sensors"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline text-slate-400">Search rooms, sensors, devices...</span>
          <span className="md:hidden text-slate-400">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-[#030814] rounded border border-cyan-500/30 text-cyan-400">
            ⌘K
          </kbd>
        </button>

        {/* Live Telemetry Sensor Mesh Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>MESH: 397/421 (94.3%)</span>
        </div>

        {/* Simulate Sensor Action Button */}
        {onOpenSimulator && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSimulator}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />}
            className="hidden sm:inline-flex text-xs font-mono border border-cyan-500/30 bg-[#071224] text-cyan-300 hover:bg-cyan-500/20"
          >
            Simulate Event
          </Button>
        )}

        {/* ── Admin Access Approvals Modal Trigger ── */}
        {isAdmin && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setApprovalsOpen(true)}
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              className="hidden md:inline-flex text-xs font-mono font-bold border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300"
            >
              Access Approvals
            </Button>
            <AccessApprovalsModal
              isOpen={approvalsOpen}
              onClose={() => setApprovalsOpen(false)}
            />
          </>
        )}

        {/* ── Visual Theme Switcher (White, Green, Orange, Cyan) ── */}
        <ThemeSwitcher className="shrink-0" />

        {/* ── Notification Bell with Flyout ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </button>

          {/* Notifications Dropdown Flyout */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[#060e1d] rounded-2xl shadow-2xl border border-cyan-500/30 p-4 z-40 animate-slide-up font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white uppercase tracking-wider">
                      Active Telemetry Alerts
                    </span>
                    <Badge variant="danger" size="sm">
                      3 UNRESOLVED
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Close alerts"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-slate-300 hover:text-white" />
                  </button>
                </div>

                <div className="divide-y divide-cyan-500/10 max-h-72 overflow-y-auto mt-2">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="py-2.5 first:pt-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {alt.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{alt.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-snug">{alt.desc}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                          {alt.level}
                        </span>
                        <button
                          type="button"
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center gap-1"
                        >
                          View context <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-cyan-500/20 text-center">
                  <span className="text-[10px] text-slate-400">
                    ESCALATION SLA: Level 2 in 03:42 mins
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Profile Chip & Menu ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1 border-l border-cyan-500/20 hover:opacity-85 transition-opacity focus:outline-none"
            aria-label="User profile menu"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                {userInitials}
              </div>
            )}
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-[#060e1d] rounded-xl shadow-2xl border border-cyan-500/30 p-2 z-40 animate-slide-up font-mono">
                <div className="px-3 py-2 border-b border-cyan-500/20">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.displayName || 'Operator'}
                  </p>
                  <p className="text-[10px] text-cyan-400/80 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/organizations');
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-300 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Organizations & Team</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full mt-0.5 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
