import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SNAP_COLORS, SNAP_FONTS } from '@/constants/petsnap-theme';
import { apiRequest } from '@/lib/api/client';
import { updateGlobalUnread, useUnreadNotifications } from '@/lib/notifications/unread';
import { navigateFromNotification } from '@/lib/notifications/device';
import { NotificationData, NotificationItem } from '@/components/NotificationItem';
import { useTheme } from '@/lib/theme/ThemeContext';

// In-memory 30s cache variables
let cacheData: NotificationData[] = [];
let cacheTimestamp = 0;
const CACHE_MAX_AGE_MS = 30000; // 30 seconds

type FlatListItem =
  | { type: 'header'; id: string; title: string }
  | { type: 'item'; id: string; data: NotificationData };

export default function NotificationCenterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { refresh: refreshGlobalBadge } = useUnreadNotifications();

  // Component States
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchingRef = useRef<number | null>(null);

  const limit = 20;

  // Data fetching helper
  const loadNotifications = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (fetchingRef.current === pageNum) return;
      fetchingRef.current = pageNum;

      try {
        setError(null);
        if (pageNum === 1) {
          if (isRefresh) setRefreshing(true);
          else setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const url = `/notifications?limit=${limit}&page=${pageNum}`;
        const response = await apiRequest<{ notifications: NotificationData[]; unread: number }>(url);

        const fetchedList = Array.isArray(response.notifications) ? response.notifications : [];
        const fetchedUnread = response.unread ?? 0;

        if (pageNum === 1) {
          setNotifications(fetchedList);
          // Update cache
          cacheData = fetchedList;
          cacheTimestamp = Date.now();
          // Synchronize badge
          updateGlobalUnread(fetchedUnread);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = fetchedList.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newItems];
          });
        }

        setHasMore(fetchedList.length === limit);
        setPage(pageNum);
        setRetryCount(0); // Reset retry on successful fetch
      } catch (err: any) {
        console.warn(`[Notification Center] Load error (page ${pageNum}):`, err.message || err);

        // Auto retry up to 2 times on initial page fetch failure
        if (pageNum === 1 && retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          fetchingRef.current = null; // Clear ref to allow retry execution
          void loadNotifications(1, isRefresh);
          return;
        }

        setError(err.message || 'Không thể tải thông báo. Vui lòng kiểm tra kết nối mạng.');
      } finally {
        fetchingRef.current = null;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [retryCount]
  );

  // Initial load checking cache first
  useEffect(() => {
    const isCacheValid = Date.now() - cacheTimestamp < CACHE_MAX_AGE_MS;
    if (isCacheValid && cacheData.length > 0) {
      setNotifications(cacheData);
      setLoading(false);
      // Fetch badge count silently to keep status sync
      void refreshGlobalBadge().catch(() => {});
    } else {
      void loadNotifications(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    // Pull to refresh explicitly bypasses cache
    void loadNotifications(1, true);
  }, [loadNotifications]);

  // Pagination trigger
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    void loadNotifications(page + 1, false);
  }, [page, hasMore, loadingMore, loading, refreshing, loadNotifications]);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    Alert.alert(
      'Đánh dấu đã đọc',
      'Bạn muốn đánh dấu tất cả thông báo là đã đọc?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đánh dấu',
          onPress: async () => {
            try {
              await apiRequest('/notifications/read-all', { method: 'PATCH' });
              
              // Map state and cache immediately
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: 1 }))
              );
              cacheData = cacheData.map((n) => ({ ...n, is_read: 1 }));
              
              // Zero out badge immediately
              updateGlobalUnread(0);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái thông báo.');
            }
          },
        },
      ]
    );
  }, []);

  // Item tap handler
  const handleItemPress = useCallback(
    (item: NotificationData) => {
      // Trigger navigation
      navigateFromNotification(item.type, router, pathname, '/(tabs)/profile');
    },
    [router, pathname]
  );

  // Date Grouping logic inside FlatList
  const getGroupedItems = (): FlatListItem[] => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const grouped: FlatListItem[] = [];
    let hasTodayHeader = false;
    let hasYesterdayHeader = false;
    let hasEarlierHeader = false;

    notifications.forEach((item) => {
      const date = new Date(item.created_at);
      const dateStr = date.toDateString();

      if (dateStr === todayStr) {
        if (!hasTodayHeader) {
          grouped.push({ type: 'header', id: 'hdr-today', title: 'Hôm nay' });
          hasTodayHeader = true;
        }
        grouped.push({ type: 'item', id: `item-${item.id}`, data: item });
      } else if (dateStr === yesterdayStr) {
        if (!hasYesterdayHeader) {
          grouped.push({ type: 'header', id: 'hdr-yesterday', title: 'Hôm qua' });
          hasYesterdayHeader = true;
        }
        grouped.push({ type: 'item', id: `item-${item.id}`, data: item });
      } else {
        if (!hasEarlierHeader) {
          grouped.push({ type: 'header', id: 'hdr-earlier', title: 'Trước đó' });
          hasEarlierHeader = true;
        }
        grouped.push({ type: 'item', id: `item-${item.id}`, data: item });
      }
    });

    return grouped;
  };

  const renderFlatListItem = useCallback(
    ({ item }: { item: FlatListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sectionHeaderText, { color: theme.colors.muted }]}>{item.title}</Text>
          </View>
        );
      }

      return (
        <NotificationItem
          item={item.data}
          onPress={handleItemPress}
        />
      );
    },
    [handleItemPress, theme]
  );

  // Skeleton / initial loading state
  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Thông báo</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={[styles.centeredState, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Đang tải thông báo...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Thông báo</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={[styles.centeredState, { backgroundColor: theme.colors.background }]}>
          <View style={styles.emojiContainer}>
            <Text style={{ fontSize: 44 }}>😿</Text>
          </View>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Lỗi kết nối</Text>
          <Text style={[styles.errorText, { color: theme.colors.muted }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => loadNotifications(1, false)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const groupedData = getGroupedItems();
  const isListEmpty = notifications.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.headerPressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Thông báo</Text>
        
        {!isListEmpty ? (
          <Pressable
            style={({ pressed }) => [styles.markReadBtn, { backgroundColor: theme.colors.surface }, pressed && styles.headerPressed]}
            onPress={handleMarkAllRead}
          >
            <Text style={[styles.markReadText, { color: theme.colors.primary }]}>Đọc tất cả</Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightPlaceholder} />
        )}
      </View>

      {/* Notification List or Empty State */}
      {isListEmpty ? (
        <View style={[styles.centeredState, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.colors.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Chưa có thông báo nào</Text>
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            Các cập nhật về nhận nuôi, nhận diện và tài khoản sẽ xuất hiện tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.id}
          renderItem={renderFlatListItem}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: SNAP_FONTS.bold,
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  markReadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  markReadText: {
    fontSize: 13,
    fontFamily: SNAP_FONTS.semibold,
    color: SNAP_COLORS.ink,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: SNAP_FONTS.semibold,
    color: '#888888',
    textTransform: 'uppercase',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: SNAP_FONTS.medium,
    color: '#666666',
  },
  emojiContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: SNAP_FONTS.bold,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: SNAP_COLORS.like,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.semibold,
    color: '#FFFFFF',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: SNAP_FONTS.bold,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.regular,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
