// MyReportsScreen — Màn hình Quản lý Tin báo của tôi (Milestone B5).
import { useState } from 'react';
import {
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
import { useQuery } from '@tanstack/react-query';

import { fetchMyReports, type RawReportItem, type ReportStatus } from '@/lib/api/reports';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { AppDialog, type AppDialogProps } from '@/components/ui/AppDialog';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '--';
  }
}

export default function MyReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['my-reports', statusFilter],
    queryFn: async ({ signal }) => {
      const statusParam: ReportStatus | null =
        statusFilter === 'all' ? null : (statusFilter as ReportStatus);
      return fetchMyReports(
        {
          status: statusParam,
          page: 1,
          limit: 50,
        },
        signal,
      );
    },
  });

  const reports: RawReportItem[] = data?.data || [];
  const summary = data?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };

  const handleOpenDetail = (item: RawReportItem) => {
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
  };

  const handleShowCreateSheet = () => {
    setDialogConfig({
      visible: true,
      variant: 'info',
      iconName: 'add-circle-outline',
      title: 'Đăng tin báo mới',
      message: 'Bạn muốn đăng tin tìm thú cưng bị thất lạc hay báo tin nhặt được thú cưng?',
      confirmText: 'Báo mất thú cưng',
      cancelText: 'Báo nhặt được',
      onConfirm: () => {
        setDialogConfig(null);
        router.push('/report-lost');
      },
      onCancel: () => {
        setDialogConfig(null);
        router.push('/report-found');
      },
    });
  };

  const FILTER_TABS: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: summary.total },
    { id: 'pending', label: 'Chờ duyệt', count: summary.pending },
    { id: 'approved', label: 'Đã duyệt', count: summary.approved },
    { id: 'rejected', label: 'Từ chối', count: summary.rejected },
  ];

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Top bar */}
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
            <Text style={[styles.headerTag, { color: theme.colors.primary }]}>
              QUẢN LÝ
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Tin báo của tôi
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleShowCreateSheet}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addBtnText}>Tạo tin</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {FILTER_TABS.map(({ id, label, count }) => {
          const active = statusFilter === id;
          return (
            <Pressable
              key={id}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.card,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setStatusFilter(id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? 'white' : theme.colors.text },
                ]}
              >
                {label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: active
                        ? 'rgba(255, 255, 255, 0.25)'
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: active ? 'white' : theme.colors.text },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderReportCard = ({ item }: { item: RawReportItem }) => {
    const isLost = item.type === 'lost';
    const imageUrl = resolveImageUrl(item.image);

    const statusConfig = (() => {
      switch (item.status) {
        case 'approved':
          return { label: 'Đã duyệt', bg: '#DCFCE7', color: '#15803D' };
        case 'rejected':
          return { label: 'Từ chối', bg: '#FEE2E2', color: '#B91C1C' };
        default:
          return { label: 'Chờ duyệt', bg: '#FEF3C7', color: '#B45309' };
      }
    })();

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          pressed && { opacity: 0.88 },
        ]}
        onPress={() => handleOpenDetail(item)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.cardImage,
              { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <Ionicons name="paw" size={28} color={theme.colors.muted} />
          </View>
        )}

        <View style={styles.cardInfo}>
          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isLost ? '#FEE2E2' : '#DCFCE7' },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: isLost ? '#DC2626' : '#059669' },
                ]}
              >
                {isLost ? 'Thất lạc' : 'Nhặt được'}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.reporter_name || (isLost ? 'Báo mất thú cưng' : 'Báo nhặt được thú cưng')}
          </Text>

          {Boolean(item.description) && (
            <Text style={[styles.cardDesc, { color: theme.colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
            <Text style={[styles.metaText, { color: theme.colors.muted }]} numberOfLines={1}>
              {item.location || 'Chưa rõ địa điểm'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={theme.colors.muted} />
            <Text style={[styles.metaText, { color: theme.colors.muted }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ paddingTop: 20 }}>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={[
                styles.card,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={[styles.cardImage, { backgroundColor: theme.colors.surface }]} />
              <View style={[styles.cardInfo, { gap: 8 }]}>
                <View style={{ width: 100, height: 16, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
                <View style={{ width: '80%', height: 18, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
                <View style={{ width: '60%', height: 14, backgroundColor: theme.colors.surface, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color={theme.colors.error} />
          <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
            Không thể tải tin báo
          </Text>
          <Text style={[styles.stateDesc, { color: theme.colors.muted }]}>
            {error instanceof Error ? error.message : 'Vui lòng kiểm tra kết nối mạng.'}
          </Text>
          <Pressable
            style={[styles.actionCtaBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.actionCtaText}>Thử lại</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="newspaper-outline" size={38} color={theme.colors.muted} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
          Chưa có tin báo nào
        </Text>
        <Text style={[styles.stateDesc, { color: theme.colors.muted }]}>
          {statusFilter === 'all'
            ? 'Bạn chưa đăng tin báo thất lạc hay nhặt được thú cưng nào.'
            : 'Không có tin báo nào phù hợp với bộ lọc hiện tại.'}
        </Text>
        <Pressable
          style={[styles.actionCtaBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleShowCreateSheet}
        >
          <Ionicons name="add-circle" size={18} color="white" />
          <Text style={styles.actionCtaText}>Đăng tin ngay</Text>
        </Pressable>
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
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
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
  content: { paddingHorizontal: 20 },
  headerArea: { marginBottom: 16 },
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  addBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  tabBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11.5,
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  stateDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  actionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  actionCtaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
