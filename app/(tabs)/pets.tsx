// MyPetsScreen — Màn hình Thú cưng của tôi.
//
// Nguồn dữ liệu:
//   - ownPets      <- mockAdapter (TODO: GET /api/v1/pets/my khi backend hỗ trợ)
//   - nearbyShelters <- mockAdapter (TODO: GET /api/v1/shelters?lat=&lng=)
//
// Navigation:
//   - Thêm thú cưng -> /add-pet
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
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

import {
  getMockOwnPets,
  getMockNearbyShelters,
  type MockOwnPet,
  type MockShelter,
} from '@/adapters/mockAdapter';

const OWN_PETS: MockOwnPet[] = getMockOwnPets();
const NEARBY_SHELTERS: MockShelter[] = getMockNearbyShelters();

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
        Thêm thú cưng của bạn để quản lý thông tin và theo dõi các bé dễ dàng hơn.
      </Text>
      <Pressable style={({ pressed }) => [styles.addBigBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }, pressed && { opacity: 0.85 }]} onPress={onAdd}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addBigBtnText}>Thêm thú cưng</Text>
      </Pressable>
    </View>
  );
}

function PetCard({ pet }: { pet: MockOwnPet }) {
  const { theme } = useTheme();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.petCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* Image area */}
      <View style={styles.petImageWrap}>
        <Image source={{ uri: pet.image }} style={styles.petImage} />
        <View style={styles.petImageGradient} />

        {/* Top-right actions */}
        <View style={styles.petTopActions}>
          <Pressable
            style={[styles.petActionBtn, { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)' }]}
            onPress={() => setLiked((l) => !l)}
          >
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? theme.colors.primary : theme.colors.muted} />
          </Pressable>
          <Pressable style={[styles.petActionBtn, { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)' }]}>
            <Ionicons name="camera-outline" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>

        {/* Vaccinated badge */}
        {pet.vaccinated && (
          <View style={[styles.vaccinatedBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.vaccinatedText}>✓ Đã tiêm phòng</Text>
          </View>
        )}

        {/* Name overlay */}
        <View style={styles.petNameOverlay}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreedAge}>{pet.breed} · {pet.age}</Text>
        </View>
      </View>

      {/* Detail chips */}
      <View style={styles.petChipsRow}>
        {[
          { label: 'Giới tính', value: pet.gender },
          { label: 'Cân nặng', value: pet.weight },
          { label: 'Màu lông', value: pet.color },
        ].map((item) => (
          <View key={item.label} style={[styles.petChip, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.petChipLabel, { color: theme.colors.muted }]}>{item.label}</Text>
            <Text style={[styles.petChipValue, { color: theme.colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MyPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasPets = OWN_PETS.length > 0;
  const { t } = useTranslation(['tabs', 'common']);
  const { unread } = useUnreadNotifications();
  const { theme } = useTheme();

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
          <Text style={[styles.headerTag, { color: theme.colors.primary }]}>Xin chào, Kikiki 👋</Text>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('tabs:pets')}</Text>
            {hasPets && (
              <Text style={[styles.headerCount, { color: theme.colors.muted }]}>· {OWN_PETS.length} bé</Text>
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

      {!hasPets ? (
        <EmptyState onAdd={() => router.push('/add-pet' as Parameters<typeof router.push>[0])} />
      ) : (
        <>
          {OWN_PETS.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
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

      {/* Nearby Shelters */}
      <View style={[styles.sheltersSection, { marginTop: hasPets ? 8 : 32 }]}>
        <View style={styles.sheltersSectionHeader}>
          <Text style={[styles.sheltersSectionTitle, { color: theme.colors.text }]}>Trại gần bạn</Text>
          <Pressable>
            <Text style={[styles.sheltersSeeAll, { color: theme.colors.primary }]}>Xem tất cả</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        >
          {NEARBY_SHELTERS.map((s) => (
            <Pressable key={s.name} style={[styles.shelterCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.shelterImageWrap}>
                <Image source={{ uri: s.image }} style={styles.shelterImage} />
                <View style={styles.shelterDistBadge}>
                  <Ionicons name="location" size={10} color="white" />
                  <Text style={styles.shelterDist}>{s.dist}</Text>
                </View>
              </View>
              <View style={styles.shelterInfo}>
                <Text style={[styles.shelterName, { color: theme.colors.text }]}>{s.name}</Text>
                <Text style={[styles.shelterPets, { color: theme.colors.muted }]}>{s.pets} bé đang chờ</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
    borderRadius: 28, padding: 52,
    alignItems: 'center', textAlign: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
    borderWidth: 1.5, marginTop: 24,
  },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTag: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22, fontWeight: '800',
    marginBottom: 12, lineHeight: 28,
  },
  emptyDesc: {
    fontSize: 14, lineHeight: 22, textAlign: 'center',
    maxWidth: 260, marginBottom: 32,
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
  petImageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
    backgroundColor: 'transparent',
  },
  petTopActions: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  petActionBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  vaccinatedBadge: {
    position: 'absolute', top: 16, left: 16,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
  },
  vaccinatedText: { color: 'white', fontSize: 12, fontWeight: '600' },
  petNameOverlay: { position: 'absolute', bottom: 16, left: 16 },
  petName: { color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  petBreedAge: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
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
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 24, paddingVertical: 20,
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
