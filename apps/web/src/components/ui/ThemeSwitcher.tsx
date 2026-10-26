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
      bgClass: 'bg-white',
      glowColor: 'rgba(255, 255, 255, 0.9)',
    },
    {
      id: 'green',
      name: 'Green',
      bgClass: 'bg-[#00ff88]',
      glowColor: 'rgba(0, 255, 136, 0.9)',
    },
    {
      id: 'orange',
      name: 'Orange',
      bgClass: 'bg-[#ff6b00]',
      glowColor: 'rgba(255, 107, 0, 0.9)',
    },
    {
      id: 'cyan',
      name: 'Cyan',
      bgClass: 'bg-[#00f0ff]',
      glowColor: 'rgba(0, 240, 255, 0.9)',
    },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-full border transition-all select-none backdrop-blur-md ${
        theme === 'white'
          ? 'bg-white/90 border-slate-300 shadow-sm'
          : 'bg-slate-950/80 border-cyan-500/20 shadow-md shadow-black/40'
      } ${className}`}
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
            className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              isActive
                ? theme === 'white'
                  ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-xs'
                  : 'bg-slate-900 text-white border border-slate-700 shadow-xs'
                : theme === 'white'
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
            }`}
            title={`Switch to ${t.name} Theme`}
            aria-label={`${t.name} Theme`}
            aria-pressed={isActive}
          >
            {/* Color Swatch Dot */}
            <span
              className={`w-3 h-3 rounded-full ${t.bgClass} transition-transform border border-black/20 ${
                isActive ? 'scale-110 shadow-sm' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'
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
                    ? theme === 'white'
                      ? 'text-slate-900 font-black'
                      : 'text-white font-black'
                    : theme === 'white'
                    ? 'text-slate-500'
                    : 'text-slate-400'
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
