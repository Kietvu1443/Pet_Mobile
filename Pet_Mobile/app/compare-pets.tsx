import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useQueries } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api/client';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { fetchPetNote } from '@/lib/api/notes';
import { fetchPetCollections, fetchMyCollections } from '@/lib/api/collections';
import { fetchMySuperliked } from '@/lib/api/favorites';
import type { RawPet } from '@/lib/api/petSnap';

type RawPetResponse = {
  pet: RawPet;
};

export default function ComparePetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const { petIds: rawPetIds } = useLocalSearchParams<{ petIds?: string }>();

  // Parse IDs from params
  const initialPetIds = useMemo(() => {
    if (!rawPetIds) return [];
    return rawPetIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
  }, [rawPetIds]);

  const [activePetIds, setActivePetIds] = useState<number[]>(initialPetIds);

  // Fetch pet detail for each ID
  const petQueries = useQueries({
    queries: activePetIds.map((id) => ({
      queryKey: ['pet-detail-compare', id],
      queryFn: async () => {
        const res = await apiRequest<RawPetResponse>(`/pets/${id}`);
        return res.pet;
      },
    })),
  });

  // Fetch personal note for each ID
  const noteQueries = useQueries({
    queries: activePetIds.map((id) => ({
      queryKey: ['note', id],
      queryFn: async () => {
        const res = await fetchPetNote(id);
        return res.note?.content || null;
      },
    })),
  });

  // Fetch pet collections for each ID
  const collectionQueries = useQueries({
    queries: activePetIds.map((id) => ({
      queryKey: ['pet-collections', id],
      queryFn: async () => {
        const res = await fetchPetCollections(id);
        return res.collectionIds || [];
      },
    })),
  });

  // Fetch all user collections to map collection names
  const allCollectionsQuery = useQueries({
    queries: [
      {
        queryKey: ['collections'],
        queryFn: async () => {
          const res = await fetchMyCollections();
          return res.collections || [];
        },
      },
    ],
  });

  // Fetch Superliked list to highlight in Compare
  const superlikedPetsQuery = useQueries({
    queries: [
      {
        queryKey: ['favorites', 'superliked'],
        queryFn: async () => {
          const res = await fetchMySuperliked();
          return (res.favorites || []).map((f) => f.id);
        },
      },
    ],
  });

  const allCollections = allCollectionsQuery[0]?.data || [];
  const superlikedPetIds = superlikedPetsQuery[0]?.data || [];

  const isLoading = petQueries.some((q) => q.isLoading);

  const handleRemovePet = (petIdToRemove: number) => {
    setActivePetIds((prev) => prev.filter((id) => id !== petIdToRemove));
  };

  const petsData = activePetIds.map((id, index) => {
    const pet = petQueries[index]?.data;
    const note = noteQueries[index]?.data;
    const petColIds = collectionQueries[index]?.data || [];
    const isSuperliked = superlikedPetIds.includes(id) || pet?.status === 'superliked';
    const matchedColNames = allCollections
      .filter((c) => petColIds.includes(c.id))
      .map((c) => `${c.emoji || '📁'} ${c.name}`);

    return {
      id,
      name: isSuperliked ? `⭐ ${pet?.name || `Pet #${id}`}` : pet?.name || `Pet #${id}`,
      isSuperliked,
      image: pet?.image_url || pet?.avatar_image ? resolveImageUrl(pet?.image_url || pet?.avatar_image) : null,
      petType: pet?.pet_type === 'dog' ? 'Chó 🐶' : pet?.pet_type === 'cat' ? 'Mèo 🐱' : pet?.pet_type || '--',
      breed: pet?.breed || 'Chưa rõ',
      age: pet?.age || 'Chưa rõ',
      gender: pet?.gender === 'male' || pet?.gender === 'đực' ? 'Đực ♂' : pet?.gender === 'female' || pet?.gender === 'cái' ? 'Cái ♀' : pet?.gender || '--',
      vaccination: pet?.vaccination ? 'Đã tiêm phòng 💉' : 'Chưa cập nhật ❓',
      location: pet?.contact_info
        ? pet.contact_info.replace(/\s*\([^)]*\)/g, '').replace(/https?:\/\/\S+/gi, '').trim()
        : 'Chưa rõ',
      collections: matchedColNames.length > 0 ? matchedColNames.join(', ') : 'Chưa xếp vào BST',
      note: note || 'Chưa có ghi chú',
    };
  });

  if (activePetIds.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="swap-horizontal" size={48} color={theme.colors.muted} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Không còn thú cưng nào</Text>
        <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
          Bạn đã bỏ chọn tất cả thú cưng trong danh sách so sánh.
        </Text>
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Quay lại danh sách</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 38) + 8,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            So sánh thú cưng ({activePetIds.length}/3)
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]}>
            Bảng đối chiếu thông tin chi tiết
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.muted }}>Đang tải dữ liệu so sánh...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Side by Side Header Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matrixContainer}
          >
            <View>
              {/* Pet Cards Header Row */}
              <View style={styles.rowContainer}>
                {petsData.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.petHeaderCard,
                      {
                        backgroundColor: item.isSuperliked ? '#FFFDF0' : theme.colors.card,
                        borderColor: item.isSuperliked ? '#FFB800' : theme.colors.border,
                        borderWidth: item.isSuperliked ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Delete button */}
                    {activePetIds.length > 2 && (
                      <Pressable
                        style={[styles.removeBadge, { backgroundColor: theme.colors.notification }]}
                        onPress={() => handleRemovePet(item.id)}
                      >
                        <Ionicons name="close" size={14} color="white" />
                      </Pressable>
                    )}

                    <View style={styles.imageWrap}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.petImage} />
                      ) : (
                        <View style={[styles.petImage, styles.placeholderImg, { backgroundColor: theme.colors.surface }]}>
                          <Ionicons name="paw" size={28} color={theme.colors.muted} />
                        </View>
                      )}
                    </View>

                    <Text style={[styles.petName, { color: theme.colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Pressable
                      style={({ pressed }) => [
                        styles.detailCta,
                        { backgroundColor: `${theme.colors.primary}18`, borderColor: theme.colors.primary },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() =>
                        router.push({ pathname: '/pet-detail', params: { petId: String(item.id) } })
                      }
                    >
                      <Text style={[styles.detailCtaText, { color: theme.colors.primary }]}>
                        Xem chi tiết
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Matrix Sections */}
              {[
                { key: 'petType', label: '🐾 Loài' },
                { key: 'breed', label: '🧬 Giống' },
                { key: 'age', label: '🎂 Tuổi' },
                { key: 'gender', label: '⚧ Giới tính' },
                { key: 'vaccination', label: '💉 Tiêm phòng' },
                { key: 'location', label: '📍 Địa điểm' },
                { key: 'collections', label: '📁 Bộ sưu tập' },
                { key: 'note', label: '📝 Ghi chú cá nhân' },
              ].map((field) => (
                <View key={field.key} style={styles.fieldSection}>
                  <Text style={[styles.fieldLabelHeader, { color: theme.colors.primary }]}>
                    {field.label}
                  </Text>
                  <View style={styles.rowContainer}>
                    {petsData.map((item) => {
                      const val = (item as any)[field.key];
                      const isHighlight = field.key === 'note' && val !== 'Chưa có ghi chú';
                      return (
                        <View
                          key={`${field.key}-${item.id}`}
                          style={[
                            styles.cellCard,
                            {
                              backgroundColor: isHighlight
                                ? `${theme.colors.primary}12`
                                : theme.colors.card,
                              borderColor: isHighlight
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellText,
                              {
                                color: isHighlight ? theme.colors.primary : theme.colors.text,
                                fontWeight: isHighlight ? '700' : '500',
                              },
                            ]}
                          >
                            {val}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const COLUMN_WIDTH = 160;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  emptyDesc: { textAlign: 'center', fontSize: 13, marginBottom: 20 },
  backBtn: { borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  matrixContainer: { paddingHorizontal: 20, paddingTop: 16 },
  rowContainer: { flexDirection: 'row', gap: 12 },
  petHeaderCard: {
    width: COLUMN_WIDTH,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 10 },
  petImage: { width: '100%', height: '100%' },
  placeholderImg: { alignItems: 'center', justifyContent: 'center' },
  petName: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  detailCta: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  detailCtaText: { fontSize: 11.5, fontWeight: '700' },
  fieldSection: { marginTop: 20 },
  fieldLabelHeader: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.8 },
  cellCard: {
    width: COLUMN_WIDTH,
    borderRadius: 16,
    padding: 12,
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 1,
  },
  cellText: { fontSize: 13, lineHeight: 18 },
});
