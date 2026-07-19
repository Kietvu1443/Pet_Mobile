// PersonalInfoScreen — Màn hình thông tin cá nhân.
//
// Nguồn dữ liệu:
//   - user.name, user.email <- GET /api/v1/auth/me (backend, EDITABLE)
//   - user.avatar           <- GET /api/v1/auth/me (backend)
//   - gender                <- component state only (TODO: backend users.gender)
//   - phone, birthday       <- mockAdapter (TODO: backend users.phone, users.birthday)
//
// Save: PATCH /api/v1/auth/profile với { name }
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

import { useAuth } from '@/lib/auth/AuthContext';
import { apiRequest } from '@/lib/api/client';
import { calculateProfileCompletion } from '@/lib/profile/profileCompletion';
import { resolveImageUrl } from '@/lib/images/resolveUrl';

type GenderOption = 'male' | 'female' | 'other';

const GENDER_OPTIONS: { id: GenderOption; label: string }[] = [
  { id: 'male',   label: '♂ Nam' },
  { id: 'female', label: '♀ Nữ' },
  { id: 'other',  label: '✦ Khác' },
];

const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

// Parse a backend date string (YYYY-MM-DD or ISO) into a local-timezone Date.
function parseBackendDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

// Format a Date → "DD/MM/YYYY" for display.
function toDisplayDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Format a Date → "YYYY-MM-DD" for the backend API.
function formatDateToBackend(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Strip non-numeric characters except an optional leading +.
function cleanPhone(text: string): string {
  const cleaned = text.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  const plus = cleaned.startsWith('+') ? '+' : '';
  return plus + cleaned.replace(/\+/g, '');
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  // Backend-supported fields
  const [name, setName] = useState(user?.name ?? '');
  const [birthday, setBirthday] = useState<Date | null>(
    user?.birthday ? parseBackendDate(user.birthday) : null,
  );
  const [gender, setGender] = useState<GenderOption>(
    (user?.gender && ['male', 'female', 'other'].includes(user.gender)
      ? user.gender
      : 'female') as GenderOption,
  );
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  // Avatar upload state
  const [uploading, setUploading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Phone validation state
  const [phoneTouched, setPhoneTouched] = useState(false);

  const email = user?.email ?? '';
  const displayAvatar = localAvatarUri ?? (user?.avatar ? resolveImageUrl(user.avatar) : null);
  const displayBirthday = toDisplayDate(birthday);
  const completion = useMemo(() => calculateProfileCompletion(user), [user]);

  const handlePickAvatar = useCallback(async () => {
    if (uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    setLocalAvatarUri(picked.uri);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: picked.uri,
        type: picked.mimeType ?? 'image/jpeg',
        name: picked.fileName ?? 'avatar.jpg',
      } as unknown as Blob);
      await apiRequest('/auth/avatar', {
        method: 'POST',
        body: formData,
      });
      await refreshUser();
      setLocalAvatarUri(null);
      Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
    } catch (e) {
      setLocalAvatarUri(null);
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
  }, [uploading, refreshUser]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    // Validate phone before submitting
    if (phone && !PHONE_REGEX.test(phone)) {
      setPhoneTouched(true);
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: {
          display_name: user?.display_name || '',
          name,
          email: user?.email || '',
          birthday: formatDateToBackend(birthday),
          gender: gender || null,
          phone: phone || null,
        },
      });
      await refreshUser();
      router.back();
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  }, [saving, user, name, birthday, gender, phone, refreshUser, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View
        style={[styles.screen, { paddingTop: insets.top }]}
      >
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
              <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
            </Pressable>
            <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          </View>

          {/* Profile completion banner — dynamic */}
          <View style={styles.completionBanner}>
            <View style={styles.completionScore}>
              <Text style={styles.completionScoreText}>{completion.percentage}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.completionTitle}>{completion.helperText.title}</Text>
              <Text style={styles.completionSub}>{completion.helperText.description}</Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={36} color="#CCCCCC" />
                </View>
              )}
              <Pressable style={styles.cameraBtn} onPress={handlePickAvatar} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={13} color="white" />
                )}
              </Pressable>
              {uploading && (
                <View style={styles.avatarUploadOverlay}>
                  <ActivityIndicator size="large" color="#FF4FA3" />
                </View>
              )}
            </View>
            <Pressable onPress={handlePickAvatar} disabled={uploading}>
              <Text style={[styles.changeAvatarText, uploading && { opacity: 0.4 }]}>
                {uploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              </Text>
            </Pressable>
          </View>

          {/* Section: Cá nhân */}
          <Text style={styles.sectionLabel}>Cá nhân</Text>

          <View style={styles.rowGroup}>
            {/* Name — editable, mapped to backend users.name */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Họ và tên</Text>
              <View style={styles.fieldRow}>
                <Ionicons name="person-outline" size={16} color="#CCCCCC" />
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Họ và tên..."
                  placeholderTextColor="#CCCCCC"
                />
              </View>
            </View>

            {/* Birthday — read-only display with native DatePicker */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Ngày sinh</Text>
              <Pressable onPress={() => { setTempDate(birthday ?? new Date()); setShowDatePicker(true); }}>
                <View style={styles.fieldRow} pointerEvents="none">
                  <Ionicons name="calendar-outline" size={16} color="#CCCCCC" />
                  <TextInput
                    style={styles.fieldInput}
                    value={displayBirthday}
                    editable={false}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#CCCCCC"
                  />
                </View>
              </Pressable>

              {/* Android: native dialog */}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(_event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setBirthday(selectedDate);
                  }}
                />
              )}

              {/* iOS: modal sheet with confirmation */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <Pressable onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.modalCancelText}>Huỷ</Text>
                        </Pressable>
                        <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
                        <Pressable onPress={() => { setBirthday(tempDate); setShowDatePicker(false); }}>
                          <Text style={styles.modalConfirmText}>Chọn</Text>
                        </Pressable>
                      </View>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={(_event, selectedDate) => {
                          if (selectedDate) setTempDate(selectedDate);
                        }}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          </View>

          {/* Gender — editable, stored in backend */}
          <View style={styles.genderWrapper}>
            <Text style={styles.fieldLabel}>Giới tính</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.genderBtn, gender === g.id && styles.genderBtnActive]}
                  onPress={() => setGender(g.id)}
                >
                  <Text style={[styles.genderBtnText, gender === g.id && styles.genderBtnTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Section: Liên hệ */}
          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Liên hệ</Text>

          {/* Email — from backend, read-only (no edit allowed in this screen) */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="mail-outline" size={16} color="#CCCCCC" />
              <Text style={[styles.fieldInput, styles.fieldReadonly]} numberOfLines={1}>{email}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#34C759" strokeWidth={3} />
                <Text style={styles.verifiedText}>Đã xác minh</Text>
              </View>
            </View>
          </View>

          {/* Phone — editable with inline validation */}
          <View style={[styles.fieldWrapper, { marginBottom: 36 }]}>
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <View style={[styles.fieldRow, phoneTouched && phone && !PHONE_REGEX.test(phone) && styles.fieldRowError]}>
              <Ionicons name="call-outline" size={16} color="#CCCCCC" />
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={(text) => { setPhone(cleanPhone(text)); setPhoneTouched(true); }}
                placeholder="+84912345678"
                placeholderTextColor="#CCCCCC"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={15}
              />
            </View>
            {phoneTouched && phone && !PHONE_REGEX.test(phone) && (
              <Text style={styles.validationWarning}>Số điện thoại không hợp lệ (9-15 chữ số)</Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Huỷ</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveText}>Lưu thay đổi</Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9FC',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: '#1A1A1A',
  },
  // Completion banner
  completionBanner: {
    backgroundColor: '#FFF0F7',
    borderRadius: 20, padding: 14,
    marginBottom: 28,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#FFBBD8',
  },
  completionScore: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4,
    elevation: 4,
  },
  completionScoreText: { fontSize: 16, fontWeight: '800', color: '#FF4FA3' },
  completionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  completionSub: { fontSize: 12, color: '#888' },
  // Avatar
  avatarSection: {
    alignItems: 'center', marginBottom: 32,
  },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: '#FF4FA3',
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FF4FA3',
    borderWidth: 2, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
    elevation: 4,
  },
  changeAvatarText: { color: '#FF4FA3', fontSize: 14, fontWeight: '600' },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Form
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAAAAA',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
  },
  rowGroup: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  fieldWrapper: { flex: 1, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  fieldRow: {
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1.5, borderColor: '#EEE',
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  fieldInput: {
    flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A',
  },
  fieldReadonly: { color: '#1A1A1A' },
  // Gender
  genderWrapper: {},
  genderRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1.5, borderColor: '#EEE',
    padding: 4, gap: 4,
  },
  genderBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#FF4FA3',
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8,
    elevation: 4,
  },
  genderBtnText: { fontSize: 14, fontWeight: '700', color: '#888' },
  genderBtnTextActive: { color: 'white' },
  // Verified badge
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F8EE',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    flexShrink: 0,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#34C759' },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 8,
  },
  cancelBtn: {
    flex: 1, backgroundColor: 'white',
    borderWidth: 2, borderColor: '#EEE',
    borderRadius: 18, paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: '#888' },
  saveBtn: {
    flex: 2, backgroundColor: '#FF4FA3',
    borderRadius: 18, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40, shadowRadius: 14,
    elevation: 8,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: 'white' },
  // Validation
  validationWarning: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4D4F',
  },
  fieldRowError: {
    borderColor: '#FF4D4F',
  },
  // iOS Datepicker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4FA3',
  },
});
