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
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Vai trò</Text>
      </View>

      {/* Current Role Card */}
      <View style={styles.currentRoleCard}>
        <View style={styles.currentRoleIcon}>
          <Ionicons name={quickRole === 'lover' ? 'heart' : 'paw'} size={24} color="#FF4FA3" />
        </View>
        <View>
          <Text style={styles.currentRoleTag}>Vai trò hiện tại</Text>
          <Text style={styles.currentRoleName}>{roleLabel}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="sparkles" size={18} color="#FF4FA3" style={{ flexShrink: 0, marginTop: 2 }} />
        <Text style={styles.infoText}>
          Hoàn thiện đánh giá nhà ở và hồ sơ để đăng ký nhận nuôi — trại cứu hộ cần thông tin đầy đủ để cân nhắc cho bạn nhận nuôi.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.homeEvalBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.push('/housing-review' as Parameters<typeof router.push>[0])}
      >
        <Ionicons name="home-outline" size={18} color="#1A1A1A" />
        <Text style={styles.homeEvalText}>Đánh giá nhà ở</Text>
      </Pressable>

      {/* Quick Roles Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Đổi tức thì</Text>
        <Text style={styles.sectionBadge}>✓ Không cần duyệt</Text>
      </View>

      <View style={styles.rolesCard}>
        {quickRoles.map((role, i) => {
          const isSelected = quickRole === role.id;
          return (
            <View key={role.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.roleItem,
                  isSelected && styles.roleItemActive,
                  pressed && { opacity: 0.85 },
                ]}
                // TODO: Persist role change via backend endpoint when available
                onPress={() => handleQuickRole(role.id)}
              >
                <View style={[styles.roleIcon, { backgroundColor: role.iconBg }]}>
                  <Ionicons name={role.icon} size={22} color={role.iconColor} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDesc}>{role.desc}</Text>
                </View>
                <View style={[styles.radioBtn, isSelected && styles.radioBtnActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
              </Pressable>
              {i < quickRoles.length - 1 && <View style={styles.roleDivider} />}
            </View>
          );
        })}
      </View>

      <Text style={styles.roleNote}>Bạn có thể đổi lại bất cứ lúc nào.</Text>

      {/* Verified Roles Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Vai trò có xác minh</Text>
        <Text style={styles.sectionBadgeYellow}>🛡 Cần duyệt</Text>
      </View>

      <View style={styles.shelterCard}>
        <View style={styles.shelterCardHeader}>
          <View style={[styles.roleIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#3A7AFE" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.shelterTitleRow}>
              <Text style={styles.roleTitle}>Trại cứu hộ</Text>
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
            <Text style={styles.roleDesc}>
              Quản lý nhiều thú cưng, nhận yêu cầu nhận nuôi và xuất hiện trên bản đồ trại.
            </Text>
            {shelterAdminNotes && (
              <Text style={styles.shelterAdminNotes}>Phản hồi: {shelterAdminNotes}</Text>
            )}
          </View>
        </View>
        <View style={styles.shelterDivider} />
        {shelterRequirements.map((req) => (
          <View key={req} style={styles.requirementRow}>
            <Ionicons name="checkmark" size={14} color="#BBBBBB" style={{ flexShrink: 0, marginTop: 2 }} />
            <Text style={styles.requirementText}>{req}</Text>
          </View>
        ))}
        <Pressable
          style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.85 }]}
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
  screen: { flex: 1, backgroundColor: '#FFF9FC' },
  content: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  // Current role card
  currentRoleCard: {
    borderRadius: 24, padding: 20, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF0F7',
    borderWidth: 1.5, borderColor: '#FFBBD8',
  },
  currentRoleIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  currentRoleTag: {
    fontSize: 11, fontWeight: '700', color: '#FF83C4',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3,
  },
  currentRoleName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  // Info card
  infoCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    marginBottom: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  infoText: { fontSize: 13, color: '#555', flex: 1, lineHeight: 21 },
  homeEvalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'white', borderWidth: 1.5, borderColor: '#EEE',
    borderRadius: 18, paddingVertical: 15, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  homeEvalText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAAAAA',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sectionBadge: { fontSize: 12, color: '#34C759', fontWeight: '700' },
  sectionBadgeYellow: { fontSize: 12, color: '#FFB340', fontWeight: '700' },
  // Roles card
  rolesCard: {
    backgroundColor: 'white', borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4, marginBottom: 10,
  },
  roleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 18, paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  roleItemActive: { backgroundColor: '#FFF9FC' },
  roleIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  roleDesc: { fontSize: 13, color: '#888', lineHeight: 19 },
  radioBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioBtnActive: { backgroundColor: '#FF4FA3' },
  roleDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 82 },
  roleNote: { fontSize: 13, color: '#AAAAAA', marginBottom: 28, paddingLeft: 4 },
  // Shelter card
  shelterCard: {
    backgroundColor: 'white', borderRadius: 22, padding: 20,
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
  shelterDivider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 },
  requirementRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8,
  },
  requirementText: { fontSize: 13, color: '#777', lineHeight: 19, flex: 1 },
  registerBtn: {
    backgroundColor: '#3A7AFE', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#3A7AFE', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  registerBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  statusBadgeSmall: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  statusBadgeSmallText: { fontSize: 11, fontWeight: '700' },
  shelterAdminNotes: {
    fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic',
  },
});
