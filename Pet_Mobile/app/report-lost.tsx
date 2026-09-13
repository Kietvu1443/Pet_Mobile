// ReportLostScreen — Màn hình Đăng tin Báo Mất Thú Cưng (Milestone B3).
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

import { submitReport } from '@/lib/api/reports';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppDialog, type AppDialogProps } from '@/components/ui/AppDialog';

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

type PetType = 'Chó' | 'Mèo' | 'Khác';
type Gender = 'male' | 'female' | 'unknown';

const PHONE_REGEX = /^[0-9\-\+]{9,15}$/;

export default function ReportLostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetType>('Chó');
  const [species, setSpecies] = useState('');
  const [gender, setGender] = useState<Gender>('unknown');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [imageError, setImageError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const handlePickImages = async () => {
    if (images.length >= 5) {
      setDialogConfig({
        visible: true,
        variant: 'info',
        title: 'Giới hạn ảnh',
        message: 'Bạn chỉ có thể đính kèm tối đa 5 ảnh cho mỗi tin báo.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => {
          const uri = asset.uri;
          const ext = uri.split('.').pop() || 'jpg';
          const fileName = asset.fileName || `lost_${Date.now()}_${index}.${ext}`;
          const type = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
          return { uri, name: fileName, type };
        });

        setImages((prev) => [...prev, ...newImages].slice(0, 5));
        setImageError('');
      }
    } catch {
      setDialogConfig({
        visible: true,
        variant: 'error',
        title: 'Lỗi chọn ảnh',
        message: 'Không thể mở thư viện ảnh. Vui lòng thử lại.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Vui lòng nhập tên bé thú cưng hoặc thông tin nhận diện');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!location.trim()) {
      setLocationError('Vui lòng nhập khu vực/địa điểm bé bị thất lạc');
      isValid = false;
    } else {
      setLocationError('');
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ (9-15 chữ số)');
      isValid = false;
    } else {
      setPhoneError('');
    }

    if (images.length === 0) {
      setImageError('Vui lòng chọn ít nhất 1 ảnh của bé');
      isValid = false;
    } else {
      setImageError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', 'lost');
      formData.append('name', name.trim());
      formData.append('pet_type', petType);
      if (species.trim()) formData.append('species', species.trim());
      formData.append('gender', gender);
      if (color.trim()) formData.append('color', color.trim());
      formData.append('location', location.trim());
      formData.append('phone', phone.trim());
      if (email.trim()) formData.append('email', email.trim());
      if (description.trim()) formData.append('description', description.trim());

      images.forEach((img) => {
        formData.append('images', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          name: img.name,
          type: img.type,
        } as any);
      });

      await submitReport(formData);

      // Invalidate query caches
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['my-reports'] });

      setDialogConfig({
        visible: true,
        variant: 'success',
        title: 'Đã gửi tin báo!',
        message:
          'Tin báo thất lạc của bạn đã được gửi thành công và đang chờ ban quản trị kiểm duyệt trước khi hiển thị công khai.',
        singleButton: true,
        confirmText: 'Xem danh sách',
        onConfirm: () => {
          setDialogConfig(null);
          router.back();
        },
      });
    } catch (error: any) {
      setDialogConfig({
        visible: true,
        variant: 'error',
        title: 'Không thể gửi tin báo',
        message: error?.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại thông tin và thử lại.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Bar */}
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.colors.background }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.colors.card },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Báo mất thú cưng
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(40, insets.bottom + 20) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Note Banner */}
          <View
            style={[
              styles.noticeBox,
              { backgroundColor: theme.colors.warningContainer, borderColor: theme.colors.warning },
            ]}
          >
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={[styles.noticeText, { color: theme.colors.text }]}>
              Vui lòng cung cấp thông tin càng chi tiết càng tốt để cộng đồng có thể nhanh chóng nhận diện và liên hệ với bạn.
            </Text>
          </View>

          {/* 1. Ảnh thú cưng */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Ảnh của bé <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <Text style={[styles.labelSub, { color: theme.colors.muted }]}>
                (Tối đa 5 ảnh)
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
              {images.map((img, index) => (
                <View key={img.uri} style={styles.imageItemWrap}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  <Pressable
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}

              {images.length < 5 && (
                <Pressable
                  style={[
                    styles.addImageBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: imageError ? theme.colors.error : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handlePickImages();
                  }}
                >
                  <Ionicons name="camera-outline" size={26} color={theme.colors.muted} />
                  <Text style={[styles.addImageText, { color: theme.colors.muted }]}>
                    Thêm ảnh
                  </Text>
                </Pressable>
              )}
            </ScrollView>
            {Boolean(imageError) && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {imageError}
              </Text>
            )}
          </View>

          {/* 2. Loại thú cưng */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Loài thú cưng <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {(['Chó', 'Mèo', 'Khác'] as PetType[]).map((type) => {
                const active = petType === type;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.card,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPetType(type);
                    }}
                  >
                    <Text style={[styles.chipText, { color: active ? 'white' : theme.colors.text }]}>
                      {type === 'Chó' ? '🐶 Chó' : type === 'Mèo' ? '🐱 Mèo' : '🐾 Khác'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Tên bé */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Tên bé thú cưng <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: nameError ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="VD: Bé Vàng, Miu, Lu..."
              placeholderTextColor={theme.colors.muted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError('');
              }}
            />
            {Boolean(nameError) && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {nameError}
              </Text>
            )}
          </View>

          {/* 4. Giống & Màu lông */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Giống loài</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="VD: Corgi, Mèo ta..."
                placeholderTextColor={theme.colors.muted}
                value={species}
                onChangeText={setSpecies}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Màu lông</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="VD: Vàng, Đốm đen..."
                placeholderTextColor={theme.colors.muted}
                value={color}
                onChangeText={setColor}
              />
            </View>
          </View>

          {/* 5. Giới tính */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Giới tính</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'male', label: '♂ Đực' },
                { id: 'female', label: '♀ Cái' },
                { id: 'unknown', label: 'Không rõ' },
              ].map(({ id, label }) => {
                const active = gender === id;
                return (
                  <Pressable
                    key={id}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.card,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setGender(id as Gender);
                    }}
                  >
                    <Text style={[styles.chipText, { color: active ? 'white' : theme.colors.text }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Nơi thất lạc */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Khu vực thất lạc <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: locationError ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="VD: Gần chợ Tân Bình, Quận Tân Bình, TP.HCM"
              placeholderTextColor={theme.colors.muted}
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                setLocationError('');
              }}
            />
            {Boolean(locationError) && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {locationError}
              </Text>
            )}
          </View>

          {/* 7. Thông tin liên hệ */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Số điện thoại <Text style={{ color: theme.colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: phoneError ? theme.colors.error : theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="0912345678"
                placeholderTextColor={theme.colors.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneError('');
                }}
              />
              {Boolean(phoneError) && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {phoneError}
                </Text>
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Email (tùy chọn)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="email@example.com"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* 8. Mô tả chi tiết */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Mô tả chi tiết & hoàn cảnh thất lạc
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="VD: Bé đeo vòng cổ màu đỏ có chuông, bị lạc lúc khoảng 18h ngày 12/09, tính nhát người lạ..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: '#DC2626' },
              submitting && { opacity: 0.6 },
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="white" />
                <Text style={styles.submitBtnText}>Đăng tin báo mất</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  labelSub: {
    fontSize: 12,
  },
  imageList: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  imageItemWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
