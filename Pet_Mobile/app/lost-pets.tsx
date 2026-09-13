// LostPetsScreen — Màn hình Thú cưng Thất lạc & Tìm thấy (Milestone B).
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchPublicReports, type RawReportItem, type ReportType } from '@/lib/api/reports';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { AppDialog, type AppDialogProps } from '@/components/ui/AppDialog';

type FilterType = 'all' | 'lost' | 'found';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '--';
  }
}

export default function LostPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [filter, setFilter] = useState<FilterType>('all');
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  // TanStack Query Infinite Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['reports', filter],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal }) => {
      const typeParam: ReportType | null = filter === 'all' ? null : filter;
      return fetchPublicReports(
        {
          type: typeParam,
          page: pageParam as number,
          limit: 12,
        },
        signal,
      );
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  // Flatten all reports from all loaded pages (reading data.data)
  const reports: RawReportItem[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data || []);
  }, [data]);

  const lostCount = useMemo(() => {
    return reports.filter((r) => r.type === 'lost').length;
  }, [reports]);

  const handleOpenDetail = useCallback((item: RawReportItem) => {
    router.push({
      pathname: `/report/[id]`,
      params: {
        id: String(item.id),
        type: item.type,
        status: item.status ?? '',
        description: item.description ?? '',
        location: item.location ?? '',
        reporter_name: item.reporter_name ?? '',
        phone: item.phone ?? '',
        created_at: item.created_at ?? '',
        image: item.image ?? '',
      },
    });
  }, [router]);

  const FILTER_OPTIONS: { id: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'Tất cả', icon: 'paw-outline' },
    { id: 'lost', label: 'Thất lạc', icon: 'alert-circle-outline' },
    { id: 'found', label: 'Báo tin nhặt được', icon: 'compass-outline' },
  ];

  const renderHeader = () => (
    <View>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.colors.card },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTag, { color: theme.colors.warning }]}>
              HỖ TRỢ TÌM KIẾM
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Thú cưng thất lạc
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.myReportsBtn,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push('/my-reports')}
        >
          <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.myReportsText, { color: theme.colors.primary }]}>
            Tin của tôi
          </Text>
        </Pressable>
      </View>

      {/* Alert Banner */}
      <View
        style={[
          styles.alertBanner,
          {
            backgroundColor: theme.colors.warningContainer,
            borderColor: theme.colors.warning,
          },
        ]}
      >
        <View style={[styles.alertIcon, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
            {lostCount > 0 ? `Hiện có ${lostCount} tin báo thất lạc cần hỗ trợ` : 'Cộng đồng tìm kiếm thú cưng'}
          </Text>
          <Text style={[styles.alertDesc, { color: theme.colors.muted }]}>
            Nếu bạn thấy thú cưng đi lạc hoặc bị mất bé, hãy đăng tin để cộng đồng cùng hỗ trợ tìm kiếm kịp thời.
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(({ id, label, icon }) => {
          const isActive = filter === id;
          return (
            <Pressable
              key={id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setFilter(id)}
            >
              <Ionicons
                name={icon}
                size={14}
                color={isActive ? 'white' : theme.colors.muted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? 'white' : theme.colors.text },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderReportCard = ({ item }: { item: RawReportItem }) => {
    const isLost = item.type === 'lost';
    const imageUrl = resolveImageUrl(item.image);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.reportCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: isLost
              ? theme.colors.warningContainer
              : theme.colors.successContainer,
          },
          pressed && { opacity: 0.88 },
        ]}
        onPress={() => handleOpenDetail(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.reportImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.reportImage,
              {
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Ionicons name="paw" size={32} color={theme.colors.muted} />
          </View>
        )}

        <View style={styles.reportInfo}>
          <View style={styles.reportBadgeRow}>
            <View
              style={[
                styles.reportTypeBadge,
                {
                  backgroundColor: isLost
                    ? `${theme.colors.warning}22`
                    : `${theme.colors.success}22`,
                },
              ]}
            >
              <Ionicons
                name={isLost ? 'alert-circle' : 'checkmark-circle'}
                size={12}
                color={isLost ? theme.colors.warning : theme.colors.success}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  styles.reportTypeBadgeText,
                  { color: isLost ? theme.colors.warning : theme.colors.success },
                ]}
              >
                {isLost ? 'Thất lạc' : 'Tìm thấy thú cưng'}
              </Text>
            </View>
          </View>

          <Text style={[styles.reportName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.reporter_name || (isLost ? 'Thú cưng thất lạc' : 'Thú cưng nhặt được')}
          </Text>

          {Boolean(item.description) && (
            <Text style={[styles.reportDesc, { color: theme.colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.reportMetaRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
            <Text style={[styles.reportLocation, { color: theme.colors.muted }]} numberOfLines={1}>
              {item.location || 'Chưa rõ địa điểm'}
            </Text>
          </View>

          <View style={styles.reportMetaRow}>
            <Ionicons name="calendar-outline" size={12} color={theme.colors.muted} />
            <Text style={[styles.reportDate, { color: theme.colors.muted }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.footerLoaderText, { color: theme.colors.muted }]}>
            Đang tải thêm tin báo...
          </Text>
        </View>
      );
    }
    return <View style={{ height: 100 }} />;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={[
                styles.reportCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View
                style={[styles.reportImage, { backgroundColor: theme.colors.surface }]}
              />
              <View style={[styles.reportInfo, { gap: 8 }]}>
                <View
                  style={{
                    width: 70,
                    height: 16,
                    backgroundColor: theme.colors.surface,
                    borderRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: '70%',
                    height: 18,
                    backgroundColor: theme.colors.surface,
                    borderRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: '90%',
                    height: 14,
                    backgroundColor: theme.colors.surface,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Không thể tải danh sách
          </Text>
          <Text style={[styles.errorDesc, { color: theme.colors.muted }]}>
            {error instanceof Error ? error.message : 'Vui lòng kiểm tra kết nối mạng.'}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search-outline" size={36} color={theme.colors.muted} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Chưa có tin báo nào
        </Text>
        <Text style={[styles.emptyDesc, { color: theme.colors.muted }]}>
          Hiện tại chưa có tin báo thú cưng nào trong danh mục này.
        </Text>
        {filter !== 'all' && (
          <Pressable
            style={[styles.resetFilterBtn, { borderColor: theme.colors.border }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.resetFilterText, { color: theme.colors.primary }]}>
              Xem tất cả tin báo
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReportCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 30 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
      />

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: Math.max(16, insets.bottom + 8) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.fabBtn,
            styles.fabLostBtn,
            { backgroundColor: '#DC2626' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/report-lost');
          }}
        >
          <Ionicons name="alert-circle" size={18} color="white" />
          <Text style={styles.fabText}>Báo mất pet</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.fabBtn,
            styles.fabFoundBtn,
            { backgroundColor: '#059669' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/report-found');
          }}
        >
          <Ionicons name="compass" size={18} color="white" />
          <Text style={styles.fabText}>Báo nhặt được</Text>
        </Pressable>
      </View>

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
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  myReportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  myReportsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertBanner: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 3 },
  alertDesc: { fontSize: 12, lineHeight: 17 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12.5, fontWeight: '600' },
  // Report Card
  reportCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    flexShrink: 0,
  },
  reportInfo: { flex: 1, minWidth: 0 },
  reportBadgeRow: { marginBottom: 4 },
  reportTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
  },
  reportTypeBadgeText: { fontSize: 10.5, fontWeight: '700' },
  reportName: { fontSize: 15.5, fontWeight: '800', marginBottom: 2 },
  reportDesc: { fontSize: 12, lineHeight: 16, marginBottom: 5 },
  reportMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  reportLocation: { fontSize: 11.5, flex: 1 },
  reportDate: { fontSize: 11.5 },
  // States
  skeletonContainer: { paddingTop: 10 },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  errorDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  resetFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetFilterText: { fontSize: 13, fontWeight: '600' },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  footerLoaderText: { fontSize: 12 },
  // FAB Floating buttons
  fabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  fabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  fabLostBtn: {},
  fabFoundBtn: {},
  fabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});
