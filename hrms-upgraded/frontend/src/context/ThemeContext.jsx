import { createContext, useContext, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Default palette matching requirements
export const DEFAULT_THEME = {
  primary:   '#3ac4ee',
  secondary: '#30b67d',
  accent:    '#e9b029',
  danger:    '#df205b',
};

// A handful of preset company themes
export const PRESET_THEMES = [
  { name: 'Sky Blue',   primary: '#3ac4ee', secondary: '#30b67d', accent: '#e9b029', danger: '#df205b' },
  { name: 'Ocean',      primary: '#2563eb', secondary: '#0891b2', accent: '#f59e0b', danger: '#ef4444' },
  { name: 'Forest',     primary: '#059669', secondary: '#0284c7', accent: '#d97706', danger: '#dc2626' },
  { name: 'Royal',      primary: '#7c3aed', secondary: '#06b6d4', accent: '#f59e0b', danger: '#ef4444' },
  { name: 'Coral',      primary: '#e11d48', secondary: '#0891b2', accent: '#f59e0b', danger: '#7c3aed' },
  { name: 'Midnight',   primary: '#1e40af', secondary: '#15803d', accent: '#b45309', danger: '#b91c1c' },
];

// Derived palette computed from base colors
function buildDerivedVars(theme) {
  const lighten = (hex, pct) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * pct));
    const g = Math.min(255, Math.round(((n >>  8) & 0xff) + (255 - ((n >>  8) & 0xff)) * pct));
    const b = Math.min(255, Math.round(( n        & 0xff) + (255 - ( n        & 0xff)) * pct));
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };
  const darken = (hex, pct) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - pct)));
    const g = Math.max(0, Math.round(((n >>  8) & 0xff) * (1 - pct)));
    const b = Math.max(0, Math.round(( n        & 0xff) * (1 - pct)));
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  };

  return {
    '--primary':          theme.primary,
    '--primary-dark':     darken(theme.primary, 0.18),
    '--primary-light':    lighten(theme.primary, 0.92),
    '--secondary':        theme.secondary,
    '--secondary-dark':   darken(theme.secondary, 0.18),
    '--secondary-light':  lighten(theme.secondary, 0.90),
    '--accent':           theme.accent,
    '--accent-light':     lighten(theme.accent, 0.90),
    '--danger':           theme.danger,
    '--danger-light':     lighten(theme.danger, 0.92),
    '--sidebar-active':   `${theme.primary}2e`,
  };
}

export function applyTheme(theme) {
  const vars = buildDerivedVars({ ...DEFAULT_THEME, ...theme });
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // Persist for page reloads
  try { localStorage.setItem('hrms_theme', JSON.stringify(theme)); } catch {}
}

export function resetTheme() {
  applyTheme(DEFAULT_THEME);
  try { localStorage.removeItem('hrms_theme'); } catch {}
}

export const ThemeProvider = ({ children }) => {
  const apply = useCallback((theme) => applyTheme(theme), []);

  // On mount: restore persisted theme
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hrms_theme');
      if (stored) apply(JSON.parse(stored));
      else apply(DEFAULT_THEME);
    } catch {
      apply(DEFAULT_THEME);
    }
  }, [apply]);

  return (
    <ThemeContext.Provider value={{ applyTheme: apply, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
