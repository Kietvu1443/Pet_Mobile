import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

type HousingType = 'apartment' | 'rental' | 'house' | null;
type OutdoorSpace = 'none' | 'balcony' | 'garden' | null;
type YesNo = 'yes' | 'no' | null;
type TimeAtHome = 'under4' | '4to8' | 'over8' | null;
type Experience = 'none' | '1to2' | 'over2' | null;
type Income = 'u5m' | '5-10m' | '10-20m' | 'o20m' | null;

type ReviewStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected';

const STATUS_LABEL: Record<ReviewStatus, { label: string; bg: string; border: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  unsubmitted: { label: 'Chưa gửi', bg: '#F5F5F5', border: '#E0E0E0', text: '#888', icon: 'time-outline' },
  pending: { label: 'Chờ duyệt', bg: '#FFF8E8', border: '#FFD699', text: '#B8860B', icon: 'hourglass-outline' },
  approved: { label: 'Đã duyệt', bg: '#E8F8EE', border: '#A8E6C1', text: '#34C759', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Bị từ chối', bg: '#FFF0F0', border: '#FFC0C0', text: '#FF4D4F', icon: 'close-circle-outline' },
};

type ReviewData = {
  id: number;
  house_type: string | null;
  own_or_rent: string | null;
  has_allergies: boolean | number;
  has_pets: boolean | number;
  outdoor_space: string | null;
  has_children: boolean | number;
  time_at_home: string | null;
  experience: string | null;
  income: string | null;
  when_away: string[] | null;
  status: string;
  admin_notes: string | null;
};

function SectionHeader({ icon, title, badge, badgeColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={16} color="#FF4FA3" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge && (
        <Text style={[styles.sectionBadge, { color: badgeColor || '#9CA3AF' }]}>{badge}</Text>
      )}
    </View>
  );
}

function CardOption({ label, sublabel, icon, selected, onSelect, disabled }: {
  label: string;
  sublabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardOption,
        selected && styles.cardOptionSelected,
        disabled && { opacity: 0.6 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
      onPress={disabled ? undefined : onSelect}
    >
      <Ionicons name={icon} size={26} color={selected ? '#FF4FA3' : '#6B7280'} />
      <Text style={[styles.cardOptionLabel, selected && styles.cardOptionLabelSelected]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.cardOptionSublabel, selected && styles.cardOptionSublabelSelected]}>
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}

function PillOption({ label, sublabel, selected, onSelect, fullWidth, disabled }: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onSelect: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pillOption,
        selected && styles.pillOptionSelected,
        fullWidth && { flex: 1 },
        disabled && { opacity: 0.6 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
      onPress={disabled ? undefined : onSelect}
    >
      <Text style={[styles.pillOptionLabel, selected && styles.pillOptionLabelSelected]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.pillOptionSublabel, selected && styles.pillOptionSublabelSelected]}>
          {sublabel}
        </Text>
      )}
    </Pressable>
  );
}

