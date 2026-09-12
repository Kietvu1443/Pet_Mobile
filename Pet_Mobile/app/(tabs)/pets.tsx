// MyPetsScreen — Màn hình Thú cưng của tôi.
//
// Nguồn dữ liệu:
//   - ownPets      <- GET /api/v1/user-pets/my (Backend LIVE, cô lập theo user đăng nhập)
//   - nearbyShelters <- mockAdapter (Gợi ý trại gần bạn)
//
// Navigation:
//   - Thêm thú cưng -> /add-pet
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

import { useUnreadNotifications } from '@/lib/notifications/unread';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme/ThemeContext';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import {
  fetchMyPets,
  formatAgeFromBirthDate,
  type UserPet,
} from '@/lib/api/userPets';
import { InlinePlaceMap } from '@/components/map/InlinePlaceMap';

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <Ionicons name="paw" size={38} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTag, { color: theme.colors.primary }]}>Bắt đầu nào</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Chưa có thú cưng nào</Text>
      <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
        Thêm thú cưng của bạn để quản lý thông tin, theo dõi cân nặng và chăm sóc các bé dễ dàng hơn.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.addBigBtn,
          { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
          pressed && { opacity: 0.85 },
        ]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addBigBtnText}>Thêm thú cưng</Text>
      </Pressable>
    </View>
  );
}

