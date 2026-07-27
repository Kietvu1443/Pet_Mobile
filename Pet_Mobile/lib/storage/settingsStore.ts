import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  LANGUAGE: 'pethelper.language',
  THEME: 'pethelper.themeMode',
  ACCENT_COLOR: 'pethelper.accentColor',
};

export type Language = 'vi' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColorKey = keyof typeof ACCENT_COLORS;

export const ACCENT_COLORS = {
  pink: '#FF4FA3',
  orange: '#FF8340',
  blue: '#3A7AFE',
  green: '#34C759',
  purple: '#7C3AED',
} as const;

export async function getLanguage(): Promise<Language> {
  try {
    const val = await SecureStore.getItemAsync(STORAGE_KEYS.LANGUAGE);
    if (val === 'en' || val === 'vi') return val;
    return 'vi';
  } catch { return 'vi'; }
}

export async function setLanguage(lang: Language): Promise<void> {
  try { await SecureStore.setItemAsync(STORAGE_KEYS.LANGUAGE, lang); } catch { /* ignore */ }
}

export async function getTheme(): Promise<ThemeMode> {
  try {
    const val = await SecureStore.getItemAsync(STORAGE_KEYS.THEME);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
    return 'system';
  } catch { return 'system'; }
}

export async function setTheme(theme: ThemeMode): Promise<void> {
  try { await SecureStore.setItemAsync(STORAGE_KEYS.THEME, theme); } catch { /* ignore */ }
}

export async function getAccentColor(): Promise<AccentColorKey> {
  try {
    const val = await SecureStore.getItemAsync(STORAGE_KEYS.ACCENT_COLOR);
    if (val && val in ACCENT_COLORS) return val as AccentColorKey;
    return 'pink';
  } catch { return 'pink'; }
}

export async function setAccentColor(colorKey: AccentColorKey): Promise<void> {
  try { await SecureStore.setItemAsync(STORAGE_KEYS.ACCENT_COLOR, colorKey); } catch { /* ignore */ }
}
