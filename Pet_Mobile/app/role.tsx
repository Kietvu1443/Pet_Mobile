// RoleScreen — Màn hình chọn vai trò.
//
// Nguồn dữ liệu:
//   - selectedRole   <- derived from user.preferences via getQuickRoleFromPreferences
//   - currentRole    <- user.role từ GET /auth/me
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import {
  getCurrentRoleLabel,
  getQuickRoleFromPreferences,
  type QuickRole,
} from '@/lib/profile/userRole';
import { apiRequest } from '@/lib/api/client';

type ShelterStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected';

const SHELTER_STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Chờ duyệt', bg: '#FFF8E8', color: '#B8860B' },
  approved: { label: 'Đã duyệt', bg: '#E8F8EE', color: '#34C759' },
  rejected: { label: 'Bị từ chối', bg: '#FFF0F0', color: '#FF4D4F' },
};

export default function RoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();

  const [quickRole, setQuickRole] = useState<QuickRole>(getQuickRoleFromPreferences(user?.preferences));
  const roleLabel = getCurrentRoleLabel(user?.role, quickRole);
  const [shelterStatus, setShelterStatus] = useState<ShelterStatus>('unsubmitted');
  const [shelterAdminNotes, setShelterAdminNotes] = useState<string | null>(null);

  useEffect(() => {
    setQuickRole(getQuickRoleFromPreferences(user?.preferences));
  }, [user?.preferences?.quickRole]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ shelter: { status: string; admin_notes: string | null } | null }>('/shelters');
        if (data.shelter) {
          setShelterStatus(data.shelter.status as ShelterStatus);
          setShelterAdminNotes(data.shelter.admin_notes);
        }
      } catch {
        // No shelter
      }
    })();
  }, []);

  const handleQuickRole = async (id: QuickRole) => {
    setQuickRole(id);
    try {
      await apiRequest('/auth/preferences', {
        method: 'PATCH',
        body: { preferences: { quickRole: id } },
      });
      await refreshUser();
    } catch {
      // Swallow errors — preferences are non-critical
    }
  };

  const quickRoles: {
    id: QuickRole;
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string;
    iconColor: string;
    title: string;
    desc: string;
  }[] = [
    {
      id: 'adopt',
      icon: 'paw-outline',
      iconBg: '#FFF0F7',
      iconColor: '#FF4FA3',
      title: 'Nhận nuôi',
      desc: 'Muốn mang một bé về làm bạn đồng hành.',
    },
    {
      id: 'lover',
      icon: 'heart-outline',
      iconBg: '#FFF8E8',
      iconColor: '#FFB340',
      title: 'Yêu thú cưng',
      desc: 'Lướt, thả tim, lưu yêu thích — chưa cần nhận nuôi.',
    },
  ];

  const shelterRequirements = [
    'Giấy phép hoạt động hoặc CMND đại diện',
    'Ảnh thực tế của cơ sở',
    'Xét duyệt trong 1–3 ngày làm việc',
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Vai trò</Text>
      </View>

      {/* Current Role Card */}
      <View style={[styles.currentRoleCard, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }]}>
        <View style={[styles.currentRoleIcon, { backgroundColor: theme.colors.card, shadowColor: theme.colors.primary }]}>
          <Ionicons name={quickRole === 'lover' ? 'heart' : 'paw'} size={24} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={[styles.currentRoleTag, { color: theme.colors.primary }]}>Vai trò hiện tại</Text>
          <Text style={[styles.currentRoleName, { color: theme.colors.text }]}>{roleLabel}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="sparkles" size={18} color={theme.colors.primary} style={{ flexShrink: 0, marginTop: 2 }} />
        <Text style={[styles.infoText, { color: theme.colors.muted }]}>
          Hoàn thiện đánh giá nhà ở và hồ sơ để đăng ký nhận nuôi — trại cứu hộ cần thông tin đầy đủ để cân nhắc cho bạn nhận nuôi.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.homeEvalBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, pressed && { opacity: 0.7 }]}
        onPress={() => router.push('/housing-review' as Parameters<typeof router.push>[0])}
      >
        <Ionicons name="home-outline" size={18} color={theme.colors.text} />
        <Text style={[styles.homeEvalText, { color: theme.colors.text }]}>Đánh giá nhà ở</Text>
      </Pressable>

      {/* Quick Roles Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>Đổi tức thì</Text>
        <Text style={styles.sectionBadge}>✓ Không cần duyệt</Text>
      </View>

      <View style={[styles.rolesCard, { backgroundColor: theme.colors.card }]}>
        {quickRoles.map((role, i) => {
          const isSelected = quickRole === role.id;
          return (
            <View key={role.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.roleItem,
                  { backgroundColor: isSelected ? theme.colors.selectedContainer : theme.colors.card },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => handleQuickRole(role.id)}
              >
                <View style={[styles.roleIcon, isSelected ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name={role.icon} size={22} color={isSelected ? theme.colors.primary : theme.colors.muted} />
                </View>
                <View style={styles.roleText}>
                  <Text style={[styles.roleTitle, { color: theme.colors.text }]}>{role.title}</Text>
                  <Text style={[styles.roleDesc, { color: theme.colors.muted }]}>{role.desc}</Text>
                </View>
                <View style={[styles.radioBtn, isSelected && { backgroundColor: theme.colors.primary }]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </Pressable>
              {i < quickRoles.length - 1 && <View style={[styles.roleDivider, { backgroundColor: theme.colors.border }]} />}
            </View>
          );
        })}
      </View>

      <Text style={[styles.roleNote, { color: theme.colors.muted }]}>Bạn có thể đổi lại bất cứ lúc nào.</Text>

      {/* Verified Roles Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Vai trò có xác minh</Text>
        <Text style={styles.sectionBadgeYellow}>🛡 Cần duyệt</Text>
      </View>

      <View style={[styles.shelterCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.shelterCardHeader}>
          <View style={[styles.roleIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#3A7AFE" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.shelterTitleRow}>
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Trại cứu hộ</Text>
              {shelterStatus === 'unsubmitted' ? (
                <View style={styles.notRegisteredBadge}>
                  <Text style={styles.notRegisteredText}>Chưa đăng ký</Text>
                </View>
              ) : (
                <View style={[styles.statusBadgeSmall, { backgroundColor: SHELTER_STATUS_LABEL[shelterStatus]?.bg || '#F0F0F0' }]}>
                  <Text style={[styles.statusBadgeSmallText, { color: SHELTER_STATUS_LABEL[shelterStatus]?.color || '#888' }]}>
                    {SHELTER_STATUS_LABEL[shelterStatus]?.label || shelterStatus}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.roleDesc, { color: theme.colors.muted }]}>
              Quản lý nhiều thú cưng, nhận yêu cầu nhận nuôi và xuất hiện trên bản đồ trại.
            </Text>
            {shelterAdminNotes && (
              <Text style={[styles.shelterAdminNotes, { color: theme.colors.muted }]}>Phản hồi: {shelterAdminNotes}</Text>
            )}
          </View>
        </View>
        <View style={[styles.shelterDivider, { backgroundColor: theme.colors.border }]} />
        {shelterRequirements.map((req) => (
          <View key={req} style={styles.requirementRow}>
            <Ionicons name="checkmark" size={14} color={theme.colors.muted} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text style={[styles.requirementText, { color: theme.colors.muted }]}>{req}</Text>
          </View>
        ))}
        <Pressable
          style={({ pressed }) => [styles.registerBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/shelter-registration' as Parameters<typeof router.push>[0])}
        >
          <Text style={styles.registerBtnText}>
            {shelterStatus === 'unsubmitted' ? 'Đăng ký trại cứu hộ' : shelterStatus === 'rejected' ? 'Cập nhật lại' : 'Xem chi tiết'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  // Current role card
  currentRoleCard: {
    borderRadius: 24, padding: 20, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5,
  },
  currentRoleIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  currentRoleTag: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3,
  },
  currentRoleName: { fontSize: 20, fontWeight: '800' },
  // Info card
  infoCard: {
    borderRadius: 20, padding: 16,
    marginBottom: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 21 },
  homeEvalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5,
    borderRadius: 18, paddingVertical: 15, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  homeEvalText: { fontSize: 15, fontWeight: '700' },
  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sectionBadge: { fontSize: 12, color: '#34C759', fontWeight: '700' },
  sectionBadgeYellow: { fontSize: 12, color: '#FFB340', fontWeight: '700' },
  // Roles card
  rolesCard: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4, marginBottom: 10,
  },
  roleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 18, paddingHorizontal: 20,
  },
  roleIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  roleDesc: { fontSize: 13, lineHeight: 19 },
  radioBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  roleDivider: { height: 1, marginLeft: 82 },
  roleNote: { fontSize: 13, marginBottom: 28, paddingLeft: 4 },
  // Shelter card
  shelterCard: {
    borderRadius: 22, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
  },
  shelterCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14,
  },
  shelterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  notRegisteredBadge: {
    backgroundColor: '#F0F0F0', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  notRegisteredText: { fontSize: 11, color: '#888', fontWeight: '500' },
  shelterDivider: { height: 1, marginBottom: 14 },
  requirementRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8,
  },
  requirementText: { fontSize: 13, lineHeight: 19, flex: 1 },
  registerBtn: {
    borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  registerBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  statusBadgeSmall: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  statusBadgeSmallText: { fontSize: 11, fontWeight: '700' },
  shelterAdminNotes: {
    fontSize: 12, marginTop: 6, fontStyle: 'italic',
  },
});
