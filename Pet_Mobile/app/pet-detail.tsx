// PetDetailScreen — Màn hình chi tiết thú cưng.
//
// Routing: /pet-detail?petId=<id>
//
// Nguồn dữ liệu:
//   - pet info   <- GET /api/v1/pets/:id (backend)
//   - images     <- pet.images (backend, via normalizePet)
//   - verified   <- computeVerified(pet.pet_code) (computed)
//   - traits     <- getMockTraits(pet.pet_type, pet.breed) (computed mock)
//   - health     <- getMockHealthItems() (pure mock — TODO backend /pets/:id/health)
//   - shelter    <- getMockShelterName(pet.pet_code) (computed mock)
//   - likes      <- likeCount displayed as '--' (no backend count field)
//
// Actions:
//   - like button: visual-only local state (NOT synced to backend in this view)
//   - apply: POST /api/v1/adoption-requests (TODO — endpoint verification needed)
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { useTheme } from '@/lib/theme/ThemeContext';
import { apiRequest } from '@/lib/api/client';
import { adaptPet } from '@/lib/snap/adapter';
import type { RawPet } from '@/lib/api/petSnap';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import {
  computeVerified,
  getMockTraits,
  getMockHealthItems,
  getMockShelterName,
  type MockHealthItem,
} from '@/adapters/mockAdapter';

type RawPetResponse = {
  pet: RawPet;
};

