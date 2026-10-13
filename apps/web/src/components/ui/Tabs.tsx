import React, { createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onChange, children, className = '' }) => {
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: onChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 ${className}`}
    >
      {children}
    </div>
  );
};

export interface TabProps {
  id: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export const Tab: React.FC<TabProps> = ({ id, children, icon, badge, disabled = false }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within a Tabs component');

  const isActive = context.activeTab === id;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => context.setActiveTab(id)}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 select-none
        ${
          isActive
            ? 'bg-white text-sentinel-700 shadow-xs shadow-slate-900/5 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </button>
  );
};

export const TabPanel: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within a Tabs component');

  if (context.activeTab !== id) return null;

  return (
    <div role="tabpanel" className={`pt-4 animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
