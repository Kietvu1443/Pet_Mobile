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

import {
  getMockOwnPets,
  getMockNearbyShelters,
  type MockOwnPet,
  type MockShelter,
} from '@/adapters/mockAdapter';

// TODO: Replace with real data from GET /api/v1/pets/my
const OWN_PETS: MockOwnPet[] = getMockOwnPets();
// TODO: Replace with GET /api/v1/shelters?lat=&lng= API call
const NEARBY_SHELTERS: MockShelter[] = getMockNearbyShelters();

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="paw" size={38} color="#FF83C4" />
      </View>
      <Text style={styles.emptyTag}>Bắt đầu nào</Text>
      <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
      <Text style={styles.emptyDesc}>
        Thêm thú cưng của bạn để quản lý thông tin và theo dõi các bé dễ dàng hơn.
      </Text>
      <Pressable style={({ pressed }) => [styles.addBigBtn, pressed && { opacity: 0.85 }]} onPress={onAdd}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addBigBtnText}>Thêm thú cưng</Text>
      </Pressable>
    </View>
  );
}

function PetCard({ pet }: { pet: MockOwnPet }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.petCard}>
      {/* Image area */}
      <View style={styles.petImageWrap}>
        <Image source={{ uri: pet.image }} style={styles.petImage} />
        <View style={styles.petImageGradient} />

        {/* Top-right actions */}
        <View style={styles.petTopActions}>
          <Pressable
            style={styles.petActionBtn}
            onPress={() => setLiked((l) => !l)}
          >
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#FF4FA3' : '#888'} />
          </Pressable>
          <Pressable style={styles.petActionBtn}>
            <Ionicons name="camera-outline" size={18} color="#888" />
          </Pressable>
        </View>

        {/* Vaccinated badge */}
        {pet.vaccinated && (
          <View style={styles.vaccinatedBadge}>
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
          <View key={item.label} style={styles.petChip}>
            <Text style={styles.petChipLabel}>{item.label}</Text>
            <Text style={styles.petChipValue}>{item.value}</Text>
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          {/* TODO: Replace 'Kikiki' with user.display_name from GET /auth/me */}
          <Text style={styles.headerTag}>Xin chào, Kikiki 👋</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Thú cưng</Text>
            {hasPets && (
              <Text style={styles.headerCount}>· {OWN_PETS.length} bé</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={18} color="#888" />
          </Pressable>
          <Pressable
            style={styles.addIconBtn}
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
          {/* TODO: Map over GET /api/v1/pets/my results when backend supports */}
          {OWN_PETS.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}

          {/* Add more dashed button */}
          <Pressable
            style={({ pressed }) => [styles.addMoreBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/add-pet' as Parameters<typeof router.push>[0])}
          >
            <View style={styles.addMoreIcon}>
              <Ionicons name="add" size={18} color="#FF4FA3" />
            </View>
            <Text style={styles.addMoreText}>Thêm thú cưng mới</Text>
          </Pressable>
        </>
      )}

      {/* Nearby Shelters */}
      {/* TODO: Replace with GET /api/v1/shelters?lat=&lng= */}
      <View style={[styles.sheltersSection, { marginTop: hasPets ? 8 : 32 }]}>
        <View style={styles.sheltersSectionHeader}>
          <Text style={styles.sheltersSectionTitle}>Trại gần bạn</Text>
          <Pressable>
            <Text style={styles.sheltersSeeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        >
          {NEARBY_SHELTERS.map((s) => (
            <Pressable key={s.name} style={styles.shelterCard}>
              <View style={styles.shelterImageWrap}>
                <Image source={{ uri: s.image }} style={styles.shelterImage} />
                <View style={styles.shelterDistBadge}>
                  <Ionicons name="location" size={10} color="white" />
                  <Text style={styles.shelterDist}>{s.dist}</Text>
                </View>
              </View>
              <View style={styles.shelterInfo}>
                <Text style={styles.shelterName}>{s.name}</Text>
                <Text style={styles.shelterPets}>{s.pets} bé đang chờ</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9FC' },
  content: { paddingHorizontal: 24 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 24,
  },
  headerTag: {
    color: '#FF4FA3', fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', lineHeight: 38 },
  headerCount: { fontSize: 16, color: '#888', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  addIconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FF4FA3',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40, shadowRadius: 10, elevation: 6,
  },
  // Empty state
  emptyCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 52,
    alignItems: 'center', textAlign: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
    borderWidth: 1.5, borderColor: '#F5E8F0', marginTop: 24,
  },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#FFE8F4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTag: {
    color: '#FF4FA3', fontSize: 11, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 22, fontWeight: '800', color: '#1A1A1A',
    marginBottom: 12, lineHeight: 28,
  },
  emptyDesc: {
    fontSize: 14, color: '#888', lineHeight: 22, textAlign: 'center',
    maxWidth: 260, marginBottom: 32,
  },
  addBigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FF4FA3', borderRadius: 18,
    paddingHorizontal: 36, paddingVertical: 16,
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 16, elevation: 8,
  },
  addBigBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  // Pet card
  petCard: {
    backgroundColor: 'white', borderRadius: 28, overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  petImageWrap: { position: 'relative', height: 240 },
  petImage: { width: '100%', height: '100%' },
  petImageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
    backgroundColor: 'transparent',
    // React Native doesn't support CSS gradient but we overlay a semi-transparent view
  },
  petTopActions: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  petActionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  vaccinatedBadge: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(52,199,89,0.95)',
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
    flex: 1, backgroundColor: '#FFF9FC', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  petChipLabel: { fontSize: 11, color: '#999', fontWeight: '500', marginBottom: 3 },
  petChipValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  // Add more
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'white', borderWidth: 2, borderColor: '#FFBBD8',
    borderStyle: 'dashed', borderRadius: 24, paddingVertical: 20,
    marginBottom: 12,
  },
  addMoreIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF5FA', alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: '#FF4FA3' },
  // Shelters
  sheltersSection: { marginBottom: 24 },
  sheltersSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheltersSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  sheltersSeeAll: { fontSize: 14, color: '#FF4FA3', fontWeight: '600' },
  shelterCard: {
    flexShrink: 0, width: 155, backgroundColor: 'white',
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
  shelterName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  shelterPets: { fontSize: 12, color: '#888' },
});
