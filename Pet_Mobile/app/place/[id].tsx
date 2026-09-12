import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  Place,
  PlaceReview,
  fetchPlaceDetail,
  fetchPlaceReviews,
  deletePlaceReview,
  openDirectionsInMaps,
  PLACE_CATEGORIES,
  updatePlacesCacheAfterReview,
  invalidatePlacesQueries,
} from '../../lib/api/places';
import { resolveImageUrl } from '../../lib/images/resolveUrl';
import { PlaceReviewModal } from '../../components/map/PlaceReviewModal';
import { ReportModal } from '../../components/map/ReportModal';
import { useAuth } from '../../lib/auth/AuthContext';
import { AppDialog, AppDialogProps } from '../../components/ui/AppDialog';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [place, setPlace] = useState<Place | null>(null);
  const [myReview, setMyReview] = useState<PlaceReview | null>(null);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const handleOpenReview = () => {
    if (!isAuthenticated) {
      setDialogConfig({
        visible: true,
        variant: 'warning',
        iconName: 'lock-closed-outline',
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập tài khoản để đánh giá và bình luận địa điểm.',
        confirmText: 'Đăng nhập',
        cancelText: 'Để sau',
        onConfirm: () => {
          setDialogConfig(null);
          router.push('/(auth)/login' as any);
        },
        onCancel: () => setDialogConfig(null),
      });
      return;
    }
    setReviewModalVisible(true);
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      setDialogConfig({
        visible: true,
        variant: 'warning',
        iconName: 'lock-closed-outline',
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập tài khoản để gửi báo cáo vi phạm.',
        confirmText: 'Đăng nhập',
        cancelText: 'Để sau',
        onConfirm: () => {
          setDialogConfig(null);
          router.push('/(auth)/login' as any);
        },
        onCancel: () => setDialogConfig(null),
      });
      return;
    }
    setReportModalVisible(true);
  };

  const loadData = useCallback(async () => {
    if (!id) return null;
    try {
      setLoading(true);
      setError(null);

      const [detailRes, reviewsRes] = await Promise.all([
        fetchPlaceDetail(id),
        fetchPlaceReviews(id, 1, 20).catch(() => ({ reviews: [], total: 0, totalPages: 0 })),
      ]);

      setPlace(detailRes.place);
      setMyReview(detailRes.my_review);
      setReviews(reviewsRes.reviews || []);
      return detailRes;
    } catch (err: any) {
      console.error('[PlaceDetail] Load error:', err);
      setError(err?.message || 'Không thể tải thông tin địa điểm.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDirections = () => {
    if (!place) return;
    openDirectionsInMaps(place.latitude, place.longitude, place.name);
  };

  const handleCall = () => {
    if (!place?.phone) return;
    Linking.openURL(`tel:${place.phone}`);
  };

  const handleWebsite = () => {
    if (!place?.website) return;
    const url = place.website.startsWith('http') ? place.website : `https://${place.website}`;
    Linking.openURL(url);
  };

  const handleDeleteMyReview = () => {
    if (!place) return;
    setDialogConfig({
      visible: true,
      variant: 'destructive',
      iconName: 'trash-outline',
      title: 'Xóa đánh giá',
      message: 'Bạn có chắc chắn muốn xóa đánh giá của mình? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa đánh giá',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          await deletePlaceReview(place.id);
          setMyReview(null);
          const fresh = await loadData();
          if (fresh?.place) {
            updatePlacesCacheAfterReview(
              fresh.place.id,
              fresh.place.rating_avg,
              fresh.place.review_count,
              null as any
            );
          } else {
            invalidatePlacesQueries();
          }
          setDialogConfig(null);
        } catch (e: any) {
          setDialogConfig({
            visible: true,
            variant: 'error',
            title: 'Lỗi',
            message: e?.message || 'Không thể xóa đánh giá. Vui lòng thử lại.',
            singleButton: true,
            confirmText: 'Đã hiểu',
            onConfirm: () => setDialogConfig(null),
          });
        }
      },
      onCancel: () => setDialogConfig(null),
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#00220F" />
        <Text style={styles.loadingText}>Đang tải thông tin địa điểm...</Text>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Không tìm thấy địa điểm</Text>
        <Text style={styles.errorDesc}>{error || 'Địa điểm có thể đã bị xóa hoặc không tồn tại.'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
          <Pressable onPress={() => loadData()} style={[styles.backBtn, { backgroundColor: '#00220F' }]}>
            <Text style={[styles.backBtnText, { color: '#FFFFFF' }]}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const meta = PLACE_CATEGORIES[place.type] || PLACE_CATEGORIES.other;
  const heroImage = place.image_url ? resolveImageUrl(place.image_url) : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner with Floating Controls */}
        <View style={styles.heroWrap}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: meta.bgColor }]}>
              <MaterialIcons name={(meta.icon as any) || 'pets'} size={64} color={meta.color} />
            </View>
          )}

          {/* Floating Top Buttons */}
          <View style={[styles.floatingTopBar, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </Pressable>

            <Pressable
              onPress={handleOpenReport}
              hitSlop={12}
              style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.8 }]}
            >
              <MaterialIcons name="flag" size={20} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Place Info Container */}
        <View style={styles.contentWrap}>
          {/* Category Badge & Status */}
          <View style={styles.typeRow}>
            <View style={[styles.typeBadge, { backgroundColor: meta.bgColor }]}>
              <MaterialIcons name={(meta.icon as any) || 'pets'} size={14} color={meta.color} />
              <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {place.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>⏳ Chờ duyệt</Text>
              </View>
            )}
          </View>

          {/* Title & Stats */}
          <Text style={styles.placeName}>{place.name}</Text>

          <View style={styles.ratingDistanceRow}>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingScore}>{place.rating_avg.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({place.review_count} đánh giá)</Text>
            </View>
            {place.distance_km != null && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location-outline" size={14} color="#00220F" />
                <Text style={styles.distanceText}>{place.distance_km} km</Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleDirections}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && { opacity: 0.88 }]}
            >
              <MaterialIcons name="navigation" size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Chỉ đường</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenReview}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && { opacity: 0.88 }]}
            >
              <MaterialIcons name="rate-review" size={18} color="#00220F" />
              <Text style={styles.secondaryActionText}>
                {myReview ? 'Sửa đánh giá' : 'Đánh giá'}
              </Text>
            </Pressable>
          </View>

          {/* Address & Contact Info Box */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="location" size={18} color="#00220F" />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{place.address}</Text>
              </View>
            </View>

            {place.phone && (
              <Pressable onPress={handleCall} style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="call" size={18} color="#00220F" />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Số điện thoại (Nhấn để gọi)</Text>
                  <Text style={[styles.infoValue, { color: '#007AFF', fontWeight: '700' }]}>
                    {place.phone}
                  </Text>
                </View>
              </Pressable>
            )}

            {place.website && (
              <Pressable onPress={handleWebsite} style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="globe-outline" size={18} color="#00220F" />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Website / Fanpage</Text>
                  <Text numberOfLines={1} style={[styles.infoValue, { color: '#007AFF' }]}>
                    {place.website}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Description */}
          {place.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Giới thiệu</Text>
              <Text style={styles.descText}>{place.description}</Text>
            </View>
          )}

          {/* My Review Highlight */}
          {myReview && (
            <View style={styles.myReviewCard}>
              <View style={styles.myReviewHeader}>
                <Text style={styles.myReviewTitle}>Đánh giá của bạn</Text>
                <Pressable onPress={handleDeleteMyReview} hitSlop={8}>
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <MaterialIcons
                    key={s}
                    name={s <= myReview.rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#F59E0B"
                  />
                ))}
              </View>
              {myReview.comment && (
                <Text style={styles.myReviewComment}>{myReview.comment}</Text>
              )}
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Đánh giá từ cộng đồng</Text>
              <Text style={styles.reviewsTotalCount}>{reviews.length} đánh giá</Text>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.emptyReviewsWrap}>
                <MaterialIcons name="chat-bubble-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyReviewsText}>Chưa có đánh giá nào.</Text>
                <Text style={styles.emptyReviewsSub}>Hãy là người đầu tiên chia sẻ trải nghiệm!</Text>
              </View>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={styles.reviewAvatarWrap}>
                      {rev.avatar ? (
                        <Image source={{ uri: resolveImageUrl(rev.avatar) || '' }} style={styles.reviewAvatar} />
                      ) : (
                        <View style={styles.reviewAvatarPlaceholder}>
                          <Text style={styles.reviewAvatarLetter}>
                            {(rev.display_name || rev.username || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.reviewAuthorMeta}>
                      <Text style={styles.reviewAuthorName}>
                        {rev.display_name || rev.username || 'Thành viên'}
                      </Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialIcons
                            key={s}
                            name={s <= rev.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      {place && (
        <PlaceReviewModal
          visible={reviewModalVisible}
          placeId={place.id}
          placeName={place.name}
          initialRating={myReview?.rating || 5}
          initialComment={myReview?.comment || ''}
          onClose={() => setReviewModalVisible(false)}
          onSuccess={async () => {
            const fresh = await loadData();
            if (fresh?.place) {
              updatePlacesCacheAfterReview(
                fresh.place.id,
                fresh.place.rating_avg,
                fresh.place.review_count,
                fresh.my_review || undefined
              );
            } else {
              invalidatePlacesQueries();
            }
            setDialogConfig({
              visible: true,
              variant: 'success',
              iconName: 'star-outline',
              title: 'Thành công 🌟',
              message: 'Cảm ơn bạn đã gửi đánh giá cho địa điểm này!',
              singleButton: true,
              confirmText: 'Đã hiểu',
              onConfirm: () => setDialogConfig(null),
            });
          }}
        />
      )}

      {/* Report Modal */}
      {place && (
        <ReportModal
          visible={reportModalVisible}
          targetId={place.id}
          targetType="place"
          targetName={place.name}
          onClose={() => setReportModalVisible(false)}
          onSuccess={() => {
            setDialogConfig({
              visible: true,
              variant: 'success',
              iconName: 'checkmark-circle-outline',
              title: 'Đã gửi báo cáo',
              message: 'Báo cáo vi phạm đã được gửi tới quản trị viên để kiểm duyệt.',
              singleButton: true,
              confirmText: 'Đã hiểu',
              onConfirm: () => setDialogConfig(null),
            });
          }}
        />
      )}

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
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: '#00220F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroWrap: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  contentWrap: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pendingBadgeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  placeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 8,
  },
  ratingDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00220F',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: '#00220F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#00220F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryActionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 18,
  },
  descSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  myReviewCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 20,
  },
  myReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  myReviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  myReviewComment: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 6,
    lineHeight: 18,
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewsTotalCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyReviewsWrap: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
  emptyReviewsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptyReviewsSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reviewItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  reviewAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  reviewAvatar: {
    width: '100%',
    height: '100%',
  },
  reviewAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#00220F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  reviewAuthorMeta: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
    paddingLeft: 46,
  },
});
