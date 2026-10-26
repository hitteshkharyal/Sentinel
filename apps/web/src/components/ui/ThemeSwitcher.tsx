// ─────────────────────────────────────────────
// SENTINEL Web — Tactical HUD Theme Switcher
// Switcher Buttons: White, Green, Orange, Cyan
// ─────────────────────────────────────────────

import React from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';

export interface ThemeSwitcherProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  showLabels = false,
}) => {
  const { theme, setTheme } = useTheme();

  const themes: Array<{
    id: Theme;
    name: string;
    bgClass: string;
    glowColor: string;
  }> = [
    {
      id: 'white',
      name: 'White',
      bgClass: 'bg-white border-2 border-slate-700',
      glowColor: 'rgba(255, 255, 255, 0.9)',
    },
    {
      id: 'green',
      name: 'Green',
      bgClass: 'bg-[#00ff88] border border-black/30',
      glowColor: 'rgba(0, 255, 136, 0.9)',
    },
    {
      id: 'orange',
      name: 'Orange',
      bgClass: 'bg-[#ea580c] border border-black/30',
      glowColor: 'rgba(234, 88, 12, 0.9)',
    },
    {
      id: 'cyan',
      name: 'Cyan',
      bgClass: 'bg-[#00f0ff] border border-black/30',
      glowColor: 'rgba(0, 240, 255, 0.9)',
    },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-full border transition-all select-none backdrop-blur-md bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-md ${className}`}
      title="Switch Visual Theme"
      role="group"
      aria-label="Color Theme Switcher"
    >
      {themes.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`group relative flex items-center justify-center gap-1.5 p-1.5 sm:px-2 sm:py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer min-w-[28px] min-h-[28px] ${
              isActive
                ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-text)] border border-[var(--theme-badge-border)] shadow-xs scale-105'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-badge-bg)] border border-transparent'
            }`}
            title={`Switch to ${t.name} Theme`}
            aria-label={`${t.name} Theme`}
            aria-pressed={isActive}
          >
            {/* Color Swatch Dot */}
            <span
              className={`w-3.5 h-3.5 rounded-full ${t.bgClass} transition-transform ${
                isActive ? 'scale-110 shadow-sm ring-2 ring-[var(--theme-primary)] ring-offset-1' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'
              }`}
              style={{
                boxShadow: isActive ? `0 0 10px ${t.glowColor}` : undefined,
              }}
            />

            {/* Optional text label or active indicator */}
            {showLabels && (
              <span
                className={`text-[10px] ${
                  isActive
                    ? 'text-[var(--theme-text)] font-black'
                    : 'text-[var(--theme-text-muted)] font-semibold'
                }`}
              >
                {t.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
