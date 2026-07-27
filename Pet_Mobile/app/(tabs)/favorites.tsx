// FavoritesScreen — Màn hình Đã lưu / Yêu thích.
//
// Nguồn dữ liệu:
//   - likedPets     <- GET /api/v1/favorites/my (backend)
//   - passedPets    <- mockAdapter (TODO: không có backend support)
//   - superLiked    <- mapped as standard liked from backend (no separate backend state)
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { fetchMyFavorites, type RawFavorite } from '@/lib/api/favorites';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type FilterType = 'all' | 'liked' | 'superliked' | 'passed';

type FavItem = {
  id: number;
  name: string;
  image: string | null;
  type: 'liked' | 'superliked' | 'passed';
  breed?: string;
  age?: string;
  location?: string;
  verified?: boolean;
};

function getMockPassedPets(): FavItem[] {
  return [];
}

function FavoriteCard({ item }: { item: FavItem }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation(['favorites', 'common']);

  const badgeConfig = {
    liked:      { label: t('favorites:badgeLiked'),      bg: theme.colors.primary, color: 'white' },
    superliked: { label: t('favorites:badgeSuperliked'), bg: '#3A7AFE', color: 'white' },
    passed:     { label: t('favorites:badgePassed'),     bg: 'rgba(0,0,0,0.55)', color: 'white' },
  }[item.type];

  const date = '--';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.favCard,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.favImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.favImage} />
        ) : (
          <View style={[styles.favImage, { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="paw" size={32} color={theme.colors.muted} />
          </View>
        )}
        <View style={styles.favGradient} />

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: badgeConfig.bg }]}>
          <Text style={[styles.typeBadgeText, { color: badgeConfig.color }]}>{badgeConfig.label}</Text>
        </View>

        {/* Date badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{date}</Text>
        </View>

        {/* Pet name overlay */}
        <View style={styles.favNameOverlay}>
          <Text style={styles.favPetName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {item.breed || item.age ? (
              <Text style={styles.favPetBreed}>
                {[item.breed, item.age].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {item.verified && <Ionicons name="checkmark-circle" size={10} color={theme.colors.success} />}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.favFooter}>
        {item.location ? (
          <View style={styles.favLocationRow}>
            <Ionicons name="location-outline" size={11} color={theme.colors.muted} />
            <Text style={[styles.favLocation, { color: theme.colors.muted }]} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : (
          <View style={styles.favLocationRow} />
        )}

        {item.type === 'passed' ? (
          <Pressable style={[styles.restoreBtn, { backgroundColor: theme.colors.text }]}>
            <Ionicons name="refresh" size={13} color="white" />
            <Text style={styles.restoreBtnText}>{t('common:restore', { defaultValue: 'Khôi phục' })}</Text>
          </Pressable>
        ) : (
          <View style={styles.favActions}>
            <Pressable style={[styles.detailBtn, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.detailBtnText, { color: theme.colors.text }]}>{t('favorites:detailBtn')}</Text>
            </Pressable>
            <Pressable style={[styles.heartBtn, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="heart" size={15} color={theme.colors.primary} />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation(['favorites', 'tabs', 'common']);
  const [filter, setFilter] = useState<FilterType>('all');
  const [likedItems, setLikedItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const passedItems: FavItem[] = getMockPassedPets();
  const superLikedItems: FavItem[] = [];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMyFavorites()
      .then((res) => {
        if (!alive) return;
        const mapped: FavItem[] = res.favorites.map((f: RawFavorite) => ({
          id: f.id,
          name: f.name ?? 'Thú cưng',
          image: f.image ? resolveImageUrl(f.image) : null,
          type: 'liked',
        }));
        setLikedItems(mapped);
      })
      .catch(() => {
        if (alive) setLikedItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const allSaved: FavItem[] = [...likedItems, ...superLikedItems, ...passedItems];

  const filtered = allSaved.filter((item) => {
    if (filter === 'liked')      return item.type === 'liked';
    if (filter === 'superliked') return item.type === 'superliked';
    if (filter === 'passed')     return item.type === 'passed';
    return true;
  });

  const statCards = [
    { Icon: 'heart' as const, color: theme.colors.primary, bg: theme.colors.primaryContainer, count: likedItems.length, label: t('favorites:likedCount') },
    { Icon: 'star' as const, color: '#3A7AFE', bg: '#3A7AFE1A', count: superLikedItems.length, label: t('favorites:superlikedCount') },
    { Icon: 'close' as const, color: theme.colors.muted, bg: theme.colors.surface, count: passedItems.length, label: t('favorites:passedCount') },
  ];

  const filterOptions = [
    { id: 'all' as FilterType, label: t('favorites:filterAll'), count: allSaved.length },
    { id: 'liked' as FilterType, label: t('favorites:filterLiked'), count: likedItems.length },
    { id: 'superliked' as FilterType, label: t('favorites:filterSuperliked'), count: superLikedItems.length },
    { id: 'passed' as FilterType, label: t('favorites:passedCount'), count: passedItems.length },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTag, { color: theme.colors.primary }]}>{t('tabs:favorites')}</Text>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('favorites:title')}</Text>
            <Text style={[styles.headerCount, { color: theme.colors.muted }]}>·· {t('favorites:petCount', { count: allSaved.length })}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="chevron-down" size={18} color={theme.colors.text} />
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        {statCards.map(({ Icon, color, bg, count, label }) => (
          <View key={label} style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
              <Ionicons name={Icon} size={18} color={color} />
            </View>
            <Text style={[styles.statCount, { color }]}>{count}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 2, marginBottom: 20 }}
      >
        {filterOptions.map((f) => {
          const isActive = filter === f.id;
          return (
            <Pressable
              key={f.id}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? theme.colors.primary : theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterChipText, { color: isActive ? 'white' : theme.colors.text }]}>
                {f.label}
              </Text>
              {f.count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.colors.surface }]}>
                  <Text style={[styles.filterCountText, { color: isActive ? 'white' : theme.colors.muted }]}>
                    {f.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pet Grid */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="heart-outline" size={34} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('favorites:emptyTitle')}</Text>
          <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>{t('favorites:emptyDesc')}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((item) => (
            <FavoriteCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 24,
  },
  headerTag: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
  headerCount: { fontSize: 16, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 22,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statCount: { fontSize: 22, fontWeight: '800', marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  // Filter chips
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    flexShrink: 0,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  filterCount: {
    borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 1,
  },
  filterCountText: { fontSize: 12, fontWeight: '700' },
  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
  },
  favCard: {
    width: '47%', borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09, shadowRadius: 14, elevation: 6,
    borderWidth: 1,
  },
  favImageWrap: { position: 'relative', height: 160 },
  favImage: { width: '100%', height: '100%' },
  favGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  typeBadge: {
    position: 'absolute', top: 10, left: 10,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  dateBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  dateBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
  favNameOverlay: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  favPetName: { color: 'white', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  favPetBreed: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  favFooter: { padding: 12 },
  favLocationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10,
  },
  favLocation: {
    fontSize: 11, flex: 1, overflow: 'hidden',
  },
  restoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 9, width: '100%',
  },
  restoreBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  favActions: { flexDirection: 'row', gap: 8 },
  detailBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 9,
    alignItems: 'center',
  },
  detailBtnText: { fontSize: 12, fontWeight: '600' },
  heartBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
