import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Language, ACCENT_COLORS, type AccentColorKey, type ThemeMode } from '@/lib/storage/settingsStore';
import { notifyThemeChange } from '@/hooks/use-color-scheme';
import { useOTAStore } from '@/lib/updates/otaStore';
import { updateService } from '@/lib/updates/updateService';
import { UpdateModal } from '@/components/UpdateModal';

const LANGUAGES: { id: Language; label: Record<string, string> }[] = [
  { id: 'vi', label: { vi: 'Tiếng Việt', en: 'Vietnamese' } },
  { id: 'en', label: { vi: 'Tiếng Anh', en: 'English' } },
];

function PillOption({ label, selected, onSelect }: {
  label: string; selected: boolean; onSelect: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pillOption,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        selected && { backgroundColor: theme.colors.selectedContainer, borderColor: theme.colors.primary, borderWidth: 2 },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onSelect}
    >
      <Text style={[
        styles.pillLabel, { color: theme.colors.text },
        selected && { color: theme.colors.primary, fontWeight: '700' as const },
      ]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { themeMode, accentColor, setThemeMode, setAccentColor: setThemeAccent } = useTheme();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);

  const [language, setLanguageState] = useState<Language>('vi');

  const [pushEnabled, setPushEnabled] = useState(user?.preferences?.pushEnabled !== false);
  const [emailEnabled, setEmailEnabled] = useState(user?.preferences?.emailEnabled !== false);

  // Sync toggles when AuthContext.user changes (e.g. after login)
  useEffect(() => {
    setPushEnabled(user?.preferences?.pushEnabled !== false);
    setEmailEnabled(user?.preferences?.emailEnabled !== false);
  }, [user?.preferences?.pushEnabled, user?.preferences?.emailEnabled]);

  const handleLanguageChange = async (lang: Language) => {
    setLanguageState(lang);
    await setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleThemeModeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    await notifyThemeChange(mode);
  };

  const handleAccentColorChange = async (colorKey: AccentColorKey) => {
    await setThemeAccent(colorKey);
  };

  const handleToggleNotification = async (key: 'pushEnabled' | 'emailEnabled', value: boolean) => {
    const prev = key === 'pushEnabled' ? pushEnabled : emailEnabled;
    if (key === 'pushEnabled') setPushEnabled(value);
    else setEmailEnabled(value);
    try {
      await apiRequest('/auth/preferences', {
        method: 'PATCH',
        body: { preferences: { [key]: value } },
      });
      await refreshUser();
    } catch {
      if (key === 'pushEnabled') setPushEnabled(prev);
      else setEmailEnabled(prev);
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt thông báo');
    }
  };

  const { hasUpdate, isDownloaded, isChecking } = useOTAStore();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  return (
    <Animated.View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('settings:title')}</Text>
        </View>

        {/* Language */}
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>{t('settings:language')}</Text>
        <View style={styles.pillRow}>
          {LANGUAGES.map(l => (
            <PillOption key={l.id} label={l.label[i18n.language] || l.label.vi} selected={language === l.id} onSelect={() => handleLanguageChange(l.id)} />
          ))}
        </View>

        {/* Theme Mode */}
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>{t('settings:theme')}</Text>
        <View style={styles.pillRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map(m => {
            const labelMap: Record<ThemeMode, string> = {
              light: t('settings:light'),
              dark: t('settings:dark'),
              system: t('settings:system'),
            };
            return (
              <PillOption key={m} label={labelMap[m]} selected={themeMode === m} onSelect={() => handleThemeModeChange(m)} />
            );
          })}
        </View>

        {/* Accent Color */}
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>{t('settings:accentColor')}</Text>
        <View style={styles.accentRow}>
          {(Object.keys(ACCENT_COLORS) as AccentColorKey[]).map(key => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.accentCircle,
                { backgroundColor: ACCENT_COLORS[key] },
                accentColor === key && styles.accentCircleSelected,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => handleAccentColorChange(key)}
            >
              {accentColor === key && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Software Updates */}
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>BẢN CẬP NHẬT ÚNG DỤNG</Text>
        <View style={[styles.toggleGroup, { backgroundColor: theme.colors.card, marginBottom: 28 }]}>
          <Pressable
            style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
            onPress={() => {
              updateService.checkAndPreDownloadOTA(true);
              setShowUpdateModal(true);
            }}
          >
            <Ionicons name="cloud-download-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Kiểm tra cập nhật</Text>
            {isDownloaded || hasUpdate ? (
              <View style={styles.updateBadge}>
                <Text style={styles.updateBadgeText}>Sẵn sàng cập nhật</Text>
              </View>
            ) : isChecking ? (
              <Text style={[styles.statusText, { color: theme.colors.muted }]}>Đang kiểm tra...</Text>
            ) : (
              <Text style={[styles.statusText, { color: theme.colors.muted }]}>Phiên bản mới nhất</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>{t('settings:notifications')}</Text>
        <View style={[styles.toggleGroup, { backgroundColor: theme.colors.card }]}>
          <Pressable
            style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
            onPress={() => handleToggleNotification('pushEnabled', !pushEnabled)}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{t('settings:push')}</Text>
            <View style={[styles.toggleSwitch, pushEnabled && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, pushEnabled && styles.toggleThumbOn]} />
            </View>
          </Pressable>
          <View style={[styles.toggleDivider, { backgroundColor: theme.colors.border }]} />
          <Pressable
            style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
            onPress={() => handleToggleNotification('emailEnabled', !emailEnabled)}
          >
            <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{t('settings:email')}</Text>
            <View style={[styles.toggleSwitch, emailEnabled && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, emailEnabled && styles.toggleThumbOn]} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <UpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },
  pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 28 },
  pillOption: {
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center',
  },
  pillLabel: { fontSize: 13, fontWeight: '600' },
  toggleGroup: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  toggleSwitch: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#E5E7EB', padding: 2,
  },
  toggleSwitchOn: { backgroundColor: '#34C759' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'white', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleDivider: { height: 1, marginLeft: 52 },
  accentRow: {
    flexDirection: 'row', gap: 16, marginBottom: 28, justifyContent: 'center',
  },
  accentCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  accentCircleSelected: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 3, borderColor: 'white',
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  updateBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  updateBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
