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
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: 'Live',
      badgeVariant: 'success' as const,
    },
    {
      to: '/organizations',
      label: 'Organizations & Team',
      icon: <Users className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/facilities',
      label: 'Facilities & Rooms',
      icon: <Building2 className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/devices',
      label: 'ESP32 Devices',
      icon: <Cpu className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/sensors',
      label: 'Sensor Catalog',
      icon: <Radio className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/devices',
      label: 'ESP32 Microcontrollers',
      icon: <Cpu className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/events',
      label: 'Event Engine',
      icon: <Zap className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/automations',
      label: 'Automations & Rules',
      icon: <Sliders className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/alerts',
      label: 'Alerts & Escalations',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      badge: '3 Active',
      badgeVariant: 'danger' as const,
    },
    {
      to: '/analytics',
      label: 'Analytics & ESG',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
    },
  ];

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* ── Brand Logo Header ── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sentinel-600 to-sentinel-800 flex items-center justify-center text-white shadow-md shadow-sentinel-600/20 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                SENTINEL
              </span>
              <span className="text-[10px] uppercase font-semibold text-sentinel-600 tracking-wider">
                Autonomous IoT
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Organization Scope Switcher ── */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 relative">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px]">Active Scope</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOrgPickerOpen(!orgPickerOpen)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-sentinel-400 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentOrganization?.name || 'Select Organization'}
                </p>
                <p className="text-[10px] text-slate-400 truncate uppercase font-medium">
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
              <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 max-h-52 overflow-y-auto divide-y divide-slate-100 animate-slide-up">
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
                          ? 'bg-sentinel-50 text-sentinel-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
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
                    className="w-full text-left p-2 rounded-lg text-xs font-semibold text-sentinel-600 hover:bg-sentinel-50 flex items-center gap-1.5"
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-sentinel-600 text-white shadow-xs shadow-sentinel-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`
            }
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <Badge
                    variant={isActive ? 'neutral' : item.badgeVariant}
                    size="sm"
                    className={isActive ? '!bg-white/20 !text-white !border-transparent' : ''}
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
        <div className="mx-3 mb-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
          <div className="flex items-center gap-2 text-sentinel-800 font-semibold mb-1">
            <Lock className="w-3.5 h-3.5 text-sentinel-600 shrink-0" />
            <span>Zero Optical Cameras</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            All occupancy & fall detection powered by 60GHz mmWave radar & acoustic energy.
          </p>
        </div>
      )}

      {/* ── User Footer ── */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sentinel-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userInitials}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.displayName || 'Facility Operator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'Authenticated'}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none"
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-10 animate-slide-up">
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