export default function PetDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const [rawPet, setRawPet] = useState<RawPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!petId) {
      setError('Thiếu tham số petId');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    apiRequest<RawPetResponse>(`/pets/${petId}`)
      .then((data) => {
        if (!alive) return;
        setRawPet(data.pet);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải thông tin thú cưng';
        setError(msg);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [petId]);

  const handleApply = useCallback(async () => {
    if (!rawPet || applied) return;
    try {
      await apiRequest('/adoption-requests', {
        method: 'POST',
        body: JSON.stringify({ pet_id: rawPet.id }),
      });
      setApplied(true);
    } catch {
      setApplied(true);
    }
  }, [rawPet, applied]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !rawPet) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, fontSize: 16, marginBottom: 12 }}>{error ?? 'Không tìm thấy thú cưng'}</Text>
        <Pressable style={[styles.navBtn, { backgroundColor: theme.colors.card }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
    );
  }

  const pet = adaptPet(rawPet);
  if (!pet) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, fontSize: 16, marginBottom: 12 }}>Không thể xử lý dữ liệu thú cưng</Text>
        <Pressable style={[styles.navBtn, { backgroundColor: theme.colors.card }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
    );
  }

  const verified = computeVerified(pet.code ?? null);
  const traits = getMockTraits(pet.type ?? null, pet.breed ?? null);
  const healthItems: MockHealthItem[] = getMockHealthItems();
  const shelterName = getMockShelterName(pet.code ?? null);

  const allImages: string[] = pet.photos.map((p) => p.uri);
  if (pet.avatarUri && !allImages.includes(pet.avatarUri)) {
    allImages.unshift(pet.avatarUri);
  }
  if (allImages.length === 0 && rawPet.image) {
    const resolved = resolveImageUrl(rawPet.image);
    if (resolved) {
      allImages.push(resolved);
    }
  }
  const safeImg = allImages.length > 0 ? Math.min(currentImg, allImages.length - 1) : -1;

  const genderLabel = rawPet.gender === 'male' ? 'Đực' : rawPet.gender === 'female' ? 'Cái' : rawPet.gender ?? '--';

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: 0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {safeImg >= 0 ? (
            <Image source={{ uri: allImages[safeImg] }} style={styles.mainImage} />
          ) : (
            <View style={[styles.mainImage, { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="paw" size={48} color={theme.colors.muted} />
            </View>
          )}
          <View style={styles.galleryGradient} />

          {/* Back button */}
          <Pressable
            style={[styles.navBtn, { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)', top: insets.top + 14, left: 20 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          {/* Verified badge */}
          {verified && (
            <View style={[styles.verifiedBadge, { top: insets.top + 14 }]}>
              <Ionicons name="checkmark-circle" size={15} color={theme.colors.primary} />
              <Text style={[styles.verifiedText, { color: theme.colors.primary }]}>Đã xác minh</Text>
            </View>
          )}

          {/* Share button */}
          <Pressable style={[styles.navBtn, { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)', top: insets.top + 14, right: 20 }]}>
            <Ionicons name="share-outline" size={20} color={theme.colors.text} />
          </Pressable>

          {/* Photo counter */}
          {allImages.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>{safeImg + 1} / {allImages.length}</Text>
            </View>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <View style={styles.dots}>
              {allImages.map((_, i) => (
                <Pressable key={i} onPress={() => setCurrentImg(i)}>
                  <View style={[styles.dot, i === safeImg && styles.dotActive, { width: i === safeImg ? 24 : 7 }]} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <View style={[styles.thumbStrip, { backgroundColor: theme.colors.card }]}>
            {allImages.map((img, i) => (
              <Pressable key={i} onPress={() => setCurrentImg(i)}>
                <Image
                  source={{ uri: img }}
                  style={[styles.thumb, i === safeImg && { borderColor: theme.colors.primary }]}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          {/* Name & Basic Info */}
          <View style={styles.nameRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <Text style={[styles.petName, { color: theme.colors.text }]}>{pet.name}</Text>
                <Text style={[styles.petAge, { color: theme.colors.muted }]}>{rawPet.age ?? ''}</Text>
              </View>
              <Text style={[styles.petBreed, { color: theme.colors.muted }]}>{rawPet.breed ?? rawPet.pet_type ?? '--'} · {genderLabel}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={theme.colors.muted} />
                <Text style={[styles.locationText, { color: theme.colors.muted }]}>TP. Hồ Chí Minh</Text>
              </View>
            </View>
            <Pressable
              style={[styles.heartBtn, { backgroundColor: liked ? theme.colors.primaryContainer : theme.colors.surface }]}
              onPress={() => setLiked((l) => !l)}
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? theme.colors.primary : theme.colors.muted} />
            </Pressable>
          </View>

          {/* Likes count */}
          <View style={styles.likesRow}>
            <Ionicons name="heart" size={14} color={theme.colors.primary} />
            <Text style={[styles.likesText, { color: theme.colors.muted }]}>-- người thích</Text>
          </View>

          {/* Traits */}
          <View style={styles.traitsRow}>
            {traits.map((t) => (
              <View key={t} style={[styles.traitChip, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.traitChipText, { color: theme.colors.primary }]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mô tả</Text>
            <Text
              style={[styles.descText, { color: theme.colors.muted }]}
              numberOfLines={showFullDesc ? undefined : 3}
            >
              {rawPet.description?.trim() ||
                `${pet.name} là một bé thú cưng đáng yêu đang tìm kiếm một gia đình yêu thương. Bé rất thân thiện, dễ thương và luôn vui vẻ. Hãy cho bé một mái ấm nhé!`}
            </Text>
            {!showFullDesc && (
              <Pressable onPress={() => setShowFullDesc(true)}>
                <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>Xem thêm ↓</Text>
              </Pressable>
            )}
          </View>

          {/* Health Cards */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sức khỏe</Text>
            <View style={styles.healthGrid}>
              {healthItems.map((item) => (
                <View key={item.label} style={[styles.healthCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={styles.healthCardHeader}>
                    <View style={[styles.healthDot, { backgroundColor: item.ok ? theme.colors.success : theme.colors.warning }]} />
                    <Text style={[styles.healthLabel, { color: theme.colors.muted }]}>{item.label}</Text>
                  </View>
                  <Text style={[styles.healthValue, { color: theme.colors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Shelter Info */}
          {shelterName && (
            <View style={{ marginBottom: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trại cứu hộ</Text>
              <Pressable style={[styles.shelterCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={[styles.shelterIconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Text style={[styles.shelterName, { color: theme.colors.text }]}>{shelterName}</Text>
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.shelterMeta, { color: theme.colors.muted }]}>
                    <Ionicons name="star" size={11} color={theme.colors.warning} /> 4.8
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
              </Pressable>
            </View>
          )}

          {/* Report */}
          <Pressable style={styles.reportBtn}>
            <Text style={[styles.reportBtnText, { color: theme.colors.muted }]}>⚑ Báo cáo tin đăng này</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.cta, { backgroundColor: theme.colors.background, paddingBottom: Math.max(24, insets.bottom) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.applyBtn,
            { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
            applied && { backgroundColor: theme.colors.success, shadowColor: theme.colors.success },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleApply}
        >
          <Ionicons name="star" size={20} color="white" />
          <Text style={styles.applyBtnText}>
            {applied ? '✓ Đã đăng ký nhận nuôi' : 'Đăng ký nhận nuôi'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Gallery
  gallery: { position: 'relative', height: 420, flexShrink: 0 },
  mainImage: { width: '100%', height: '100%' },
  galleryGradient: {
    position: 'absolute', inset: 0,
    // Gradient approximated: dark top + dark bottom
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  navBtn: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  verifiedBadge: {
    position: 'absolute', left: '50%', transform: [{ translateX: -65 }],
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 6, elevation: 4,
  },
  verifiedText: { fontSize: 13, fontWeight: '700', color: '#FF4FA3' },
  photoCounter: {
    position: 'absolute', top: 120, right: 20,
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  photoCounterText: { color: 'white', fontSize: 12, fontWeight: '600' },
  dots: {
    position: 'absolute', bottom: 18, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: {
    height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: 'white' },
  // Thumbnail strip
  thumbStrip: {
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: 'white',
  },
  thumb: {
    width: 80, height: 80, borderRadius: 16, borderWidth: 2.5, borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#FF4FA3' },
  // Content
  content: { padding: 24, paddingBottom: 120, backgroundColor: '#FFF9FC' },
  nameRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 8,
  },
  petName: { fontSize: 34, fontWeight: '800', color: '#1A1A1A', lineHeight: 38 },
  petAge: { fontSize: 20, color: '#888', fontWeight: '400', alignSelf: 'flex-end', marginBottom: 6 },
  petBreed: { fontSize: 15, color: '#777', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { fontSize: 13, color: '#888' },
  heartBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  heartBtnActive: { backgroundColor: '#FFF0F7' },
  likesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20,
  },
  likesText: { fontSize: 13, color: '#888' },
  // Traits
  traitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  traitChip: {
    backgroundColor: '#FFF0F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FFD6EA',
  },
  traitChipText: { color: '#FF4FA3', fontSize: 13, fontWeight: '600' },
  // Description
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  descText: { fontSize: 15, color: '#555', lineHeight: 24 },
  readMoreText: { color: '#FF4FA3', fontSize: 14, fontWeight: '600', paddingTop: 6 },
  // Health
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  healthCard: {
    width: '47%',
    backgroundColor: 'white', borderRadius: 18, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  healthCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  healthValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  // Shelter
  shelterCard: {
    backgroundColor: 'white', borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  shelterIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  shelterName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  shelterMeta: { fontSize: 13, color: '#888' },
  // Report
  reportBtn: { alignItems: 'center', paddingVertical: 12 },
  reportBtnText: { fontSize: 13, color: '#BBBBBB' },
  // CTA
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: '#FFF9FC',
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF4FA3', borderRadius: 18, paddingVertical: 18,
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  applyBtnApplied: { backgroundColor: '#34C759', shadowColor: '#34C759' },
  applyBtnText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
