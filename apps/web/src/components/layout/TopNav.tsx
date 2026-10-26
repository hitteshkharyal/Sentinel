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
  Users,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { useAuth } from '../../context/AuthContext';
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
    <header className="min-h-[4.5rem] sm:min-h-[5rem] px-4 sm:px-6 py-3 topnav-container backdrop-blur-xl border-b flex items-center justify-between gap-3 sticky top-0 z-20 transition-colors w-full max-w-full overflow-hidden">
      {/* ── Left: Mobile Toggle & Page Title (shrink-0 ensures it NEVER gets crushed) ── */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--sidebar-scope-bg)] focus:outline-none min-w-[40px] min-h-[40px] flex items-center justify-center border border-[var(--theme-border)]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-mono font-bold tracking-wide leading-tight text-[var(--theme-text)] whitespace-nowrap">
            {title}
          </h1>
          <p className="hidden md:block text-[10px] text-[var(--theme-text-muted)] font-mono font-medium whitespace-nowrap">
            Autonomous Sense → Understand → Decide → Act Loop: ACTIVE
          </p>
        </div>
      </div>

      {/* ── Center / Right: Global Search Trigger & System Health ── */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
        {/* Search Input Bar Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg topnav-search border transition-colors text-xs text-left font-mono"
          aria-label="Search rooms, devices, or sensors"
        >
          <Search className="w-3.5 h-3.5 text-[var(--theme-primary)] shrink-0" />
          <span className="hidden sm:inline text-[var(--theme-text-muted)]">Search rooms, sensors...</span>
          <span className="sm:hidden text-[var(--theme-text-muted)]">Search</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-[var(--theme-badge-bg)] rounded border border-[var(--theme-badge-border)] text-[var(--theme-primary)] font-bold">
            ⌘K
          </kbd>
        </button>

        {/* Live Telemetry Sensor Mesh Pill */}
        <div className="hidden min-[1680px]:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-primary)] text-xs font-mono font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--theme-primary)]" />
          </span>
          <Radio className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
          <span>MESH: 397/421 (94.3%)</span>
        </div>

        {/* Simulate Sensor Action Button */}
        {onOpenSimulator && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSimulator}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[var(--theme-primary)]" />}
            className="hidden min-[1680px]:inline-flex text-xs font-mono topnav-btn border"
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
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
              className="hidden min-[1680px]:inline-flex text-xs font-mono font-bold border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300"
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
            className="relative p-2 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--sidebar-scope-bg)] transition-colors focus:outline-none"
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
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm topnav-dropdown rounded-2xl shadow-2xl border p-4 z-40 animate-slide-up font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[var(--theme-text)] uppercase tracking-wider">
                      Active Telemetry Alerts
                    </span>
                    <Badge variant="danger" size="sm">
                      3 UNRESOLVED
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--sidebar-scope-bg)] transition-colors"
                    aria-label="Close alerts"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-[var(--theme-border)] max-h-72 overflow-y-auto mt-2">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="py-2.5 first:pt-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[var(--theme-text)] flex items-center gap-1.5">
                          {alt.title}
                        </span>
                        <span className="text-[10px] text-[var(--theme-text-muted)]">{alt.time}</span>
                      </div>
                      <p className="text-xs text-[var(--theme-text-muted)] font-sans leading-snug">{alt.desc}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                          {alt.level}
                        </span>
                        <button
                          type="button"
                          className="text-[11px] text-[var(--theme-primary)] hover:underline font-semibold flex items-center gap-1"
                        >
                          View context <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--theme-border)] text-center">
                  <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">
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
            className="flex items-center gap-2 pl-1 border-l border-[var(--theme-border)] hover:opacity-85 transition-opacity focus:outline-none"
            aria-label="User profile menu"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-[var(--theme-border)]"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[var(--theme-badge-bg)] border border-[var(--theme-badge-border)] text-[var(--theme-primary)] flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                {userInitials}
              </div>
            )}
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 topnav-dropdown rounded-xl shadow-2xl border p-2 z-40 animate-slide-up font-mono">
                <div className="px-3 py-2 border-b border-[var(--theme-border)]">
                  <p className="text-xs font-bold text-[var(--theme-text)] truncate">
                    {user?.displayName || 'Operator'}
                  </p>
                  <p className="text-[10px] text-[var(--theme-text-muted)] truncate font-semibold">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/organizations');
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--theme-text)] hover:bg-[var(--sidebar-scope-bg)] transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                  <span>Organizations &amp; Team</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full mt-0.5 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
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
