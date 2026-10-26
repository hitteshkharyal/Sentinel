// ─────────────────────────────────────────────
// SENTINEL Web — Multi-Theme Context System
// Supports: White (Frost), Green (Matrix), Orange (Ember), Cyan (GuardianEye)
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'cyan' | 'white' | 'green' | 'orange';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'sentinel_active_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved && ['cyan', 'white', 'green', 'orange'].includes(saved)) {
        return saved;
      }
    } catch {
      // localStorage may be disabled in restricted environments
    }
    return 'cyan';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
    applyThemeToDOM(newTheme);
  };

  const applyThemeToDOM = (t: Theme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'white') {
      root.classList.add('theme-white');
      root.classList.remove('theme-green', 'theme-orange', 'theme-cyan');
    } else if (t === 'green') {
      root.classList.add('theme-green');
      root.classList.remove('theme-white', 'theme-orange', 'theme-cyan');
    } else if (t === 'orange') {
      root.classList.add('theme-orange');
      root.classList.remove('theme-white', 'theme-green', 'theme-cyan');
    } else {
      root.classList.add('theme-cyan');
      root.classList.remove('theme-white', 'theme-green', 'theme-orange');
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