function UserPetCard({ pet, onPress }: { pet: UserPet; onPress: () => void }) {
  const { theme } = useTheme();
  const avatarUrl = resolveImageUrl(pet.image_url) || (pet.images && pet.images.length > 0 ? resolveImageUrl(pet.images[0].image_path) : null);
  const ageDisplay = formatAgeFromBirthDate(pet.birth_date);
  const genderText = pet.gender === 'male' ? 'Đực' : pet.gender === 'female' ? 'Cái' : '--';
  const weightText = pet.weight ? `${pet.weight} kg` : '--';
  const colorText = pet.color || '--';
  const breedText = pet.breed || (pet.species === 'cat' ? 'Mèo' : pet.species === 'dog' ? 'Chó' : 'Thú cưng');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.petCard,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
    >
      {/* Image area */}
      <View style={styles.petImageWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.petImage} resizeMode="cover" />
        ) : (
          <View style={[styles.petImagePlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={{ fontSize: 60 }}>
              {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
            </Text>
          </View>
        )}
        <View style={styles.petImageGradient} />

        {/* Vaccinated badge */}
        {Boolean(pet.vaccinated) && (
          <View style={[styles.vaccinatedBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.vaccinatedText}>✓ Đã tiêm phòng</Text>
          </View>
        )}

        {/* Name overlay */}
        <View style={styles.petNameOverlay}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreedAge}>{breedText} · {ageDisplay}</Text>
        </View>
      </View>

      {/* Detail chips */}
      <View style={styles.petChipsRow}>
        {[
          { label: 'Giới tính', value: genderText },
          { label: 'Cân nặng', value: weightText },
          { label: 'Màu lông', value: colorText },
        ].map((item) => (
          <View key={item.label} style={[styles.petChip, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.petChipLabel, { color: theme.colors.muted }]}>{item.label}</Text>
            <Text style={[styles.petChipValue, { color: theme.colors.text }]} numberOfLines={1}>{item.value}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function MyPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['tabs', 'common']);
  const { unread } = useUnreadNotifications();
  const { theme } = useTheme();

  const [pets, setPets] = useState<UserPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

  const loadPets = useCallback(async () => {
    try {
      const data = await fetchMyPets();
      setPets(data);
    } catch (error) {
      console.error('Failed to fetch user pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tự động tải lại danh sách mỗi khi màn hình được focus (vd sau khi thêm pet thành công)
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPets();
  };

  const hasPets = pets.length > 0;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 120 },
      ]}
      scrollEnabled={parentScrollEnabled}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTag, { color: theme.colors.primary }]}>Quản lý thú cưng</Text>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('tabs:pets')}</Text>
            {hasPets && (
              <Text style={[styles.headerCount, { color: theme.colors.muted }]}>· {pets.length} bé</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={18} color={theme.colors.text} />
            {unread > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.notifBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.addIconBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
            onPress={() => router.push('/add-pet' as Parameters<typeof router.push>[0])}
          >
            <Ionicons name="add" size={22} color="white" />
          </Pressable>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : !hasPets ? (
        <EmptyState onAdd={() => router.push('/add-pet' as Parameters<typeof router.push>[0])} />
      ) : (
        <>
          {pets.map((pet) => (
            <UserPetCard
              key={pet.id}
              pet={pet}
              onPress={() => router.push({ pathname: '/user-pet/[id]', params: { id: String(pet.id) } })}
            />
          ))}

          {/* Add more dashed button */}
          <Pressable
            style={({ pressed }) => [styles.addMoreBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/add-pet' as Parameters<typeof router.push>[0])}
          >
            <View style={[styles.addMoreIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="add" size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>Thêm thú cưng mới</Text>
          </Pressable>
        </>
      )}

      {/* Khám phá gần bạn (Community Places Map) */}
      <View style={[styles.sheltersSection, { marginTop: hasPets ? 20 : 32 }]}>
        <View style={styles.sheltersSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.sheltersSectionTitle, { color: theme.colors.text }]}>
              Khám phá gần bạn
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              hitSlop={8}
              onPress={() => router.push('/add-place' as any)}
            >
              <Text style={[styles.sheltersSeeAll, { color: theme.colors.primary, fontWeight: '700' }]}>
                + Đóng góp
              </Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => router.push('/places-map' as any)}
            >
              <Text style={[styles.sheltersSeeAll, { color: theme.colors.primary }]}>
                Xem tất cả ↗
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Inline Map Component */}
        <InlinePlaceMap
          onOpenFullscreen={() => router.push('/places-map' as any)}
          onTouchMap={(isInteracting) => setParentScrollEnabled(!isInteracting)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24 },
  // Header
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
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: 'white', fontSize: 10, fontWeight: '800',
  },
  addIconBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40, shadowRadius: 10, elevation: 6,
  },
  // Empty state
  emptyCard: {
    borderRadius: 28, padding: 40,
    alignItems: 'center', textAlign: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
    borderWidth: 1.5, marginTop: 12,
  },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTag: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 22, fontWeight: '800',
    marginBottom: 10, lineHeight: 28, textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14, lineHeight: 22, textAlign: 'center',
    maxWidth: 280, marginBottom: 28,
  },
  addBigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 18,
    paddingHorizontal: 36, paddingVertical: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  addBigBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  // Pet card
  petCard: {
    borderRadius: 28, overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 8,
    borderWidth: 1,
  },
  petImageWrap: { position: 'relative', height: 240 },
  petImage: { width: '100%', height: '100%' },
  petImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  petImageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  vaccinatedBadge: {
    position: 'absolute', top: 16, left: 16,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
  },
  vaccinatedText: { color: 'white', fontSize: 12, fontWeight: '600' },
  petNameOverlay: { position: 'absolute', bottom: 16, left: 16 },
  petName: { color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  petBreedAge: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '500' },
  petChipsRow: {
    flexDirection: 'row', gap: 10, padding: 16,
  },
  petChip: {
    flex: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  petChipLabel: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  petChipValue: { fontSize: 14, fontWeight: '700' },
  // Add more
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 24, paddingVertical: 18,
    marginBottom: 12,
  },
  addMoreIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 15, fontWeight: '600' },
  // Shelters
  sheltersSection: { marginBottom: 24 },
  sheltersSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheltersSectionTitle: { fontSize: 18, fontWeight: '700' },
  sheltersSeeAll: { fontSize: 14, fontWeight: '600' },
  shelterCard: {
    flexShrink: 0, width: 155,
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  shelterImageWrap: { height: 100, position: 'relative' },
  shelterImage: { width: '100%', height: '100%' },
  shelterDistBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  shelterDist: { color: 'white', fontSize: 11, fontWeight: '600' },
  shelterInfo: { padding: 14 },
  shelterName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  shelterPets: { fontSize: 12 },
});