function CheckboxRow({ label, checked, onToggle, disabled }: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.checkboxRow,
        checked && styles.checkboxRowSelected,
        disabled && { opacity: 0.6 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
      onPress={disabled ? undefined : onToggle}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={13} color="white" />}
      </View>
      <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HousingReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('unsubmitted');
  const [adminNotes, setAdminNotes] = useState<string | null>(null);

  const [housingType, setHousingType] = useState<HousingType>(null);
  const [outdoorSpace, setOutdoorSpace] = useState<OutdoorSpace>(null);
  const [hasPets, setHasPets] = useState<YesNo>(null);
  const [hasChildren, setHasChildren] = useState<YesNo>(null);
  const [timeAtHome, setTimeAtHome] = useState<TimeAtHome>(null);
  const [experience, setExperience] = useState<Experience>(null);
  const [income, setIncome] = useState<Income>(null);
  const [whenAway, setWhenAway] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isEditable = reviewStatus === 'unsubmitted' || reviewStatus === 'rejected';

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ review: ReviewData | null }>('/housing-reviews/active');
        const review = data.review;
        if (review) {
          setExistingId(review.id);
          setReviewStatus(review.status as ReviewStatus);
          setAdminNotes(review.admin_notes);

          if (review.house_type) setHousingType(review.house_type as HousingType);
          if (review.has_pets !== undefined && review.has_pets !== null) setHasPets(Number(review.has_pets) ? 'yes' : 'no');
          if (review.has_children !== undefined && review.has_children !== null) setHasChildren(Number(review.has_children) ? 'yes' : 'no');
          if (review.outdoor_space) setOutdoorSpace(review.outdoor_space as OutdoorSpace);
          if (review.time_at_home) setTimeAtHome(review.time_at_home as TimeAtHome);
          if (review.experience) setExperience(review.experience as Experience);
          if (review.income) setIncome(review.income as Income);
          if (review.when_away && Array.isArray(review.when_away)) setWhenAway(review.when_away);
        }
      } catch {
        // No review exists — show empty form
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleWhenAway = (val: string) => {
    setWhenAway(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleCommitment = (val: string) => {
    setCommitments(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const canSave = commitments.length === 2;

  const handleSave = async () => {
    if (saving || !canSave || !isEditable) return;
    setSaving(true);
    try {
      const body = {
        house_type: housingType,
        own_or_rent: 'rent',
        has_allergies: false,
        has_pets: hasPets === 'yes',
        outdoor_space: outdoorSpace,
        has_children: hasChildren === 'yes',
        time_at_home: timeAtHome,
        experience,
        income,
        when_away: whenAway.length > 0 ? whenAway : null,
      };

      if (existingId && reviewStatus === 'rejected') {
        await apiRequest(`/housing-reviews/my?id=${existingId}`, { method: 'PATCH', body });
      } else {
        await apiRequest('/housing-reviews/my', { method: 'POST', body });
      }

      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể lưu đánh giá');
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = STATUS_LABEL[reviewStatus];

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#FF4FA3" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Đánh giá nhà ở</Text>
        </View>

        {/* Review status banner */}
        {reviewStatus !== 'unsubmitted' && (
          <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={statusInfo.icon} size={18} color={statusInfo.text} />
              <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>
            {adminNotes && (
              <Text style={[styles.adminNotes, { color: statusInfo.text, marginTop: 6, fontWeight: '500' }]}>
                Phản hồi: {adminNotes}
              </Text>
            )}
          </View>
        )}

        {!isEditable && (
          <View style={styles.readonlyNotice}>
            <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF" />
            <Text style={styles.readonlyNoticeText}>Đánh giá đã được gửi và không thể chỉnh sửa</Text>
          </View>
        )}

        <Text style={styles.headerDesc}>
          Cập nhật để chúng tôi đề xuất các bé phù hợp với không gian và thói quen của bạn, đồng thời tăng tỉ lệ được duyệt nhận nuôi.
        </Text>

        {/* 1. Không gian sống */}
        <SectionHeader icon="home-outline" title="Không gian sống của bạn" />
        <View style={styles.cardRow}>
          <CardOption label="Căn hộ" sublabel="Chung cư, tập thể" icon="business-outline" selected={housingType === 'apartment'} onSelect={() => setHousingType('apartment')} disabled={!isEditable} />
          <CardOption label="Phòng thuê" sublabel="Nhà trọ, ở ghép" icon="home-outline" selected={housingType === 'rental'} onSelect={() => setHousingType('rental')} disabled={!isEditable} />
          <CardOption label="Nhà riêng" sublabel="Nhà mặt đất" icon="home-outline" selected={housingType === 'house'} onSelect={() => setHousingType('house')} disabled={!isEditable} />
        </View>

        {/* 2. Không gian ngoài trời */}
        <SectionHeader icon="flower-outline" title="Không gian ngoài trời" badge="TUỲ CHỌN" />
        <View style={styles.pillRow}>
          <PillOption label="Không có" selected={outdoorSpace === 'none'} onSelect={() => setOutdoorSpace('none')} disabled={!isEditable} />
          <PillOption label="Ban công" selected={outdoorSpace === 'balcony'} onSelect={() => setOutdoorSpace('balcony')} disabled={!isEditable} />
          <PillOption label="Sân / vườn" selected={outdoorSpace === 'garden'} onSelect={() => setOutdoorSpace('garden')} disabled={!isEditable} />
        </View>

        {/* 3. Thú cưng khác */}
        <SectionHeader icon="paw-outline" title="Bạn đã có thú cưng khác?" />
        <View style={styles.pillRow}>
          <PillOption label="Có" selected={hasPets === 'yes'} onSelect={() => setHasPets('yes')} fullWidth disabled={!isEditable} />
          <PillOption label="Không" selected={hasPets === 'no'} onSelect={() => setHasPets('no')} fullWidth disabled={!isEditable} />
        </View>

        {/* 4. Trẻ em */}
        <SectionHeader icon="people-outline" title="Có trẻ em dưới 12 tuổi trong nhà?" />
        <View style={styles.pillRow}>
          <PillOption label="Có" selected={hasChildren === 'yes'} onSelect={() => setHasChildren('yes')} fullWidth disabled={!isEditable} />
          <PillOption label="Không" selected={hasChildren === 'no'} onSelect={() => setHasChildren('no')} fullWidth disabled={!isEditable} />
        </View>

        {/* 5. Thời gian ở nhà */}
        <SectionHeader icon="time-outline" title="Thời gian ở nhà mỗi ngày" badge="TUỲ CHỌN" />
        <View style={styles.cardRow}>
          <CardOption label="< 4 giờ" sublabel="Đi làm cả ngày" icon="time-outline" selected={timeAtHome === 'under4'} onSelect={() => setTimeAtHome('under4')} disabled={!isEditable} />
          <CardOption label="4 – 8 giờ" sublabel="Có ở nhà buổi tối" icon="time-outline" selected={timeAtHome === '4to8'} onSelect={() => setTimeAtHome('4to8')} disabled={!isEditable} />
          <CardOption label="> 8 giờ" sublabel="Làm việc tại nhà" icon="time-outline" selected={timeAtHome === 'over8'} onSelect={() => setTimeAtHome('over8')} disabled={!isEditable} />
        </View>

        {/* 6. Kinh nghiệm */}
        <SectionHeader icon="ribbon-outline" title="Kinh nghiệm nuôi thú cưng" badge="TUỲ CHỌN" />
        <View style={styles.cardRow}>
          <CardOption label="Chưa có" sublabel="Lần đầu nuôi" icon="ribbon-outline" selected={experience === 'none'} onSelect={() => setExperience('none')} disabled={!isEditable} />
          <CardOption label="1 – 2 năm" sublabel="Đã từng nuôi" icon="ribbon-outline" selected={experience === '1to2'} onSelect={() => setExperience('1to2')} disabled={!isEditable} />
          <CardOption label="Trên 2 năm" sublabel="Nhiều kinh nghiệm" icon="ribbon-outline" selected={experience === 'over2'} onSelect={() => setExperience('over2')} disabled={!isEditable} />
        </View>

        {/* 7. Thu nhập */}
        <SectionHeader icon="cash-outline" title="Thu nhập hàng tháng" badge="TUỲ CHỌN" />
        <View style={styles.pillRow}>
          <PillOption label="< 5 triệu" selected={income === 'u5m'} onSelect={() => setIncome('u5m')} disabled={!isEditable} />
          <PillOption label="5 – 10 triệu" selected={income === '5-10m'} onSelect={() => setIncome('5-10m')} disabled={!isEditable} />
          <PillOption label="10 – 20 triệu" selected={income === '10-20m'} onSelect={() => setIncome('10-20m')} disabled={!isEditable} />
          <PillOption label="> 20 triệu" selected={income === 'o20m'} onSelect={() => setIncome('o20m')} disabled={!isEditable} />
        </View>

        {/* 8. Khi đi vắng */}
        <SectionHeader icon="airplane-outline" title="Khi đi vắng dài ngày, bé sẽ được" badge="TUỲ CHỌN" />
        <View style={styles.awaySection}>
          <PillOption label="Gửi người thân / bạn bè" selected={whenAway.includes('family')} onSelect={() => toggleWhenAway('family')} fullWidth disabled={!isEditable} />
          <View style={styles.pillRow}>
            <PillOption label="Gửi dịch vụ trông giữ" selected={whenAway.includes('service')} onSelect={() => toggleWhenAway('service')} fullWidth disabled={!isEditable} />
            <PillOption label="Mang bé theo cùng" selected={whenAway.includes('bring')} onSelect={() => toggleWhenAway('bring')} fullWidth disabled={!isEditable} />
          </View>
          <PillOption label="Chưa có kế hoạch" selected={whenAway.includes('noplan')} onSelect={() => toggleWhenAway('noplan')} fullWidth disabled={!isEditable} />
        </View>

        {/* 9. Cam kết */}
        <SectionHeader icon="heart-outline" title="Cam kết của bạn" badge="BẮT BUỘC" badgeColor="#FF4FA3" />
        <CheckboxRow label="Cam kết không bỏ rơi bé" checked={commitments.includes('no-abandon')} onToggle={() => toggleCommitment('no-abandon')} disabled={!isEditable} />
        <CheckboxRow label="Cam kết không bán lại bé" checked={commitments.includes('no-resell')} onToggle={() => toggleCommitment('no-resell')} disabled={!isEditable} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Huỷ</Text>
        </Pressable>
        {isEditable && (
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && { opacity: 0.85 },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={canSave ? 'white' : '#9CA3AF'} />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                {existingId ? 'Cập nhật' : 'Gửi đánh giá'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20 },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    paddingTop: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: '#1A1A1A',
  },
  headerDesc: {
    fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 24,
  },
  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14, fontWeight: '700', flex: 1,
  },
  adminNotes: {
    fontSize: 12, fontWeight: '500', flex: 1, marginTop: 4,
  },
  readonlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  readonlyNoticeText: {
    fontSize: 12, color: '#9CA3AF', fontWeight: '500',
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#FFF0F7',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A',
  },
  sectionBadge: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
  },
  // Card option
  cardRow: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
  },
  cardOption: {
    flex: 1, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 10, paddingBottom: 12,
    alignItems: 'center', gap: 8,
  },
  cardOptionSelected: {
    backgroundColor: '#FFF0F7', borderColor: '#FF4FA3', borderWidth: 2,
  },
  cardOptionLabel: {
    fontSize: 13, fontWeight: '700', color: '#1A1A1A', textAlign: 'center',
  },
  cardOptionLabelSelected: { color: '#FF4FA3' },
  cardOptionSublabel: {
    fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 14,
  },
  cardOptionSublabelSelected: { color: '#FF82C0' },
  // Pill option
  pillRow: {
    flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24,
  },
  pillOption: {
    backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 18, alignItems: 'center',
  },
  pillOptionSelected: {
    backgroundColor: '#FFF0F7', borderColor: '#FF4FA3', borderWidth: 2,
  },
  pillOptionLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  pillOptionLabelSelected: { fontWeight: '700', color: '#FF4FA3' },
  pillOptionSublabel: { fontSize: 11, color: '#9CA3AF' },
  pillOptionSublabelSelected: { color: '#FF82C0' },
  // Away section
  awaySection: { gap: 10, marginBottom: 24 },
  // Checkbox row
  checkboxRow: {
    width: '100%', backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
  },
  checkboxRowSelected: {
    backgroundColor: '#FFF0F7', borderColor: '#FF4FA3', borderWidth: 2,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxChecked: { borderWidth: 0, backgroundColor: '#FF4FA3' },
  checkboxLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  checkboxLabelSelected: { color: '#FF4FA3' },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingTop: 14,
    backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn: {
    flex: 2, backgroundColor: '#FF4FA3', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#F3F4F6', shadowOpacity: 0, elevation: 0,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: 'white' },
  saveTextDisabled: { color: '#9CA3AF' },
});
