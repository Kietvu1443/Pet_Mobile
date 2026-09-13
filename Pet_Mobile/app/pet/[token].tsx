import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/lib/theme/ThemeContext';
import { resolvePublicPet, type PublicPet } from '@/lib/api/publicPets';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { formatAgeFromBirthDate } from '@/lib/api/userPets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

export default function PublicPetDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [pet, setPet] = useState<PublicPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const loadPet = useCallback(async () => {
    if (!token) {
      setError('Mã thú cưng không hợp lệ hoặc bị thiếu');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await resolvePublicPet(token);
      setPet(data);
    } catch (err: any) {
      console.error('Resolve public pet error:', err);
      setError(err.message || 'Mã QR không hợp lệ, thú cưng không tồn tại hoặc đã ngừng chia sẻ.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const handleShare = async () => {
    if (!pet) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Xem hồ sơ công khai của bé ${pet.name} trên Pet Helper: ${pet.canonicalUrl}`,
        url: pet.canonicalUrl,
        title: `Hồ sơ thú cưng: ${pet.name}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Build image list
  const imageList: string[] = [];
  if (pet?.images && pet.images.length > 0) {
    pet.images.forEach((img) => {
      const resolved = resolveImageUrl(img.image_path);
      if (resolved) imageList.push(resolved);
    });
  } else if (pet?.image_url) {
    const resolved = resolveImageUrl(pet.image_url);
    if (resolved) imageList.push(resolved);
  }

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
          Đang tải hồ sơ thú cưng...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error || !pet) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, paddingTop: insets.top + 20 }]}>
        <View style={[styles.errorCircle, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="alert-circle-outline" size={54} color={theme.colors.error || '#EF4444'} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Không tìm thấy hồ sơ
        </Text>
        <Text style={[styles.errorDesc, { color: theme.colors.muted }]}>
          {error || 'Mã QR đã quét không còn hiệu lực hoặc đường dẫn không đúng.'}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.backHomeBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.backHomeBtnText}>Về trang chủ</Text>
        </Pressable>
      </View>
    );
  }

  const isUserPet = pet.category === 'user_pet';
  const displayAge = isUserPet
    ? formatAgeFromBirthDate(pet.birth_date)
    : pet.age || 'Chưa rõ tuổi';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Image Gallery */}
        <View style={styles.imageContainer}>
          {imageList.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / SCREEN_WIDTH);
                setActiveImageIdx(idx);
              }}
              scrollEventThrottle={16}
            >
              {imageList.map((uri, idx) => (
                <Image
                  key={`img-${idx}`}
                  source={{ uri }}
                  style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="paw" size={72} color={theme.colors.muted} />
            </View>
          )}

          {/* Pagination dots if multiple images */}
          {imageList.length > 1 && (
            <View style={styles.pagination}>
              {imageList.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.dot,
                    activeImageIdx === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Floating Back Button */}
          <Pressable
            style={[styles.floatingBackBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#1A1C1E" />
          </Pressable>

          {/* Floating Share Button */}
          <Pressable
            style={[styles.floatingShareBtn, { top: insets.top + 12 }]}
            onPress={handleShare}
            hitSlop={8}
          >
            <Ionicons name="share-social-outline" size={22} color="#1A1C1E" />
          </Pressable>
        </View>

        {/* Pet Info Card */}
        <View style={[styles.contentCard, { backgroundColor: theme.colors.card }]}>
          {/* Category Badge & Code */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: isUserPet
                    ? theme.colors.primaryContainer || '#E6F4FE'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isUserPet ? theme.colors.primary : '#D97706',
                  },
                ]}
              >
                {isUserPet ? '🐾 Thú cưng gia đình' : '🏠 Thú cưng cứu hộ'}
              </Text>
            </View>

            {pet.pet_code ? (
              <View style={[styles.codeBadge, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.codeText, { color: theme.colors.muted }]}>
                  Mã: {pet.pet_code}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Name & Breed */}
          <Text style={[styles.petName, { color: theme.colors.text }]}>
            {pet.name}
          </Text>
          {pet.breed ? (
            <Text style={[styles.petBreed, { color: theme.colors.muted }]}>
              {pet.breed}
            </Text>
          ) : null}

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Ionicons
                name={pet.gender === 'male' ? 'male' : pet.gender === 'female' ? 'female' : 'help-outline'}
                size={20}
                color={pet.gender === 'male' ? '#3B82F6' : pet.gender === 'female' ? '#EC4899' : theme.colors.muted}
              />
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Giới tính</Text>
              <Text style={[styles.statVal, { color: theme.colors.text }]}>
                {pet.gender === 'male' ? 'Đực' : pet.gender === 'female' ? 'Cái' : 'Chưa rõ'}
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Tuổi</Text>
              <Text style={[styles.statVal, { color: theme.colors.text }]}>
                {displayAge}
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="scale-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Cân nặng</Text>
              <Text style={[styles.statVal, { color: theme.colors.text }]}>
                {pet.weight ? `${pet.weight} kg` : 'Chưa rõ'}
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
              <Ionicons
                name={pet.vaccinated ? 'shield-checkmark' : 'shield-outline'}
                size={20}
                color={pet.vaccinated ? '#10B981' : theme.colors.muted}
              />
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Tiêm chủng</Text>
              <Text style={[styles.statVal, { color: theme.colors.text }]}>
                {pet.vaccinated ? 'Đã tiêm' : 'Chưa tiêm'}
              </Text>
            </View>
          </View>

          {/* Traits Section */}
          {pet.traits && pet.traits.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Tính cách & Đặc điểm
              </Text>
              <View style={styles.traitsContainer}>
                {pet.traits.map((trait, idx) => (
                  <View
                    key={`trait-${idx}`}
                    style={[styles.traitChip, { backgroundColor: theme.colors.surface }]}
                  >
                    <Text style={[styles.traitText, { color: theme.colors.text }]}>
                      ✨ {trait}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description Section */}
          {pet.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Giới thiệu
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
                {pet.description}
              </Text>
            </View>
          ) : null}

          {/* Privacy & Safety Note */}
          <View style={[styles.privacyBox, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.privacyText, { color: theme.colors.muted }]}>
              Hồ sơ công khai an toàn. Thông tin cá nhân, liên hệ và địa chỉ của chủ nuôi được bảo vệ 100%.
            </Text>
          </View>

          {/* Share Button Bottom */}
          <Pressable
            style={({ pressed }) => [
              styles.actionShareBtn,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionShareBtnText}>Chia sẻ hồ sơ thú cưng</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
  },
  errorCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  backHomeBtn: {
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  imageFallback: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingShareBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  contentCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Fredoka-SemiBold',
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'Fredoka-Medium',
  },
  petName: {
    fontSize: 26,
    fontFamily: 'Fredoka-Bold',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 15,
    fontFamily: 'Fredoka-Medium',
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 12,
    fontFamily: 'Fredoka-SemiBold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 10,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  traitText: {
    fontSize: 13,
    fontFamily: 'Fredoka-Medium',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  privacyBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  actionShareBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionShareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
  },
});
