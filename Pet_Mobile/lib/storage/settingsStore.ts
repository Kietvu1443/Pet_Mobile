import * as SecureStore from 'expo-secure-store';

const KEYS = {
  LANGUAGE: 'ph_language',
  THEME: 'ph_theme',
};

export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark' | 'system';

export async function getLanguage(): Promise<Language> {
  try {
    const val = await SecureStore.getItemAsync(KEYS.LANGUAGE);
    if (val === 'en' || val === 'vi') return val;
    return 'vi';
  } catch {
    return 'vi';
  }
}

export async function setLanguage(lang: Language): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.LANGUAGE, lang);
  } catch { /* ignore */ }
}

export async function getTheme(): Promise<Theme> {
  try {
    const val = await SecureStore.getItemAsync(KEYS.THEME);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
    return 'system';
  } catch {
    return 'system';
  }
}

export async function setTheme(theme: Theme): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.THEME, theme);
  } catch { /* ignore */ }
}
