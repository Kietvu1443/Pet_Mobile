import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as rnUseColorScheme } from 'react-native';

import { ACCENT_COLORS, getAccentColor, getTheme, setAccentColor as saveAccentColor, setTheme as saveTheme, type AccentColorKey, type ThemeMode } from '@/lib/storage/settingsStore';

export type ThemeColors = {
  primary: string;
  primaryContainer: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  border: string;

  // Semantic State & Container Tokens
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  error: string;
  errorContainer: string;
  selectedContainer: string;
  disabled: string;
  overlay: string;
};

export type ThemeObject = {
  colors: ThemeColors;
  isDark: boolean;
};

const LIGHT_THEME: Omit<ThemeColors, 'primary' | 'primaryContainer' | 'selectedContainer'> = {
  background: '#FFF9FC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#888888',
  border: '#F0F0F0',
  success: '#34C759',
  successContainer: '#E8F8EE',
  warning: '#FFB340',
  warningContainer: '#FFF8E8',
  error: '#FF4D4F',
  errorContainer: '#FFF0F0',
  disabled: '#E5E7EB',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

const DARK_THEME: Omit<ThemeColors, 'primary' | 'primaryContainer' | 'selectedContainer'> = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#242424',
  text: '#FFFFFF',
  muted: '#AAAAAA',
  border: '#333333',
  success: '#30D158',
  successContainer: '#0D3818',
  warning: '#FFD60A',
  warningContainer: '#3A2E00',
  error: '#FF453A',
  errorContainer: '#3C1618',
  disabled: '#3A3A3C',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

function buildTheme(accentColor: AccentColorKey, isDark: boolean): ThemeObject {
  const base = isDark ? DARK_THEME : LIGHT_THEME;
  const primaryHex = ACCENT_COLORS[accentColor];
  return {
    colors: {
      ...base,
      primary: primaryHex,
      primaryContainer: isDark ? primaryHex + '33' : primaryHex + '1A',
      selectedContainer: isDark ? primaryHex + '3B' : primaryHex + '1F',
    },
    isDark,
  };
}

export type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedColorScheme: 'light' | 'dark';
  accentColor: AccentColorKey;
  theme: ThemeObject;
  isReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (colorKey: AccentColorKey) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = rnUseColorScheme() ?? 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColorKey>('pink');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [mode, accent] = await Promise.all([getTheme(), getAccentColor()]);
      setThemeModeState(mode);
      setAccentColorState(accent);
      setIsReady(true);
    })();
  }, []);

  const resolvedColorScheme = themeMode === 'system' ? systemScheme : themeMode;

  const theme = useMemo(
    () => buildTheme(accentColor, resolvedColorScheme === 'dark'),
    [accentColor, resolvedColorScheme],
  );

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveTheme(mode);
  }, []);

  const setAccentColorCallback = useCallback(async (colorKey: AccentColorKey) => {
    setAccentColorState(colorKey);
    await saveAccentColor(colorKey);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedColorScheme,
      accentColor,
      theme,
      isReady,
      setThemeMode,
      setAccentColor: setAccentColorCallback,
    }),
    [themeMode, resolvedColorScheme, accentColor, theme, isReady, setThemeMode, setAccentColorCallback],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
