// BestMatchSelectorScreen — "Best Match của tôi".
//
// Mở khi người dùng bấm vòng Best Match trên avatar ở màn Hồ sơ.
// Một người dùng có thể có nhiều Best Match (mỗi thú cưng một hành trình
// riêng), nên màn này luôn hiển thị DANH SÁCH để người dùng tự chọn —
// không tự động mở một hành trình ngẫu nhiên.
//
// Nguồn dữ liệu: GET /api/v1/best-matches (lib/api/bestMatches.ts)
//
// Cố tình KHÔNG hiển thị: % tương thích, confidence, điểm số, xếp hạng
// giữa các thú cưng. Mỗi hành trình đều bình đẳng như nhau.
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

import { useTheme } from '@/lib/theme/ThemeContext';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import {
  fetchMyBestMatches,
  formatJourneyDuration,
  type BestMatchSummary,
} from '@/lib/api/bestMatches';

function daysSince(iso: string): number {
  const start = new Date(iso).getTime();
  if (isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

function BestMatchCard({ item, onPress }: { item: BestMatchSummary; onPress: () => void }) {
  const { theme } = useTheme();
  const avatarUrl = resolveImageUrl(item.pet_avatar);
  const durationLabel = formatJourneyDuration(daysSince(item.started_at));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={{ fontSize: 26 }}>🐾</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={[styles.petName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.pet_name}
        </Text>
        <View style={styles.rowInline}>
          <Ionicons name="infinite" size={12} color="#D98F2B" />
          <Text style={[styles.bestMatchLabel, { color: '#D98F2B' }]}>
            Best Match{item.pet_type ? ` · ${item.pet_type}` : ''}
          </Text>
        </View>
        <Text style={[styles.durationText, { color: theme.colors.muted }]}>
          Cùng nhau được {durationLabel}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

function EmptyState() {
  const { theme } = useTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <Ionicons name="infinite" size={34} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Hành trình sẽ bắt đầu ở đây</Text>
      <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
        Best Match của bạn sẽ xuất hiện ngay sau khi một cuộc nhận nuôi được chính thức duyệt.
        Không cần làm gì thêm — hành trình sẽ tự nhiên bắt đầu.
      </Text>
    </View>
  );
}

export default function BestMatchSelectorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [items, setItems] = useState<BestMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchMyBestMatches();
      setItems(data);
    } catch (err: any) {
      console.error('Fetch best matches error:', err);
      setError(err.message || 'Không thể tải danh sách Best Match.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Best Match của tôi</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Không thể tải dữ liệu</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>{error}</Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setLoading(true);
                load();
              }}
            >
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => (
            <BestMatchCard
              key={item.id}
              item={item}
              onPress={() =>
                router.push({ pathname: '/best-match/[id]', params: { id: String(item.id) } } as any)
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 18 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, minWidth: 0, gap: 3 },
  petName: { fontSize: 16, fontWeight: '800' },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bestMatchLabel: { fontSize: 12, fontWeight: '700' },
  durationText: { fontSize: 12.5 },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 18, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  retryBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
