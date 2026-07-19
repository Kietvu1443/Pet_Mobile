import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

type ShelterStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected';

const STATUS_LABEL: Record<ShelterStatus, { label: string; bg: string; border: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  unsubmitted: { label: 'Chưa gửi', bg: '#F5F5F5', border: '#E0E0E0', text: '#888', icon: 'time-outline' },
  pending: { label: 'Chờ duyệt', bg: '#FFF8E8', border: '#FFD699', text: '#B8860B', icon: 'hourglass-outline' },
  approved: { label: 'Đã duyệt', bg: '#E8F8EE', border: '#A8E6C1', text: '#34C759', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Bị từ chối', bg: '#FFF0F0', border: '#FFC0C0', text: '#FF4D4F', icon: 'close-circle-outline' },
};

type ShelterData = {
  id: number;
  name: string;
  phone: string;
  address: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
};

export default function ShelterRegistrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [shelterStatus, setShelterStatus] = useState<ShelterStatus>('unsubmitted');
  const [adminNotes, setAdminNotes] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditable = shelterStatus === 'unsubmitted' || shelterStatus === 'rejected';
  const canSave = name.trim().length > 0 && phone.trim().length > 0 && address.trim().length > 0;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ shelter: ShelterData | null }>('/shelters');
        const shelter = data.shelter;
        if (shelter) {
          setExistingId(shelter.id);
          setShelterStatus(shelter.status as ShelterStatus);
          setAdminNotes(shelter.admin_notes);
          setName(shelter.name || '');
          setPhone(shelter.phone || '');
          setAddress(shelter.address || '');
          setDescription(shelter.description || '');
        }
      } catch {
        // No shelter exists — show empty form
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (saving || !canSave || !isEditable) return;
    setSaving(true);
    try {
      const body = { name: name.trim(), phone: phone.trim(), address: address.trim(), description: description.trim() || null };

      if (existingId && shelterStatus === 'rejected') {
        await apiRequest(`/shelters`, { method: 'PATCH', body });
      } else {
        await apiRequest('/shelters', { method: 'POST', body });
      }

      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể lưu thông tin trại');
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = STATUS_LABEL[shelterStatus];

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Đăng ký trại cứu hộ</Text>
        </View>

        {/* Status banner */}
        {shelterStatus !== 'unsubmitted' && (
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
            <Text style={styles.readonlyNoticeText}>Đơn đã được gửi và không thể chỉnh sửa</Text>
          </View>
        )}

        <Text style={styles.headerDesc}>
          Đăng ký trại cứu hộ để quản lý thú cưng, nhận yêu cầu nhận nuôi và xuất hiện trên bản đồ trại cứu hộ.
        </Text>

        {/* Form fields */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Tên trại</Text>
          <View style={styles.fieldRow}>
            <Ionicons name="business-outline" size={16} color="#CCCCCC" />
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Tên trại cứu hộ..."
              placeholderTextColor="#CCCCCC"
              editable={isEditable}
            />
          </View>
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Số điện thoại</Text>
          <View style={styles.fieldRow}>
            <Ionicons name="call-outline" size={16} color="#CCCCCC" />
            <TextInput
              style={styles.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+84912345678"
              placeholderTextColor="#CCCCCC"
              keyboardType="phone-pad"
              editable={isEditable}
            />
          </View>
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Địa chỉ</Text>
          <View style={styles.fieldRow}>
            <Ionicons name="location-outline" size={16} color="#CCCCCC" />
            <TextInput
              style={styles.fieldInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Địa chỉ trại..."
              placeholderTextColor="#CCCCCC"
              editable={isEditable}
            />
          </View>
        </View>

        <View style={[styles.fieldWrapper, { marginBottom: 40 }]}>
          <Text style={styles.fieldLabel}>Mô tả</Text>
          <View style={[styles.fieldRow, { minHeight: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
            <Ionicons name="document-text-outline" size={16} color="#CCCCCC" style={{ marginTop: 2 }} />
            <TextInput
              style={[styles.fieldInput, { minHeight: 60, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả về trại cứu hộ..."
              placeholderTextColor="#CCCCCC"
              multiline
              numberOfLines={3}
              editable={isEditable}
            />
          </View>
        </View>

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
                {existingId ? 'Cập nhật' : 'Gửi đăng ký'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F8' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  statusText: { fontSize: 14, fontWeight: '700', flex: 1 },
  adminNotes: { fontSize: 12, fontWeight: '500', flex: 1, marginTop: 4 },
  readonlyNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  readonlyNoticeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  headerDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  fieldRow: {
    backgroundColor: 'white', borderRadius: 18, borderWidth: 1.5, borderColor: '#EEE',
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  bottomBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 14,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn: {
    flex: 2, backgroundColor: '#FF4FA3', borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  saveBtnDisabled: { backgroundColor: '#F3F4F6', shadowOpacity: 0, elevation: 0 },
  saveText: { fontSize: 15, fontWeight: '700', color: 'white' },
  saveTextDisabled: { color: '#9CA3AF' },
});
