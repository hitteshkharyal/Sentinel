import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Building2,
  Radio,
  Zap,
  Sliders,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lock,
  Building,
  LogOut,
  Users,
  ChevronDown,
  Plus,
  Cpu,
  Activity,
  BrainCircuit,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { CreateOrganizationModal } from '../organization/CreateOrganizationModal';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { currentOrganization, userOrganizations, switchOrganization } = useOrganization();
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const userInitials =
    user?.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'OP';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Operations Center',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: 'LIVE',
      badgeVariant: 'success' as const,
    },
    {
      to: '/organizations',
      label: 'Organizations & Team',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/facilities',
      label: 'Facilities & Rooms',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/devices',
      label: 'ESP32 Nodes',
      icon: <Cpu className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/sensors',
      label: 'Sensor Catalog',
      icon: <Radio className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/telemetry',
      label: 'Telemetry Pipeline',
      icon: <Activity className="w-4 h-4 shrink-0" />,
      badge: 'MQTT',
      badgeVariant: 'primary' as const,
    },
    {
      to: '/events',
      label: 'Event Engine',
      icon: <Zap className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/automations',
      label: 'Automations & Rules',
      icon: <Sliders className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/alerts',
      label: 'Alerts & Escalations',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge: '3 ACTIVE',
      badgeVariant: 'danger' as const,
    },
    {
      to: '/analytics',
      label: 'Analytics & ESG',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      to: '/predictions',
      label: 'Predictions & AI',
      icon: <BrainCircuit className="w-4 h-4 shrink-0" />,
      badge: 'ML',
      badgeVariant: 'primary' as const,
    },
  ];

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col bg-[#030712]/95 backdrop-blur-xl border-r border-cyan-500/15 transition-all duration-300 select-none z-30 text-slate-200 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* ── Brand Logo Header ── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-cyan-500/15">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          {/* GuardianEye 45° Diamond Emblem */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-cyan-500/20 border border-cyan-400 rotate-45 rounded-xs shadow-[0_0_10px_rgba(0,240,255,0.4)]" />
            <Shield className="w-4 h-4 text-cyan-300 relative z-10" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-mono font-bold text-sm tracking-wider text-white block leading-tight">
                SENTINEL<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[9px] uppercase font-mono text-cyan-400/80 tracking-widest">
                CYBERNETIC TELEMETRY
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-cyan-950/40 border border-slate-800 transition-colors shrink-0"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        )}
      </div>

      {/* ── Organization Scope Switcher ── */}
      {!isCollapsed && (
        <div className="p-3 border-b border-cyan-500/15 bg-[#050b17]/70 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-widest text-[9px] text-slate-400">Active Scope</span>
            <span className="text-[10px] text-cyan-400 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOrgPickerOpen(!orgPickerOpen)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-[#071224] border border-cyan-500/20 hover:border-cyan-500/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-bold text-white truncate">
                  {currentOrganization?.name || 'Select Organization'}
                </p>
                <p className="text-[9px] text-cyan-400/70 truncate uppercase font-mono">
                  {currentOrganization?.industry || 'Tenant'} · {currentOrganization?.userRole || 'Viewer'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Org Picker Dropdown */}
          {orgPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOrgPickerOpen(false)}
              />
              <div className="absolute left-3 right-3 top-full mt-1 bg-[#060e1d] rounded-xl shadow-2xl border border-cyan-500/30 p-1.5 z-40 max-h-52 overflow-y-auto divide-y divide-cyan-500/15 animate-slide-up font-mono">
                <div className="py-1">
                  {userOrganizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        switchOrganization(org.id);
                        setOrgPickerOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors ${
                        org.id === currentOrganization?.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'hover:bg-cyan-950/40 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-semibold shrink-0 border border-cyan-500/20">
                        {org.userRole}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOrgPickerOpen(false);
                      setCreateModalOpen(true);
                    }}
                    className="w-full text-left p-2 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-950/40 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Organization</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Navigation Links ── */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto font-mono">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group border ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold'
                  : 'border-transparent text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-500/20'
              }`
            }
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="flex-1 truncate uppercase tracking-wider">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <Badge
                    variant={isActive ? 'neutral' : item.badgeVariant}
                    size="sm"
                    className={isActive ? '!bg-cyan-400 !text-black !border-transparent font-bold' : ''}
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Privacy Preservation Guarantee Pill ── */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-[#040e21] border border-cyan-500/25 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold mb-1">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="uppercase tracking-wider text-[10px]">Zero Optical Feeds</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug font-light">
            All occupancy & fall detection powered by 60GHz mmWave radar & acoustic energy.
          </p>
        </div>
      )}

      {/* ── User Footer ── */}
      <div className="p-3 border-t border-cyan-500/15 bg-[#02050c]">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-cyan-500/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
              {userInitials}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-bold text-white truncate">
                {user?.displayName || 'Facility Operator'}
              </p>
              <p className="text-[9px] font-mono text-cyan-400/70 truncate">
                {user?.email || 'Authenticated'}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors focus:outline-none"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#030712] shadow-2xl z-10 animate-slide-up border-r border-cyan-500/20">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
};
