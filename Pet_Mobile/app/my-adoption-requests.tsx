// MyAdoptionRequestsScreen — Màn hình theo dõi các yêu cầu nhận nuôi của người dùng.
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
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
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  fetchMyAdoptionRequests,
  type AdoptionRequestItem,
  type AdoptionRequestStatus,
} from '@/lib/api/adoptionRequests';
import { resolveImageUrl } from '@/lib/images/resolveUrl';

const STATUS_CONFIG: Record<
  AdoptionRequestStatus,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: {
    label: 'Chờ duyệt',
    bg: '#FFF8E8',
    text: '#B8860B',
    icon: 'hourglass-outline',
  },
  approved: {
    label: 'Đã duyệt',
    bg: '#E8F8EE',
    text: '#22C55E',
    icon: 'checkmark-circle-outline',
  },
  rejected: {
    label: 'Từ chối',
    bg: '#FFF0F0',
    text: '#EF4444',
    icon: 'close-circle-outline',
  },
};

function formatDate(isoDate?: string): string {
  if (!isoDate) return '--';
  try {
    const d = new Date(isoDate);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '--';
  }
}

export default function MyAdoptionRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const {
    data: requests = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['my-adoption-requests'],
    queryFn: () => fetchMyAdoptionRequests(),
    enabled: isAuthenticated,
  });

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
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
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Hồ sơ nhận nuôi
          </Text>
          <Text style={[styles.headerSub, { color: theme.colors.muted }]}>
            Theo dõi tiến trình xét duyệt hồ sơ
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
              Đang tải danh sách hồ sơ...
            </Text>
          </View>
        ) : requests.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Ionicons name="paw-outline" size={38} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Chưa có hồ sơ nhận nuôi nào
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
              Khi bạn gửi yêu cầu nhận nuôi một bé thú cưng, thông tin và trạng thái xét duyệt sẽ hiển thị tại đây.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => router.push('/adopt-catalog')}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Tìm bé để nhận nuôi</Text>
            </Pressable>
          </View>
        ) : (
          requests.map((item: AdoptionRequestItem) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const imageUrl = item.pet_image ? resolveImageUrl(item.pet_image) : null;

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/pet-detail',
                    params: { petId: String(item.pet_id) },
                  })
                }
              >
                {/* Pet preview row */}
                <View style={styles.cardHeader}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.petImage} />
                  ) : (
                    <View
                      style={[
                        styles.petImagePlaceholder,
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <Ionicons name="paw" size={24} color={theme.colors.primary} />
                    </View>
                  )}

                  <View style={styles.petInfo}>
                    <Text
                      style={[styles.petName, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.pet_name}
                    </Text>
                    <Text style={[styles.petType, { color: theme.colors.muted }]}>
                      Loài: {item.pet_type || 'Thú cưng'}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.colors.muted }]}>
                      Ngày gửi: {formatDate(item.created_at)}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusConfig.bg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={statusConfig.icon}
                      size={14}
                      color={statusConfig.text}
                    />
                    <Text
                      style={[styles.statusText, { color: statusConfig.text }]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Message sent */}
                <View
                  style={[
                    styles.messageWrap,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text style={[styles.messageLabel, { color: theme.colors.muted }]}>
                    Lý do bạn gửi:
                  </Text>
                  <Text
                    style={[styles.messageText, { color: theme.colors.text }]}
                    numberOfLines={3}
                  >
                    {item.message}
                  </Text>
                </View>

                {/* Helper notice if approved */}
                {item.status === 'approved' && (
                  <View
                    style={[
                      styles.approvedNotice,
                      { backgroundColor: theme.colors.successContainer },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={theme.colors.success}
                    />
                    <Text
                      style={[
                        styles.approvedNoticeText,
                        { color: theme.colors.success },
                      ]}
                    >
                      Hồ sơ của bạn đã được trại duyệt! Vui lòng liên hệ trại để sắp xếp đón bé.
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
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
  content: {
    padding: 16,
    gap: 14,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '800',
  },
  petType: {
    fontSize: 13,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  messageWrap: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  approvedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  approvedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
