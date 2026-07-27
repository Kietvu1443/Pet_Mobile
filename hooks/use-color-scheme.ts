import { useEffect, useState } from 'react';
import { useColorScheme as rnUseColorScheme } from 'react-native';

import { getTheme, setTheme as saveThemeToStore, type ThemeMode } from '@/lib/storage/settingsStore';

let currentThemeValue: ThemeMode = 'system';
const listeners = new Set<(theme: ThemeMode) => void>();

// Load the stored theme immediately at module load to prevent start-up visual flashing
void getTheme().then((t) => {
  currentThemeValue = t;
  listeners.forEach(l => l(t));
}).catch(() => {});

function notify(theme: ThemeMode) {
  currentThemeValue = theme;
  listeners.forEach(l => l(theme));
}

export async function notifyThemeChange(theme: ThemeMode): Promise<void> {
  await saveThemeToStore(theme);
  notify(theme);
}

export function useColorScheme(): 'light' | 'dark' {
  const nativeScheme = rnUseColorScheme();
  const [theme, setTheme] = useState(currentThemeValue);

  useEffect(() => {
    getTheme().then((t) => {
      currentThemeValue = t;
      setTheme(t);
    }).catch(() => {});

    const listener = (t: ThemeMode) => setTheme(t);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  if (theme === 'system') {
    return nativeScheme ?? 'light';
  }

  return theme;
}
