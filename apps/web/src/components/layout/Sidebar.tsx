import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Rocket,
  FileCode,
  CheckCircle2,
  History,
  Wrench,
  FolderGit2,
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

interface NavSubItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
  requiredPermission?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  items: NavSubItem[];
  requiredPermission?: string;
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const navGroups: NavGroup[] = useMemo(() => [
    {
      id: 'overview',
      title: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      items: [
        {
          to: '/dashboard',
          label: 'Operations Center',
          icon: <LayoutDashboard className="w-3.5 h-3.5" />,
          badge: 'LIVE',
          badgeVariant: 'success',
        },
      ],
    },
    {
      id: 'deployments',
      title: 'Deployments',
      icon: <Rocket className="w-4 h-4 text-emerald-400" />,
      defaultExpanded: true,
      items: [
        {
          to: '/deployments',
          label: 'Deployment Center',
          icon: <Rocket className="w-3.5 h-3.5" />,
          badge: 'NEW',
          badgeVariant: 'primary',
        },
        {
          to: '/deployments/new',
          label: 'Deployment Wizard',
          icon: <Plus className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/templates',
          label: 'Sector Templates',
          icon: <FolderGit2 className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/firmware',
          label: 'Firmware Generator',
          icon: <FileCode className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/provision',
          label: 'Device Provisioning',
          icon: <Wrench className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/test',
          label: 'Hardware Testing',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/active',
          label: 'Active Deployments',
          icon: <Activity className="w-3.5 h-3.5" />,
        },
        {
          to: '/deployments/history',
          label: 'Deployment History',
          icon: <History className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'organization',
      title: 'Organization',
      icon: <Building2 className="w-4 h-4" />,
      items: [
        {
          to: '/organizations',
          label: 'Organizations & Team',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          to: '/facilities',
          label: 'Facilities & Rooms',
          icon: <Building2 className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'devices',
      title: 'Devices & Sensors',
      icon: <Cpu className="w-4 h-4" />,
      items: [
        {
          to: '/devices',
          label: 'ESP32 Nodes',
          icon: <Cpu className="w-3.5 h-3.5" />,
        },
        {
          to: '/sensors',
          label: 'Sensor Catalog',
          icon: <Radio className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'intelligence',
      title: 'Intelligence & Rules',
      icon: <Zap className="w-4 h-4" />,
      items: [
        {
          to: '/events',
          label: 'Event Engine',
          icon: <Zap className="w-3.5 h-3.5" />,
        },
        {
          to: '/automations',
          label: 'Automations & Rules',
          icon: <Sliders className="w-3.5 h-3.5" />,
        },
        {
          to: '/predictions',
          label: 'Predictions & AI',
          icon: <BrainCircuit className="w-3.5 h-3.5" />,
          badge: 'ML',
          badgeVariant: 'primary',
        },
        {
          to: '/compliance',
          label: 'Compliance Policies',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          badge: 'PRO',
          badgeVariant: 'primary',
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      items: [
        {
          to: '/telemetry',
          label: 'Telemetry Pipeline',
          icon: <Activity className="w-3.5 h-3.5" />,
          badge: 'MQTT',
          badgeVariant: 'primary',
        },
        {
          to: '/alerts',
          label: 'Alerts & Incidents',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          badge: 'ACTIVE',
          badgeVariant: 'danger',
        },
        {
          to: '/analytics',
          label: 'Analytics & ESG',
          icon: <BarChart3 className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administration',
      icon: <Lock className="w-4 h-4" />,
      items: [
        {
          to: '/security',
          label: 'Security & Zero-Trust',
          icon: <Lock className="w-3.5 h-3.5" />,
          badge: 'ARMOR',
          badgeVariant: 'primary',
        },
      ],
    },
  ], []);

  // Accordion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      overview: true,
      deployments: true,
      organization: true,
      devices: false,
      intelligence: false,
      monitoring: false,
      administration: false,
    };
    return initial;
  });

  // Auto-expand group containing current route
  useEffect(() => {
    const currentPath = location.pathname;
    navGroups.forEach((group) => {
      const match = group.items.some((item) => currentPath === item.to || currentPath.startsWith(item.to + '/'));
      if (match) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname, navGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col sidebar-container backdrop-blur-xl border-r transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* ── Brand Logo Header ── */}
      <div className="h-16 px-4 flex items-center justify-between border-b sidebar-header shrink-0">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-blue-500/20 border border-blue-500 rotate-45 rounded-xs shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
            <Shield className="w-4 h-4 text-blue-500 relative z-10" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-mono font-bold text-sm tracking-wider text-[var(--sidebar-text)] block leading-tight">
                SENTINEL<span className="text-[var(--theme-primary)]">.AI</span>
              </span>
              <span className="text-[9px] uppercase font-mono text-[var(--theme-primary)] tracking-widest font-bold">
                ENTERPRISE SENSORY
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-scope-bg)] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Active Organization Selector ── */}
      <div className="p-3 border-b border-[var(--sidebar-border)] shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOrgPickerOpen(!orgPickerOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-[var(--sidebar-scope-btn)] hover:bg-[var(--sidebar-scope-bg)] border border-[var(--sidebar-border)] transition-all text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/40 flex items-center justify-center text-[var(--theme-primary)] shrink-0">
                <Building className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[var(--sidebar-text)] truncate leading-tight">
                    {currentOrganization?.name || 'Select Organization'}
                  </div>
                  <div className="text-[10px] text-[var(--sidebar-text-muted)] font-mono uppercase tracking-wider">
                    {currentOrganization?.industry || 'Tenant'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--sidebar-text-muted)] shrink-0 transition-transform ${
                  orgPickerOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Org Dropdown */}
          {orgPickerOpen && !isCollapsed && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--sidebar-dropdown-bg)] border border-[var(--sidebar-border)] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-mono text-[var(--sidebar-text-muted)] uppercase tracking-wider border-b border-[var(--sidebar-border)]">
                Organizations ({userOrganizations.length})
              </div>
              <div className="max-h-48 overflow-y-auto">
                {userOrganizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      switchOrganization(org.id);
                      setOrgPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      currentOrganization?.id === org.id
                        ? 'bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] font-semibold'
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-scope-bg)]'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[9px] font-mono text-[var(--sidebar-text-muted)] ml-2 uppercase">
                      {org.userRole}
                    </span>
                  </button>
                ))}
              </div>
              {user?.role === 'SUPER_ADMIN' && (
                <div className="border-t border-[var(--sidebar-border)] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(true);
                      setOrgPickerOpen(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/10 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Organization</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reorganized Multi-Section Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3 custom-scrollbar">
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? false;

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] transition-colors rounded-md hover:bg-[var(--sidebar-scope-bg)]"
                >
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <span>{group.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {/* Group items (shown if expanded or collapsed sidebar) */}
              {(isExpanded || isCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard' || item.to === '/deployments'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold shadow-sm'
                            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-scope-bg)] hover:text-[var(--theme-primary)]'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.icon}
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'primary'}
                          size="sm"
                          className="font-mono text-[9px] px-1.5 py-0 shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── User & Status Footer ── */}
      <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-footer-bg)] shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--sidebar-scope-bg)] transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/40 flex items-center justify-center text-[var(--theme-primary)] font-bold text-xs shrink-0">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[var(--sidebar-text)] truncate leading-tight">
                    {user?.displayName || 'Operator'}
                  </div>
                  <div className="text-[10px] text-[var(--sidebar-text-muted)] font-mono truncate">
                    {user?.email || 'admin@sentinel.local'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--sidebar-text-muted)] shrink-0 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* User Popout Menu */}
          {userMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--sidebar-dropdown-bg)] border border-[var(--sidebar-border)] rounded-lg shadow-xl p-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-mono text-[var(--sidebar-text-muted)] border-b border-[var(--sidebar-border)]">
                ROLE: {user?.role || 'VIEWER'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
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
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative flex-1 max-w-xs w-full bg-[var(--sidebar-bg)] h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Modal for Creating New Organization */}
      {createModalOpen && (
        <CreateOrganizationModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </>
  );
};
