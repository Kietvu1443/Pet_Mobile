// LostPetsScreen — Màn hình thú cưng bị thất lạc.
//
// Nguồn dữ liệu:
//   - lostPets <- GET /api/v1/reports (backend, LIVE)
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiRequest } from '@/lib/api/client';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type RawReport = {
  id: number;
  type: 'lost' | 'found';
  description?: string | null;
  location?: string | null;
  created_at?: string | null;
  status?: string | null;
  reporter_name?: string | null;
  images?: Array<{ image_path: string }>;
  pet_name?: string | null;
  breed?: string | null;
  color?: string | null;
  gender?: string | null;
};

type ReportsResponse = {
  reports: RawReport[];
};

type ReportItem = {
  id: number;
  type: 'lost' | 'found';
  name: string;
  image: string | null;
  location: string;
  date: string;
  breed: string;
  color: string;
  gender: string;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '--';
  }
}

function adaptReport(r: RawReport): ReportItem {
  const image =
    r.images && r.images.length > 0
      ? resolveImageUrl(r.images[0].image_path)
      : null;
  return {
    id: r.id,
    type: r.type,
    name: r.pet_name ?? r.description?.split(' ').slice(0, 3).join(' ') ?? 'Không rõ',
    image,
    location: r.location ?? 'Chưa có địa chỉ',
    date: formatDate(r.created_at),
    breed: r.breed ?? 'Không rõ giống',
    color: r.color ?? '',
    gender: r.gender ?? '',
  };
}

type FilterType = 'all' | 'lost' | 'found';

export default function LostPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation(['lostPets', 'common']);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    const data = await apiRequest<ReportsResponse>('/reports');
    setReports((data.reports ?? []).map(adaptReport));
  }, []);

  useEffect(() => {
    let alive = true;
    loadReports()
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [loadReports]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadReports();
      setError(null);
    } catch (e) {
      Alert.alert('Lỗi làm mới', e instanceof Error ? e.message : 'Không thể tải dữ liệu');
    } finally {
      setRefreshing(false);
    }
  }, [loadReports]);

  const lostCount = reports.filter((r) => r.type === 'lost').length;
  const filtered = reports.filter((r) => {
    if (filter === 'lost')  return r.type === 'lost';
    if (filter === 'found') return r.type === 'found';
    return true;
  });

  const FILTER_LABELS: { id: FilterType; label: string }[] = [
    { id: 'all',   label: t('lostPets:filterAll') },
    { id: 'lost',  label: t('lostPets:filterLost') },
    { id: 'found', label: t('lostPets:filterFound') },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 40 },
      ]}
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTag, { color: theme.colors.warning }]}>{t('lostPets:headerTag')}</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('lostPets:headerTitle')}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.text} />
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="options-outline" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Alert Banner */}
      <View style={[styles.alertBanner, { backgroundColor: theme.colors.warningContainer, borderColor: theme.colors.warning }]}>
        <View style={[styles.alertIcon, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="warning" size={18} color={theme.colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{t('lostPets:alertTitle', { count: lostCount })}</Text>
          <Text style={[styles.alertDesc, { color: theme.colors.muted }]}>{t('lostPets:alertDesc')}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_LABELS.map(({ id, label }) => {
          const isActive = filter === id;
          return (
            <Pressable
              key={id}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? theme.colors.primary : theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => setFilter(id)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? 'white' : theme.colors.text }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Pet List */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.warning} />
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>
            {t('lostPets:emptyTitle')}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.muted }}>{t('lostPets:emptyDesc')}</Text>
        </View>
      ) : (
        filtered.map((pet) => (
          <Pressable
            key={pet.id}
            style={({ pressed }) => [
              styles.reportCard,
              { backgroundColor: theme.colors.card, borderColor: pet.type === 'lost' ? theme.colors.warningContainer : theme.colors.successContainer },
              pressed && { opacity: 0.85 },
            ]}
          >
            {pet.image ? (
              <Image source={{ uri: pet.image }} style={styles.reportImage} />
            ) : (
              <View style={[styles.reportImage, { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="paw" size={28} color={theme.colors.muted} />
              </View>
            )}
            <View style={styles.reportInfo}>
              <View style={styles.reportBadgeRow}>
                <View style={[
                  styles.reportTypeBadge,
                  { backgroundColor: pet.type === 'lost' ? theme.colors.warningContainer : theme.colors.successContainer },
                ]}>
                  <Text style={[
                    styles.reportTypeBadgeText,
                    { color: pet.type === 'lost' ? theme.colors.warning : theme.colors.success },
                  ]}>
                    {pet.type === 'lost' ? t('lostPets:badgeLost') : t('lostPets:badgeFound')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.reportName, { color: theme.colors.text }]}>{pet.name}</Text>
              <View style={styles.reportMetaRow}>
                <Ionicons name="location-outline" size={11} color={theme.colors.muted} />
                <Text style={[styles.reportLocation, { color: theme.colors.muted }]} numberOfLines={1}>{pet.location}</Text>
              </View>
              <View style={styles.reportMetaRow}>
                <Ionicons name="calendar-outline" size={11} color={theme.colors.muted} />
                <Text style={[styles.reportDate, { color: theme.colors.muted }]}>{pet.date}</Text>
              </View>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: pet.type === 'lost' ? theme.colors.warning : theme.colors.success },
            ]} />
          </Pressable>
        ))
      )}

      {/* Report button */}
      <Pressable
        style={({ pressed }) => [styles.reportBtn, { backgroundColor: theme.colors.warning, shadowColor: theme.colors.warning }, pressed && { opacity: 0.85 }]}
        onPress={() => Alert.alert('Đang phát triển', 'Tính năng báo cáo thất lạc đang được phát triển')}
      >
        <Ionicons name="warning" size={20} color="white" />
        <Text style={styles.reportBtnText}>{t('lostPets:reportBtn')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTag: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  alertBanner: {
    borderRadius: 20, padding: 16, marginBottom: 20,
    borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  alertIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#FFB340', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20, shadowRadius: 4, elevation: 3,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  alertDesc: { fontSize: 12, lineHeight: 18 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  // Report card
  reportCard: {
    borderRadius: 22, padding: 18, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  reportImage: { width: 80, height: 80, borderRadius: 18, flexShrink: 0 },
  reportInfo: { flex: 1, minWidth: 0 },
  reportBadgeRow: { marginBottom: 5 },
  reportTypeBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  reportTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  reportName: { fontSize: 17, fontWeight: '800', marginBottom: 5 },
  reportMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  reportLocation: { fontSize: 12, flex: 1 },
  reportDate: { fontSize: 12 },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginRight: 4,
  },
  // Report button
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 20, paddingVertical: 18,
    marginTop: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
  },
  reportBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
