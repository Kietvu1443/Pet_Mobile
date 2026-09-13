// AdoptCatalogScreen — Danh mục duyệt thú cưng nhận nuôi chuẩn Mobile (2 cột, bộ lọc, tìm kiếm, Infinite Scroll).
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useTheme } from '@/lib/theme/ThemeContext';
import { fetchPets, type PetItem } from '@/lib/api/pets';
import { resolveImageUrl } from '@/lib/images/resolveUrl';

type SpeciesFilter = 'all' | 'Chó' | 'Mèo' | 'Khác';

const SPECIES_CHIPS: { id: SpeciesFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Chó', label: '🐶 Chó' },
  { id: 'Mèo', label: '🐱 Mèo' },
  { id: 'Khác', label: '🐾 Khác' },
];

function PetCatalogCard({ pet, onPress }: { pet: PetItem; onPress: () => void }) {
  const { theme } = useTheme();
  const imageUrl = resolveImageUrl(
    pet.avatar_image || pet.image_url || (pet.images && pet.images[0]?.image_path),
  );

  const genderIcon =
    pet.gender === 'Đực' || pet.gender === 'male' ? '♂️' :
    pet.gender === 'Cái' || pet.gender === 'female' ? '♀️' : '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      {/* Image Container */}
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.petImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.petImagePlaceholder,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Ionicons name="paw" size={32} color={theme.colors.primary} />
          </View>
        )}

        {/* Species Tag */}
        <View style={styles.speciesTag}>
          <Text style={styles.speciesTagText}>{pet.pet_type || 'Thú cưng'}</Text>
        </View>

        {/* Gender icon badge */}
        {Boolean(genderIcon) && (
          <View style={styles.genderBadge}>
            <Text style={styles.genderBadgeText}>{genderIcon}</Text>
          </View>
        )}
      </View>

      {/* Info Content */}
      <View style={styles.cardBody}>
        <Text style={[styles.petName, { color: theme.colors.text }]} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={[styles.petMeta, { color: theme.colors.muted }]} numberOfLines={1}>
          {[pet.breed, pet.age].filter(Boolean).join(' · ') || 'Chờ bạn đón về'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
            <Text style={[styles.locationText, { color: theme.colors.muted }]} numberOfLines={1}>
              TP.HCM
            </Text>
          </View>

          {Boolean(pet.likesCount && pet.likesCount > 0) && (
            <View style={styles.likesBadge}>
              <Ionicons name="heart" size={11} color={theme.colors.primary} />
              <Text style={[styles.likesCountText, { color: theme.colors.primary }]}>
                {pet.likesCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function CatalogSkeleton({ count = 4 }: { count?: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.card,
            styles.skeletonCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.skeletonImage, { backgroundColor: theme.colors.surface }]} />
          <View style={{ padding: 12, gap: 8 }}>
            <View
              style={[
                styles.skeletonLine,
                { width: '70%', height: 16, backgroundColor: theme.colors.surface },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                { width: '90%', height: 12, backgroundColor: theme.colors.surface },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AdoptCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesFilter>('all');

  // Debounce search input 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['pets-catalog', selectedSpecies, debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchPets({
        status: 'available',
        species: selectedSpecies === 'all' ? undefined : selectedSpecies,
        search: debouncedSearch || undefined,
        page: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const allPets = useMemo(() => {
    return data?.pages.flatMap((page) => page.pets) || [];
  }, [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.colors.surface },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Nhận nuôi thú cưng
            </Text>
            <Text style={[styles.headerSub, { color: theme.colors.muted }]}>
              {allPets.length > 0 ? `${allPets.length} bé đang chờ bạn` : 'Danh mục thú cưng cứu hộ'}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Tìm theo tên, giống bé..."
            placeholderTextColor={theme.colors.muted}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {Boolean(searchInput) && (
            <Pressable onPress={() => setSearchInput('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Species Filter Chips */}
        <View style={styles.chipsRow}>
          {SPECIES_CHIPS.map((chip) => {
            const isActive = selectedSpecies === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedSpecies(chip.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? '#fff' : theme.colors.text },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Grid Content */}
      {isLoading ? (
        <CatalogSkeleton count={6} />
      ) : isError ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Không thể tải danh sách thú cưng
          </Text>
          <Text style={[styles.errorSub, { color: theme.colors.muted }]}>
            {error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={allPets}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PetCatalogCard
              pet={item}
              onPress={() =>
                router.push({
                  pathname: '/pet-detail',
                  params: { petId: String(item.id) },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Ionicons name="paw-outline" size={36} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Không tìm thấy bé nào
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.muted }]}>
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc loài khác nhé.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : !hasNextPage && allPets.length > 0 ? (
              <View style={styles.footerEnd}>
                <Text style={[styles.footerEndText, { color: theme.colors.muted }]}>
                  Đã hiển thị tất cả thú cưng có thể nhận nuôi
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    position: 'relative',
    height: 140,
    width: '100%',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speciesTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  speciesTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  genderBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBadgeText: {
    fontSize: 12,
  },
  cardBody: {
    padding: 10,
  },
  petName: {
    fontSize: 15,
    fontWeight: '800',
  },
  petMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likesCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    width: '48%',
    flex: 0,
  },
  skeletonImage: {
    height: 140,
    width: '100%',
  },
  skeletonLine: {
    borderRadius: 4,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerEnd: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: 12,
  },
});
