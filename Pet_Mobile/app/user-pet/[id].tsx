import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import {
  deleteUserPet,
  fetchUserPetDetail,
  formatAgeFromBirthDate,
  type UserPet,
} from '@/lib/api/userPets';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { AppDialog, AppDialogProps } from '@/components/ui/AppDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

export default function UserPetDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pet, setPet] = useState<UserPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const loadPetDetail = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      setError('ID thú cưng không hợp lệ');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserPetDetail(Number(id));
      setPet(data);
    } catch (err: any) {
      console.error('Fetch user pet detail error:', err);
      setError(err.message || 'Không tìm thấy thú cưng hoặc bạn không có quyền truy cập');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPetDetail();
  }, [loadPetDetail]);

  const handleDelete = async () => {
    if (!pet) return;
    setDeleting(true);
    try {
      await deleteUserPet(pet.id);
      setShowDeleteModal(false);
      // Quay về trang danh sách thú cưng
      router.replace('/(tabs)/pets' as Parameters<typeof router.replace>[0]);
    } catch (err: any) {
      console.error('Delete pet error:', err);
      setDialogConfig({
        visible: true,
        variant: 'error',
        title: 'Lỗi',
        message: err?.message || 'Không thể xóa thú cưng. Vui lòng thử lại.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background, paddingHorizontal: 32 }]}>
        <View style={[styles.errorIconCircle, { backgroundColor: theme.colors.errorContainer }]}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Không thể tải thông tin</Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.muted }]}>{error || 'Thú cưng không tồn tại'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <Pressable
            style={[styles.errorBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.errorBtnText, { color: theme.colors.text }]}>Quay lại</Text>
          </Pressable>
          <Pressable
            style={[styles.errorBtn, { backgroundColor: theme.colors.primary }]}
            onPress={loadPetDetail}
          >
            <Text style={[styles.errorBtnText, { color: 'white' }]}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Thu thập danh sách ảnh
  const galleryImages: string[] = [];
  if (pet.images && pet.images.length > 0) {
    pet.images.forEach((img) => {
      const resolved = resolveImageUrl(img.image_path);
      if (resolved && !galleryImages.includes(resolved)) {
        galleryImages.push(resolved);
      }
    });
  } else if (pet.image_url) {
    const resolved = resolveImageUrl(pet.image_url);
    if (resolved) galleryImages.push(resolved);
  }

  const ageDisplay = formatAgeFromBirthDate(pet.birth_date);
  const speciesLabel = pet.species === 'cat' ? 'Mèo' : pet.species === 'dog' ? 'Chó' : 'Thú cưng khác';
  const speciesEmoji = pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾';
  const genderLabel = pet.gender === 'male' ? '♂ Đực' : pet.gender === 'female' ? '♀ Cái' : '--';
  const breedLabel = pet.breed || speciesLabel;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Gallery Area */}
        <View style={styles.galleryContainer}>
          {galleryImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIdx(idx);
              }}
            >
              {galleryImages.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={{ fontSize: 90 }}>{speciesEmoji}</Text>
            </View>
          )}

          {/* Floating Back Button */}
          <Pressable
            style={[
              styles.floatingNavBtn,
              { backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)', top: insets.top + 12, left: 20 },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          {/* Gallery Pagination Badge */}
          {galleryImages.length > 1 && (
            <View style={[styles.photoCounterBadge, { bottom: 20, right: 20 }]}>
              <Text style={styles.photoCounterText}>
                {activeImageIdx + 1} / {galleryImages.length}
              </Text>
            </View>
          )}

          {/* Gallery Dots */}
          {galleryImages.length > 1 && (
            <View style={styles.dotsRow}>
              {galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIdx && styles.dotActive,
                    { width: i === activeImageIdx ? 24 : 7 },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content Card */}
        <View style={[styles.contentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Header Row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.petName, { color: theme.colors.text }]}>{pet.name}</Text>
              <Text style={[styles.petSubtitle, { color: theme.colors.muted }]}>
                {breedLabel} · {ageDisplay}
              </Text>
            </View>
            {Boolean(pet.vaccinated) && (
              <View style={[styles.vaccinatedBadge, { backgroundColor: theme.colors.successContainer }]}>
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
                <Text style={[styles.vaccinatedText, { color: theme.colors.success }]}>Đã tiêm phòng</Text>
              </View>
            )}
          </View>

          {/* Stats Chips Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Giới tính</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{genderLabel}</Text>
            </View>

            <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Cân nặng</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {pet.weight ? `${pet.weight} kg` : '--'}
              </Text>
            </View>

            <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Màu lông</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>
                {pet.color || '--'}
              </Text>
            </View>

            <View style={[styles.statChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Loài</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{speciesLabel}</Text>
            </View>
          </View>

          {/* Traits Section */}
          {pet.traits && pet.traits.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tính cách đặc trưng</Text>
              <View style={styles.traitsWrap}>
                {pet.traits.map((t, idx) => (
                  <View key={idx} style={[styles.traitChip, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={[styles.traitChipText, { color: theme.colors.primary }]}>✨ {t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description Section */}
          {Boolean(pet.description) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ghi chú & Mô tả</Text>
              <Text style={[styles.descriptionText, { color: theme.colors.text }]}>{pet.description}</Text>
            </View>
          )}

          {/* Delete Danger Action */}
          <View style={styles.dangerSection}>
            <Pressable
              style={({ pressed }) => [
                styles.deleteActionBtn,
                { borderColor: theme.colors.errorContainer, backgroundColor: `${theme.colors.error}10` },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.deleteActionText, { color: theme.colors.error }]}>Xóa thú cưng</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        visible={showDeleteModal}
        petName={pet.name}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Standard AppDialog */}
      <AppDialog
        visible={Boolean(dialogConfig?.visible)}
        title={dialogConfig?.title || ''}
        message={dialogConfig?.message}
        variant={dialogConfig?.variant}
        iconName={dialogConfig?.iconName}
        confirmText={dialogConfig?.confirmText}
        cancelText={dialogConfig?.cancelText}
        singleButton={dialogConfig?.singleButton}
        loading={dialogConfig?.loading}
        onConfirm={dialogConfig?.onConfirm}
        onCancel={dialogConfig?.onCancel || (() => setDialogConfig(null))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  placeholderImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNavBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  photoCounterBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: 'white',
  },
  contentCard: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
    borderWidth: 1,
    borderBottomWidth: 0,
    minHeight: 400,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  petName: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 4,
  },
  petSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  vaccinatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  vaccinatedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  statChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  traitChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  dangerSection: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  deleteActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBtn: {
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
  },
  errorBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
