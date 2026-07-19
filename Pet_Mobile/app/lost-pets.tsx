// LostPetsScreen — Màn hình thú cưng bị thất lạc.
//
// Nguồn dữ liệu:
//   - lostPets <- GET /api/v1/reports (backend, LIVE)
//
// API contract (reportApiV1Controller.js):
//   GET /reports -> { reports: [ { id, type: 'lost'|'found', description, location,
//                                   created_at, status, reporter_name, images[] } ] }
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

// Raw shape from GET /api/v1/reports
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

// UI model
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

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Centralised fetch callback — used for both initial mount and pull-to-refresh
  const loadReports = useCallback(async () => {
    const data = await apiRequest<ReportsResponse>('/reports');
    setReports((data.reports ?? []).map(adaptReport));
  }, []);

  // Initial mount: load, then clear loading flag
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

  // Pull-to-refresh with error alert; preserves existing data on failure
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
    { id: 'all',   label: 'Tất cả' },
    { id: 'lost',  label: 'Thất lạc' },
    { id: 'found', label: 'Đã tìm thấy' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </Pressable>
          <View>
            <Text style={styles.headerTag}>Cùng tìm về nhà</Text>
            <Text style={styles.headerTitle}>Tìm bé bị thất lạc</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="search-outline" size={18} color="#888" />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="options-outline" size={18} color="#888" />
          </Pressable>
        </View>
      </View>

      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <View style={styles.alertIcon}>
          <Ionicons name="warning" size={18} color="#FFB340" />
        </View>
        <View>
          <Text style={styles.alertTitle}>{lostCount} bé đang thất lạc trong khu vực bạn</Text>
          <Text style={styles.alertDesc}>Nếu bạn gặp những bé này, hãy liên hệ với chủ nhân ngay nhé!</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_LABELS.map(({ id, label }, i) => (
          <Pressable
            key={id}
            style={[styles.filterChip, filter === id && styles.filterChipActive]}
            onPress={() => setFilter(id)}
          >
            <Text style={[styles.filterChipText, filter === id && styles.filterChipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Pet List */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#FFB340" />
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ color: '#888', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 }}>
            Không có kết quả
          </Text>
          <Text style={{ fontSize: 14, color: '#888' }}>Không tìm thấy bé nào trong mục này.</Text>
        </View>
      ) : (
        filtered.map((pet, i) => (
          <Pressable
            key={pet.id}
            style={({ pressed }) => [
              styles.reportCard,
              { borderColor: pet.type === 'lost' ? '#FFECD0' : '#D6F5E0' },
              pressed && { opacity: 0.85 },
            ]}
          >
            {pet.image ? (
              <Image source={{ uri: pet.image }} style={styles.reportImage} />
            ) : (
              <View style={[styles.reportImage, styles.reportImagePlaceholder]}>
                <Ionicons name="paw" size={28} color="#CCCCCC" />
              </View>
            )}
            <View style={styles.reportInfo}>
              <View style={styles.reportBadgeRow}>
                <View style={[
                  styles.reportTypeBadge,
                  { backgroundColor: pet.type === 'lost' ? '#FFF4E0' : '#E8F8EE' },
                ]}>
                  <Text style={[
                    styles.reportTypeBadgeText,
                    { color: pet.type === 'lost' ? '#FFB340' : '#34C759' },
                  ]}>
                    {pet.type === 'lost' ? '⚠ Thất lạc' : '✓ Đã tìm thấy'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportName}>{pet.name}</Text>
              <View style={styles.reportMetaRow}>
                <Ionicons name="location-outline" size={11} color="#888" />
                <Text style={styles.reportLocation} numberOfLines={1}>{pet.location}</Text>
              </View>
              <View style={styles.reportMetaRow}>
                <Ionicons name="calendar-outline" size={11} color="#BBBBBB" />
                <Text style={styles.reportDate}>{pet.date}</Text>
              </View>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: pet.type === 'lost' ? '#FFB340' : '#34C759' },
            ]} />
          </Pressable>
        ))
      )}

      {/* Report button */}
      <Pressable
        style={({ pressed }) => [styles.reportBtn, pressed && { opacity: 0.85 }]}
        // TODO: navigate to report creation flow when backend supports POST /reports
        onPress={() => Alert.alert('Đang phát triển', 'Tính năng báo cáo thất lạc đang được phát triển')}
      >
        <Ionicons name="warning" size={20} color="white" />
        <Text style={styles.reportBtnText}>Báo cáo thú cưng thất lạc</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9FC' },
  content: { paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTag: {
    color: '#FFB340', fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  alertBanner: {
    borderRadius: 20, padding: 16, marginBottom: 20,
    backgroundColor: '#FFF8E8', borderWidth: 1.5, borderColor: '#FFE5A0',
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  alertIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#FFB340', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20, shadowRadius: 4, elevation: 3,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  alertDesc: { fontSize: 12, color: '#888', lineHeight: 18 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterChip: {
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  filterChipActive: { backgroundColor: '#1A1A1A', shadowOpacity: 0 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: 'white' },
  // Report card
  reportCard: {
    backgroundColor: 'white', borderRadius: 22, padding: 18, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  reportImage: { width: 80, height: 80, borderRadius: 18, flexShrink: 0 },
  reportImagePlaceholder: {
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  reportInfo: { flex: 1, minWidth: 0 },
  reportBadgeRow: { marginBottom: 5 },
  reportTypeBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  reportTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  reportName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  reportMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  reportLocation: { fontSize: 12, color: '#888', flex: 1 },
  reportDate: { fontSize: 12, color: '#BBBBBB' },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginRight: 4,
  },
  // Report button
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFB340', borderRadius: 20, paddingVertical: 18,
    marginTop: 22,
    shadowColor: '#FFB340', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
  },
  reportBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
