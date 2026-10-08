import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'ink' | 'phosphor' | 'nord';

const THEME_KEY = 'theme';
const DEFAULT_THEME: ThemeName = 'ink';
const THEMES: ThemeName[] = ['ink', 'phosphor', 'nord'];

export interface ThemeContextProps {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'setItem'>;

function ambientStorage(): (ReadStorage & WriteStorage) | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function readTheme(storage?: ReadStorage): ThemeName {
  const stored = storage?.getItem(THEME_KEY) ?? ambientStorage()?.getItem(THEME_KEY);
  return THEMES.includes(stored as ThemeName) ? (stored as ThemeName) : DEFAULT_THEME;
}

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => readTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (next: ThemeName) => {
    setThemeState(next);
    try {
      ambientStorage()?.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable (private mode): theme still applies for the session
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

/** Like `useTheme` but returns undefined outside a provider (graceful in isolation). */
export const useOptionalTheme = (): ThemeContextProps | undefined => useContext(ThemeContext);

export const AVAILABLE_THEMES: { name: ThemeName; label: string }[] = [
  { name: 'ink', label: 'Tinta' },
  { name: 'phosphor', label: 'Fósforo' },
  { name: 'nord', label: 'Nórdico' },
];
