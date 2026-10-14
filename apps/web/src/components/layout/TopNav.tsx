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
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userInitials =
    user?.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

  // Active platform alerts from Prompt #38
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
    <header className="h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* ── Left: Mobile Toggle & Page Title ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400 font-medium">
            Autonomous Sense → Understand → Decide → Act Loop Active
          </p>
        </div>
      </div>

      {/* ── Center / Right: Global Search Trigger & System Health ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input Bar Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors text-xs text-left"
          aria-label="Search rooms, devices, or sensors"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="hidden md:inline text-slate-500">Search rooms, sensors, devices...</span>
          <span className="md:hidden text-slate-500">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-white rounded border border-slate-300/80 text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Live Telemetry Sensor Mesh Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fleet: 397/421 Online (94.3%)</span>
        </div>

        {/* Simulate Sensor Action Button */}
        {onOpenSimulator && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSimulator}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-sentinel-600" />}
            className="hidden sm:inline-flex text-xs"
          >
            Simulate Event
          </Button>
        )}

        {/* ── Notification Bell with Flyout ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
            </span>
          </button>

          {/* Notifications Dropdown Flyout */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-40 animate-slide-up">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">Active Action Items</span>
                    <Badge variant="danger" size="sm">
                      3 Unresolved
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-sentinel-600 hover:text-sentinel-700 font-medium"
                  >
                    Close
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="py-2.5 first:pt-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {alt.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{alt.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{alt.desc}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                          {alt.level}
                        </span>
                        <button
                          type="button"
                          className="text-[11px] text-sentinel-600 font-medium hover:underline flex items-center gap-1"
                        >
                          View context <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400">
                    Escalation SLA: Level 2 in 03:42 mins
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
            className="flex items-center gap-2 pl-1 border-l border-slate-200/80 hover:opacity-85 transition-opacity focus:outline-none"
            aria-label="User profile menu"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-xl object-cover shadow-xs border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userInitials}
              </div>
            )}
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-40 animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.displayName || 'Operator'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
