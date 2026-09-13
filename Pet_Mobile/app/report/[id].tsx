// ReportDetailScreen — Màn hình chi tiết tin báo thất lạc / nhặt được (Milestone B2).
// Backend KHÔNG có GET /reports/:id — Sử dụng dữ liệu từ navigation params hoặc TanStack Query cache.
import { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
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
import { useQueryClient } from '@tanstack/react-query';

import { resolveImageUrl } from '@/lib/images/resolveUrl';
import { useTheme } from '@/lib/theme/ThemeContext';
import { AppDialog, type AppDialogProps } from '@/components/ui/AppDialog';
import type { RawReportItem, MyReportsResponse } from '@/lib/api/reports';

function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return 'Không xác định';
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ngày ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return 'Không xác định';
  }
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id: string;
    type?: string;
    status?: string;
    description?: string;
    location?: string;
    reporter_name?: string;
    phone?: string;
    created_at?: string;
    image?: string;
  }>();

  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const reportId = Number(params.id);

  // 1. Dò tìm dữ liệu từ params hoặc cache của TanStack Query (KHÔNG gọi API get detail)
  const report: RawReportItem | null = useMemo(() => {
    // Nếu có ít nhất type hoặc description từ params
    if (params.type || params.description || params.reporter_name) {
      return {
        id: reportId,
        type: (params.type === 'found' ? 'found' : 'lost') as 'lost' | 'found',
        status: (params.status || 'approved') as any,
        description: params.description || null,
        location: params.location || null,
        reporter_name: params.reporter_name || null,
        phone: params.phone || null,
        created_at: params.created_at || null,
        image: params.image || null,
      };
    }

    // Tra cứu trong cache các query ['reports']
    const publicQueries = queryClient.getQueriesData<any>({ queryKey: ['reports'] });
    for (const [, qData] of publicQueries) {
      if (qData?.pages) {
        for (const page of qData.pages) {
          const found = (page.data as RawReportItem[])?.find((r) => r.id === reportId);
          if (found) return found;
        }
      }
    }

    // Tra cứu trong cache ['my-reports']
    const myReportsQueries = queryClient.getQueriesData<MyReportsResponse>({ queryKey: ['my-reports'] });
    for (const [, qData] of myReportsQueries) {
      if (qData?.data) {
        const found = qData.data.find((r) => r.id === reportId);
        if (found) return found;
      }
    }

    return null;
  }, [params, reportId, queryClient]);

  const isLost = report?.type === 'lost';
  const imageUrl = report?.image ? resolveImageUrl(report.image) : null;

  // Actions: Gọi điện, SMS, Chia sẻ
  const handleCall = () => {
    if (!report?.phone) {
      setDialogConfig({
        visible: true,
        variant: 'info',
        title: 'Chưa có số điện thoại',
        message: 'Tin báo này không để lại số điện thoại liên hệ.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    Linking.openURL(`tel:${report.phone}`).catch(() => {
      setDialogConfig({
        visible: true,
        variant: 'error',
        title: 'Không thể thực hiện cuộc gọi',
        message: `Vui lòng quay số trực tiếp: ${report.phone}`,
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
    });
  };

  const handleSms = () => {
    if (!report?.phone) {
      setDialogConfig({
        visible: true,
        variant: 'info',
        title: 'Chưa có số điện thoại',
        message: 'Tin báo này không để lại số điện thoại liên hệ.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    const defaultMsg = isLost
      ? `Chào bạn, tôi có thông tin về bé thú cưng bạn đăng tìm trên Pet Helper.`
      : `Chào bạn, tôi là người tìm kiếm thú cưng liên quan đến tin bạn nhặt được trên Pet Helper.`;

    Linking.openURL(`sms:${report.phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(defaultMsg)}`).catch(() => {
      setDialogConfig({
        visible: true,
        variant: 'error',
        title: 'Không thể mở ứng dụng tin nhắn',
        message: `Vui lòng nhắn tin trực tiếp đến số: ${report.phone}`,
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
    });
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      const typeLabel = isLost ? 'Tìm kiếm thú cưng thất lạc' : 'Báo tin nhặt được thú cưng';
      const shareMsg = `[Pet Helper - ${typeLabel}]\n${report.reporter_name ? `Người liên hệ: ${report.reporter_name}\n` : ''}${report.location ? `Địa điểm: ${report.location}\n` : ''}${report.description ? `Mô tả: ${report.description}\n` : ''}${report.phone ? `SĐT: ${report.phone}\n` : ''}Cùng chia sẻ để sớm tìm lại bé nhé!`;

      await Share.share({
        title: typeLabel,
        message: shareMsg,
      });
    } catch {
      // Ignored
    }
  };

  // Fallback UI khi không tìm thấy report trong params/cache
  if (!report) {
    return (
      <View style={[styles.screen, styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.fallbackCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="document-text-outline" size={54} color={theme.colors.muted} />
          <Text style={[styles.fallbackTitle, { color: theme.colors.text }]}>
            Không tìm thấy thông tin tin báo
          </Text>
          <Text style={[styles.fallbackDesc, { color: theme.colors.muted }]}>
            Dữ liệu tin báo này không khả dụng trong phiên hiện tại hoặc đã bị gỡ bỏ.
          </Text>
          <Pressable
            style={[styles.backToListBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color="white" />
            <Text style={styles.backToListBtnText}>Quay lại danh sách</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(90, insets.bottom + 80) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Image */}
        <View style={styles.heroWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.heroImagePlaceholder,
                { backgroundColor: isLost ? theme.colors.warningContainer : theme.colors.successContainer },
              ]}
            >
              <Ionicons
                name="paw"
                size={80}
                color={isLost ? theme.colors.warning : theme.colors.success}
              />
            </View>
          )}

          {/* Top Bar Floating Buttons */}
          <View style={[styles.topBar, { top: insets.top + 10 }]}>
            <Pressable
              style={({ pressed }) => [styles.glassBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.glassBtn, pressed && { opacity: 0.7 }]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Type Badge Floating Overlay */}
          <View style={styles.badgeOverlay}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isLost ? '#DC2626' : '#059669' },
              ]}
            >
              <Ionicons
                name={isLost ? 'alert-circle' : 'compass'}
                size={14}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.typeBadgeText}>
                {isLost ? 'THÚ CƯNG THẤT LẠC' : 'TÌM THẤY THÚ CƯNG'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentWrap}>
          {/* Main Title & Time */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {report.reporter_name || (isLost ? 'Tin báo thất lạc thú cưng' : 'Tin báo nhặt được thú cưng')}
          </Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
            <Text style={[styles.timeText, { color: theme.colors.muted }]}>
              Đăng vào: {formatFullDate(report.created_at)}
            </Text>
          </View>

          {/* Location Box */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>
                {isLost ? 'Khu vực thất lạc' : 'Địa điểm tìm thấy'}
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {report.location || 'Chưa cập nhật vị trí cụ thể'}
              </Text>
            </View>
          </View>

          {/* Contact Box */}
          {Boolean(report.phone || report.reporter_name) && (
            <View
              style={[
                styles.infoCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={[styles.infoIconWrap, { backgroundColor: `${theme.colors.success}18` }]}>
                <Ionicons name="person" size={20} color={theme.colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>
                  Người liên hệ
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {report.reporter_name || 'Người dùng ẩn danh'}
                </Text>
                {Boolean(report.phone) && (
                  <Text style={[styles.phoneValue, { color: theme.colors.primary }]}>
                    📞 {report.phone}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Thông tin chi tiết & đặc điểm
            </Text>
            <View
              style={[
                styles.descCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.descText, { color: theme.colors.text }]}>
                {report.description || 'Chưa có thông tin mô tả chi tiết cho tin báo này.'}
              </Text>
            </View>
          </View>

          {/* Safety Notice */}
          <View
            style={[
              styles.noticeBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.muted} />
            <Text style={[styles.noticeText, { color: theme.colors.muted }]}>
              Lưu ý an toàn: Hãy gặp mặt ở nơi công cộng khi trao đổi nhận lại thú cưng và xác minh cẩn thận sổ sức khỏe hoặc đặc điểm riêng của bé.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Contact Bar */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.smsBtn,
            { borderColor: theme.colors.border },
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleSms}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.text} />
          <Text style={[styles.smsBtnText, { color: theme.colors.text }]}>Gửi SMS</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.callBtn,
            { backgroundColor: isLost ? '#DC2626' : '#059669' },
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleCall}
        >
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.callBtnText}>Gọi điện ngay</Text>
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
  centerScreen: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackDesc: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backToListBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  heroWrap: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    zIndex: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 18,
  },
  timeText: {
    fontSize: 12.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  phoneValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionWrap: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  descCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 24,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  smsBtn: {
    borderWidth: 1.5,
  },
  smsBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  callBtn: {},
  callBtnText: {
    color: 'white',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
