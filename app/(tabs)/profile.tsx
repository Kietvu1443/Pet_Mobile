// ProfileScreen — Màn hình Hồ sơ người dùng.
//
// Nguồn dữ liệu:
//   - user.display_name, user.email, user.avatar  <- GET /api/v1/auth/me (backend)
//   - adoptionCount                               <- GET /api/v1/adoption-requests/my (backend)
//   - scanCount, matchCount                       <- mockAdapter (TODO: backend support)
//
// Navigation:
//   - onRole        -> /(tabs)/../role
//   - onPersonalInfo -> /(tabs)/../personal-info
//   - onLostPets    -> /(tabs)/../lost-pets
//   - logout        -> useAuth().logout()
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from '@/lib/auth/AuthContext';
import { apiRequest } from '@/lib/api/client';
import { calculateProfileCompletion } from '@/lib/profile/profileCompletion';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { getCurrentRoleLabel, getQuickRoleFromPreferences } from '@/lib/profile/userRole';

// Adoption request count from backend
type AdoptionRequestsResponse = { requests: { status?: string }[]; total?: number };

async function fetchAdoptionStats(): Promise<{ count: number; matchCount: number }> {
  try {
    const data = await apiRequest<AdoptionRequestsResponse>('/adoption-requests/my');
    const requests = Array.isArray(data.requests) ? data.requests : [];
    const count = typeof data.total === 'number' ? data.total : requests.length;
    const matchCount = requests.filter(r => r.status === 'approved').length;
    return { count, matchCount };
  } catch {
    return { count: 0, matchCount: 0 };
  }
}

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  sublabel: string;
  badge?: string | null;
  onPress: () => void;
};

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [adoptionCount, setAdoptionCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReview, setActiveReview] = useState<any>(null);

  // Shared callback used by both focus refresh and pull-to-refresh
  const refreshData = useCallback(async () => {
    const [stats, scanRes, activeReviewRes] = await Promise.all([
      fetchAdoptionStats(),
      apiRequest<{ total: number }>('/auth/scan-count').catch(() => ({ total: 0 })),
      apiRequest<{ review: any | null }>('/housing-reviews/active').catch(() => ({ review: null })),
    ]);
    await refreshUser();
    setAdoptionCount(stats.count);
    setMatchCount(stats.matchCount);
    setScanCount(scanRes.total);
    setActiveReview(activeReviewRes?.review ?? null);
  }, [refreshUser]);

  // Silent refresh every time the tab gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshData().catch(() => {
        if (active) console.error("Silent background refresh failed");
      });
      return () => { active = false; };
    }, [refreshData]),
  );

  // Pull-to-refresh handler with error alert
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch {
      Alert.alert("Lỗi làm mới", "Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleLogout = useCallback(() => {
    if (isLoggingOut) return;
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }, [isLoggingOut, logout]);

  const stats = [
    { count: scanCount, label: 'Đã quét', sublabel: 'tổng', color: '#1A1A1A' },
    { count: matchCount, label: 'Match', sublabel: matchCount === 0 ? 'chưa có' : 'lần', color: '#FF4FA3' },
    { count: adoptionCount, label: 'Nhận nuôi', sublabel: adoptionCount === 0 ? 'chưa có' : 'đơn', color: '#34C759' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: 'Tài khoản',
      items: [
        {
          icon: 'person-outline',
          iconBg: '#FFF0F7',
          iconColor: '#FF4FA3',
          label: 'Thông tin cá nhân',
          sublabel: 'Tên, email, ngày sinh',
          onPress: () => router.push('/personal-info' as Parameters<typeof router.push>[0]),
        },
        {
          icon: 'paw-outline',
          iconBg: '#FFF0F7',
          iconColor: '#FF4FA3',
          label: 'Vai trò',
          sublabel: 'Đổi vai trò bất cứ lúc ...',
          badge: getCurrentRoleLabel(user?.role, getQuickRoleFromPreferences(user?.preferences)),
          onPress: () => router.push('/role' as Parameters<typeof router.push>[0]),
        },
        {
          icon: 'home-outline',
          iconBg: '#E8F8EE',
          iconColor: '#34C759',
          label: 'Đánh giá nhà ở',
          sublabel: activeReview?.status === 'rejected' ? 'Cần cập nhật thông tin' : 'Cập nhật để tăng tỉ lệ duyệt',
          badge: activeReview?.status === 'pending' ? 'Chờ duyệt' : activeReview?.status === 'approved' ? 'Đã duyệt' : activeReview?.status === 'rejected' ? 'Cần sửa' : null,
          onPress: () => router.push('/housing-review' as Parameters<typeof router.push>[0]),
        },
        {
          icon: 'alert-circle-outline',
          iconBg: '#FFF8E8',
          iconColor: '#FFB340',
          label: 'Thú cưng bị thất lạc',
          sublabel: 'Xem và đăng báo lạc',
          onPress: () => router.push('/lost-pets' as Parameters<typeof router.push>[0]),
        },
        {
          icon: 'settings-outline',
          iconBg: '#F0F0FF',
          iconColor: '#8B5CF6',
          label: 'Cài đặt',
          sublabel: 'Ngôn ngữ, thông báo, bảo mật',
          onPress: () => router.push('/settings' as Parameters<typeof router.push>[0]),
        },
        {
          icon: 'document-text-outline',
          iconBg: '#E8F8EE',
          iconColor: '#34C759',
          label: 'Thông tin & Pháp lý',
          sublabel: 'Điều khoản & chính sách bảo mật',
          onPress: () => router.push('/legal-info' as Parameters<typeof router.push>[0]),
        },
      ],
    },
  ];

  const avatarUri = user?.avatar ? resolveImageUrl(user.avatar) : null;
  const completion = calculateProfileCompletion(user);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoggingOut}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
      {/* Title */}
      <Text style={styles.pageTitle}>Hồ sơ</Text>

      {/* Profile Hero Card */}
      <View style={styles.heroCard}>
        {/* Decorative blobs */}
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />

        <Pressable
          style={({ pressed }) => [styles.heroRow, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/personal-info' as Parameters<typeof router.push>[0])}
        >
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={32} color="rgba(255,255,255,0.7)" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={10} color="#FF4FA3" />
            </View>
          </View>

          {/* Info */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{user?.display_name ?? '—'}</Text>
            <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={11} color="white" />
              <Text style={styles.heroBadgeText}>
                {completion.percentage === 100
                  ? 'Hồ sơ đã hoàn tất'
                  : `Hồ sơ ${completion.percentage}%`}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statSublabel}>{s.sublabel}</Text>
          </View>
        ))}
      </View>

      {/* Rejected Housing Review callout */}
      {activeReview?.status === 'rejected' && (
        <View style={styles.alertCard}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="home-outline" size={20} color="#FF4D4F" />
            <Text style={styles.alertTitle}>Đánh giá nhà ở cần cập nhật</Text>
          </View>
          <Text style={styles.alertText}>
            Quản trị viên đã phản hồi về hồ sơ của bạn. Vui lòng cập nhật ngay để tiếp tục nhận nuôi.
          </Text>
          <Pressable style={styles.alertBtn} onPress={() => router.push('/housing-review')}>
            <Text style={styles.alertBtnText}>Cập nhật ngay</Text>
            <Ionicons name="arrow-forward" size={14} color="white" />
          </Pressable>
        </View>
      )}

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSublabel} numberOfLines={1}>{item.sublabel}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                </Pressable>
                {i < section.items.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={18} color="#FF4D4F" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>

      {/* App version */}
      <Text style={styles.versionText}>Pet Match · Version 1.2.0</Text>
    </ScrollView>

      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF4FA3" />
          <Text style={styles.loadingText}>Đang đăng xuất…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9FC',
  },
  content: {
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  // Hero card
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#FF4FA3',
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  blobTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 3,
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  statCount: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statSublabel: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  // Menu
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAAAAA',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuText: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuSublabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  menuBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    flexShrink: 0,
    // gradient approximated with solid color
    backgroundColor: '#FF4FA3',
  },
  menuBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 74,
  },
  // Alert card
  alertCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFC0C0',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    flexShrink: 1,
  },
  alertText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF4D4F',
    borderRadius: 16,
    paddingVertical: 12,
  },
  alertBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 22,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4D4F',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
