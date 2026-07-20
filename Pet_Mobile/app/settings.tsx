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
import { setLanguage, type Language, type Theme } from '@/lib/storage/settingsStore';
import { notifyThemeChange } from '@/hooks/use-color-scheme';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
];

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Sáng' },
  { id: 'dark', label: 'Tối' },
  { id: 'system', label: 'Theo hệ thống' },
];

function PillOption({ label, selected, onSelect }: {
  label: string; selected: boolean; onSelect: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pillOption, selected && styles.pillOptionSelected,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onSelect}
    >
      <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [language, setLanguageState] = useState<Language>('vi');
  const [theme, setThemeState] = useState<Theme>('system');
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
  };

  const handleThemeChange = async (th: Theme) => {
    setThemeState(th);
    await notifyThemeChange(th);
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

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>Ngôn ngữ</Text>
        <View style={styles.pillRow}>
          {LANGUAGES.map(l => (
            <PillOption key={l.id} label={l.label} selected={language === l.id} onSelect={() => handleLanguageChange(l.id)} />
          ))}
        </View>

        {/* Theme */}
        <Text style={styles.sectionLabel}>Giao diện</Text>
        <View style={styles.pillRow}>
          {THEMES.map(t => (
            <PillOption key={t.id} label={t.label} selected={theme === t.id} onSelect={() => handleThemeChange(t.id)} />
          ))}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Thông báo</Text>
        <View style={styles.toggleGroup}>
          <Pressable
            style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
            onPress={() => handleToggleNotification('pushEnabled', !pushEnabled)}
          >
            <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
            <Text style={styles.toggleLabel}>Thông báo đẩy</Text>
            <View style={[styles.toggleSwitch, pushEnabled && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, pushEnabled && styles.toggleThumbOn]} />
            </View>
          </Pressable>
          <View style={styles.toggleDivider} />
          <Pressable
            style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
            onPress={() => handleToggleNotification('emailEnabled', !emailEnabled)}
          >
            <Ionicons name="mail-outline" size={20} color="#1A1A1A" />
            <Text style={styles.toggleLabel}>Email thông báo</Text>
            <View style={[styles.toggleSwitch, emailEnabled && styles.toggleSwitchOn]}>
              <View style={[styles.toggleThumb, emailEnabled && styles.toggleThumbOn]} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F8' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAAAAA',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },
  pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 28 },
  pillOption: {
    backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center',
  },
  pillOptionSelected: { backgroundColor: '#FFF0F7', borderColor: '#FF4FA3', borderWidth: 2 },
  pillLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  pillLabelSelected: { fontWeight: '700', color: '#FF4FA3' },
  toggleGroup: {
    backgroundColor: 'white', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
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
  toggleDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 52 },
});
