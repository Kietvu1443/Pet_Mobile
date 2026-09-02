// AddPetScreen — Màn hình đăng ký thú cưng cá nhân mới (3 bước).
//
// Nguồn dữ liệu & submit:
//   - Form fields: component state
//   - Submit: POST /api/v1/user-pets (Lưu vào bảng user_pets cá nhân)
//
// 3 bước:
//   Bước 1 — Thông tin cơ bản: loài, giống, tên, giới tính, chọn tối đa 5 ảnh
//   Bước 2 — Chi tiết: ngày sinh/tuổi, cân nặng, tiêm phòng, màu lông, tính cách
//   Bước 3 — Hoàn tất: xem lại & đăng
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/lib/theme/ThemeContext';
import { createUserPet, formatAgeFromBirthDate } from '@/lib/api/userPets';
import { AddPetSuccessModal } from '@/components/AddPetSuccessModal';

const TRAITS_SUGGESTIONS = [
  'Hiền lành', 'Năng động', 'Yêu trẻ con', 'Trầm tính',
  'Sạch sẽ', 'Thông minh', 'Quấn người', 'Hòa đồng với thú khác', 'Độc lập',
];

const STEPS = [
  { step: 1, title: 'Thông tin cơ bản', subtitle: 'Loài, giống & ảnh đại diện' },
  { step: 2, title: 'Chi tiết', subtitle: 'Tuổi, cân nặng & tính cách' },
  { step: 3, title: 'Hoàn tất', subtitle: 'Xem lại & lưu bé' },
];

type Species = 'cat' | 'dog' | 'other';
type Gender = 'male' | 'female';

export type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

function FormLabel({ children, inline }: { children: string; inline?: boolean }) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.formLabel, { color: theme.colors.muted }, inline && { marginBottom: 0 }]}>{children}</Text>
  );
}

function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  const { theme } = useTheme();
  return (
    <TextInput
      style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.muted}
      keyboardType={keyboardType}
    />
  );
}

function Step1({
  species, setSpecies,
  gender, setGender,
  name, setName,
  breed, setBreed,
  images, pickImages, removeImage,
}: {
  species: Species; setSpecies: (s: Species) => void;
  gender: Gender; setGender: (g: Gender) => void;
  name: string; setName: (v: string) => void;
  breed: string; setBreed: (v: string) => void;
  images: SelectedImage[];
  pickImages: () => void;
  removeImage: (index: number) => void;
}) {
  const speciesOptions: { id: Species; emoji: string; label: string }[] = [
    { id: 'cat', emoji: '🐱', label: 'Mèo' },
    { id: 'dog', emoji: '🐶', label: 'Chó' },
    { id: 'other', emoji: '🐰', label: 'Khác' },
  ];

  return (
    <View>
      {/* Photo upload */}
      <View style={{ marginBottom: 28 }}>
        <FormLabel>Hình ảnh bé (Tối đa 5 ảnh)</FormLabel>
        
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imageThumbnailWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                  {idx === 0 && (
                    <View style={styles.avatarBadge}>
                      <Text style={styles.avatarBadgeText}>Ảnh chính</Text>
                    </View>
                  )}
                  <Pressable style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
              {images.length < 5 && (
                <Pressable style={styles.addMoreImageBtn} onPress={pickImages}>
                  <Ionicons name="add" size={24} color="#FF4FA3" />
                  <Text style={styles.addMoreImageText}>Thêm</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}

        {images.length === 0 && (
          <Pressable style={styles.photoUpload} onPress={pickImages}>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={26} color="#FF4FA3" />
            </View>
            <Text style={styles.photoUploadTitle}>Thêm ảnh</Text>
            <Text style={styles.photoUploadSub}>Tối đa 5 ảnh · JPG, PNG</Text>
          </Pressable>
        )}
      </View>

      {/* Species */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Loài *</FormLabel>
        <View style={styles.speciesRow}>
          {speciesOptions.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.speciesBtn, species === s.id && styles.speciesBtnActive]}
              onPress={() => setSpecies(s.id)}
            >
              <Text style={styles.speciesEmoji}>{s.emoji}</Text>
              <Text style={[styles.speciesLabel, species === s.id && styles.speciesLabelActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Name */}
      <View style={{ marginBottom: 20 }}>
        <FormLabel>Tên bé *</FormLabel>
        <FormInput value={name} onChangeText={setName} placeholder="Tên thú cưng của bạn..." />
      </View>

      {/* Breed */}
      <View style={{ marginBottom: 20 }}>
        <FormLabel>Giống</FormLabel>
        <FormInput value={breed} onChangeText={setBreed} placeholder="VD: Mèo ta, Corgi, Poodle..." />
      </View>

      {/* Gender */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Giới tính *</FormLabel>
        <View style={styles.genderRow}>
          {(['male', 'female'] as Gender[]).map((g) => (
            <Pressable
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                {g === 'male' ? '♂ Đực' : '♀ Cái'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Step2({
  ageYear, setAgeYear, ageMonth, setAgeMonth,
  weight, setWeight,
  color, setColor,
  vaccinated, setVaccinated,
  traits, traitInput, setTraitInput,
  addCustomTrait, toggleTrait,
}: {
  ageYear: string; setAgeYear: (v: string) => void;
  ageMonth: string; setAgeMonth: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  color: string; setColor: (v: string) => void;
  vaccinated: boolean; setVaccinated: (v: boolean) => void;
  traits: string[]; traitInput: string; setTraitInput: (v: string) => void;
  addCustomTrait: () => void; toggleTrait: (t: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <View>
      {/* Age */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Tuổi ước tính</FormLabel>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[{ val: ageYear, set: setAgeYear, unit: 'năm' }, { val: ageMonth, set: setAgeMonth, unit: 'tháng' }].map(({ val, set, unit }) => (
            <View key={unit} style={{ flex: 1, position: 'relative' }}>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text, paddingRight: 56 }]}
                value={val}
                onChangeText={set}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.muted}
              />
              <Text style={styles.ageUnit}>{unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Weight */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Cân nặng (kg)</FormLabel>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text, paddingRight: 56 }]}
            value={weight}
            onChangeText={setWeight}
            placeholder="VD: 4.5"
            keyboardType="decimal-pad"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.ageUnit}>kg</Text>
        </View>
      </View>

      {/* Color */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Màu lông</FormLabel>
        <FormInput value={color} onChangeText={setColor} placeholder="VD: Vàng, Đen trắng, Tam thể..." />
      </View>

      {/* Vaccinated toggle */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Tình trạng tiêm phòng</FormLabel>
        <View style={styles.genderRow}>
          <Pressable
            style={[styles.genderBtn, vaccinated && styles.genderBtnActive]}
            onPress={() => setVaccinated(true)}
          >
            <Text style={[styles.genderBtnText, vaccinated && styles.genderBtnTextActive]}>
              ✓ Đã tiêm phòng
            </Text>
          </Pressable>
          <Pressable
            style={[styles.genderBtn, !vaccinated && styles.genderBtnActive]}
            onPress={() => setVaccinated(false)}
          >
            <Text style={[styles.genderBtnText, !vaccinated && styles.genderBtnTextActive]}>
              Chưa tiêm phòng
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Traits */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FormLabel inline>Tính cách</FormLabel>
          <Text style={{ fontSize: 13, color: '#AAAAAA' }}>· tối đa 5</Text>
        </View>

        {traits.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {traits.map((t) => (
              <Pressable key={t} onPress={() => toggleTrait(t)} style={styles.traitSelected}>
                <Text style={styles.traitSelectedText}>{t} ×</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={[styles.formInput, { flex: 1, backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={traitInput}
            onChangeText={setTraitInput}
            placeholder="Nhập tính cách..."
            placeholderTextColor={theme.colors.muted}
            onSubmitEditing={addCustomTrait}
            returnKeyType="done"
          />
          <Pressable style={styles.addTraitBtn} onPress={addCustomTrait}>
            <Text style={styles.addTraitBtnText}>Thêm</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 12, color: '#AAAAAA', marginTop: 12, marginBottom: 10 }}>Gợi ý</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRAITS_SUGGESTIONS.filter((s) => !traits.includes(s)).map((t) => (
            <Pressable key={t} style={styles.traitSuggestion} onPress={() => toggleTrait(t)}>
              <Ionicons name="add" size={12} color="#888" />
              <Text style={styles.traitSuggestionText}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Step3({
  name, breed, species, gender, traits, weight, vaccinated, birthDateStr, images,
}: {
  name: string;
  breed: string;
  species: Species;
  gender: Gender;
  traits: string[];
  weight: string;
  vaccinated: boolean;
  birthDateStr: string | null;
  images: SelectedImage[];
}) {
  const speciesEmoji = species === 'cat' ? '🐱' : species === 'dog' ? '🐶' : '🐰';
  const ageDisplay = formatAgeFromBirthDate(birthDateStr);

  return (
    <View>
      <View style={styles.previewCard}>
        <View style={styles.previewImageArea}>
          {images.length > 0 ? (
            <Image source={{ uri: images[0].uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 80 }}>{speciesEmoji}</Text>
          )}
        </View>
        <View style={{ padding: 20 }}>
          <Text style={styles.previewName}>{name || 'Tên bé'}</Text>
          <Text style={styles.previewBreed}>
            {breed || (species === 'cat' ? 'Mèo' : species === 'dog' ? 'Chó' : 'Thú cưng')} · {gender === 'male' ? 'Đực' : 'Cái'} · {ageDisplay}
          </Text>

          {weight ? (
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
              ⚖️ Cân nặng: {weight} kg {vaccinated ? '· ✓ Đã tiêm phòng' : ''}
            </Text>
          ) : null}

          {traits.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {traits.map((t) => (
                <View key={t} style={styles.previewTrait}>
                  <Text style={styles.previewTraitText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.previewNote}>
        <Text style={{ fontSize: 22, flexShrink: 0 }}>🏠</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewNoteTitle}>Sắp hoàn tất!</Text>
          <Text style={styles.previewNoteDesc}>
            Bé sẽ được thêm vào danh sách "Thú cưng của tôi" để bạn dễ dàng quản lý và chăm sóc.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AddPetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<Species>('cat');
  const [gender, setGender] = useState<Gender>('male');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYear, setAgeYear] = useState('0');
  const [ageMonth, setAgeMonth] = useState('0');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [vaccinated, setVaccinated] = useState(false);
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPetName, setCreatedPetName] = useState('');

  // Tính birth_date ISO string (YYYY-MM-DD) từ số năm/tháng
  const calculateBirthDate = (): string | null => {
    const y = parseInt(ageYear, 10) || 0;
    const m = parseInt(ageMonth, 10) || 0;
    if (y === 0 && m === 0) return null;

    const d = new Date();
    d.setFullYear(d.getFullYear() - y);
    d.setMonth(d.getMonth() - m);
    return d.toISOString().split('T')[0];
  };

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Giới hạn', 'Bạn chỉ có thể chọn tối đa 5 ảnh.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để thêm ảnh bé.');
        return;
      }

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
          const fileName = asset.fileName || `pet_${Date.now()}_${index}.${ext}`;
          const type = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
          return { uri, name: fileName, type };
        });

        setImages((prev) => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTrait = (t: string) => {
    setTraits((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 5 ? [...prev, t] : prev
    );
  };

  const addCustomTrait = () => {
    if (traitInput.trim() && traits.length < 5) {
      setTraits((prev) => [...prev, traitInput.trim()]);
      setTraitInput('');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên cho bé thú cưng.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('species', species);
      if (breed.trim()) formData.append('breed', breed.trim());
      formData.append('gender', gender);

      const birthDate = calculateBirthDate();
      if (birthDate) formData.append('birth_date', birthDate);
      if (color.trim()) formData.append('color', color.trim());
      if (weight.trim()) formData.append('weight', weight.trim());
      formData.append('vaccinated', vaccinated ? '1' : '0');
      if (traits.length > 0) formData.append('traits', JSON.stringify(traits));

      // Append ảnh
      images.forEach((img) => {
        formData.append('images', {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          name: img.name,
          type: img.type,
        } as any);
      });

      await createUserPet(formData);

      // Mở modal thành công theo design system
      setCreatedPetName(name.trim());
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Create user pet error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo thú cưng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập tên cho bé trước khi tiếp tục.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const birthDateStr = calculateBirthDate();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.colors.card }, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Thêm thú cưng</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View>
            <Text style={[styles.stepTag, { color: theme.colors.primary }]}>Bước {step} / {STEPS.length}</Text>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{STEPS[step - 1].title}</Text>
            <Text style={[styles.stepSub, { color: theme.colors.muted }]}>{STEPS[step - 1].subtitle}</Text>
          </View>
          <View style={styles.stepDots}>
            {STEPS.map((s) => (
              <View
                key={s.step}
                style={[
                  styles.stepDot,
                  { backgroundColor: theme.colors.border },
                  { width: s.step === step ? 32 : 7 },
                  s.step <= step && { backgroundColor: theme.colors.primary },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Form Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <Step1
              species={species} setSpecies={setSpecies}
              gender={gender} setGender={setGender}
              name={name} setName={setName}
              breed={breed} setBreed={setBreed}
              images={images} pickImages={pickImages} removeImage={removeImage}
            />
          )}
          {step === 2 && (
            <Step2
              ageYear={ageYear} setAgeYear={setAgeYear}
              ageMonth={ageMonth} setAgeMonth={setAgeMonth}
              weight={weight} setWeight={setWeight}
              color={color} setColor={setColor}
              vaccinated={vaccinated} setVaccinated={setVaccinated}
              traits={traits} traitInput={traitInput}
              setTraitInput={setTraitInput}
              addCustomTrait={addCustomTrait}
              toggleTrait={toggleTrait}
            />
          )}
          {step === 3 && (
            <Step3
              name={name} breed={breed} species={species} gender={gender}
              traits={traits} weight={weight} vaccinated={vaccinated}
              birthDateStr={birthDateStr} images={images}
            />
          )}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomBar, { backgroundColor: theme.colors.card, paddingBottom: Math.max(16, insets.bottom) }]}>
          {step > 1 && (
            <Pressable
              disabled={isSubmitting}
              style={({ pressed }) => [styles.prevBtn, { borderColor: theme.colors.border }, pressed && { opacity: 0.7 }]}
              onPress={() => setStep((s) => s - 1)}
            >
              <Text style={[styles.prevBtnText, { color: theme.colors.text }]}>Quay lại</Text>
            </Pressable>
          )}
          <Pressable
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
              pressed && { opacity: 0.85 },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleNext}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.nextBtnText}>
                {step < 3 ? 'Tiếp tục' : 'Lưu bé ngay 🐾'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Modal Thành công */}
        <AddPetSuccessModal
          visible={showSuccessModal}
          petName={createdPetName}
          onConfirm={() => {
            setShowSuccessModal(false);
            router.replace('/(tabs)/pets' as Parameters<typeof router.replace>[0]);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 20, paddingTop: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  // Step indicator
  stepIndicator: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 8,
  },
  stepTag: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
  },
  stepTitle: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  stepSub: { fontSize: 13 },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stepDot: {
    height: 7, borderRadius: 4,
  },
  // Form fields
  formLabel: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15,
  },
  // Photo upload
  photoUpload: {
    height: 160, backgroundColor: 'rgba(255, 79, 163, 0.04)', borderRadius: 22,
    borderWidth: 2, borderColor: '#FFBBD8', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  cameraIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center',
  },
  photoUploadTitle: { fontSize: 15, fontWeight: '600', color: '#FF4FA3' },
  photoUploadSub: { fontSize: 12, color: '#BBB' },
  imageThumbnailWrap: {
    width: 90, height: 90, borderRadius: 16, overflow: 'hidden', position: 'relative',
  },
  imageThumbnail: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  avatarBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  removeImageBtn: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  addMoreImageBtn: {
    width: 90, height: 90, borderRadius: 16, borderWidth: 1.5, borderColor: '#FF4FA3',
    borderStyle: 'dashed', backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  addMoreImageText: { fontSize: 12, fontWeight: '700', color: '#FF4FA3' },
  // Species
  speciesRow: { flexDirection: 'row', gap: 12 },
  speciesBtn: {
    flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: '#EEE',
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', gap: 6,
  },
  speciesBtnActive: { backgroundColor: '#FFF0F7', borderColor: '#FF4FA3' },
  speciesEmoji: { fontSize: 28 },
  speciesLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  speciesLabelActive: { color: '#FF4FA3' },
  // Gender
  genderRow: {
    flexDirection: 'row', backgroundColor: '#F4F4F6',
    borderRadius: 18, padding: 4, gap: 4,
  },
  genderBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#FF4FA3',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  genderBtnText: { fontSize: 14, fontWeight: '700', color: '#888' },
  genderBtnTextActive: { color: 'white' },
  // Age unit
  ageUnit: {
    position: 'absolute', right: 16, top: '50%',
    fontSize: 14, color: '#888', fontWeight: '500',
    transform: [{ translateY: -10 }],
  },
  // Traits
  traitSelected: {
    backgroundColor: '#FFF0F7', borderWidth: 1.5, borderColor: '#FF4FA3',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  traitSelectedText: { color: '#FF4FA3', fontSize: 13, fontWeight: '600' },
  addTraitBtn: {
    backgroundColor: '#FF4FA3', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14,
  },
  addTraitBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  traitSuggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'white', borderWidth: 1.5, borderColor: '#EEE',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  traitSuggestionText: { fontSize: 13, fontWeight: '500', color: '#555' },
  // Step 3 preview
  previewCard: {
    backgroundColor: 'white', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 8, marginBottom: 24,
  },
  previewImageArea: {
    height: 220, backgroundColor: '#FFF0F7',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  previewBreed: { fontSize: 15, color: '#777', marginBottom: 12 },
  previewTrait: {
    backgroundColor: '#FFF0F7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  previewTraitText: { color: '#FF4FA3', fontSize: 13, fontWeight: '600' },
  previewNote: {
    backgroundColor: '#FFF5FA', borderRadius: 20, padding: 16,
    borderWidth: 1.5, borderColor: '#FFBBD8',
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  previewNoteTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  previewNoteDesc: { fontSize: 13, color: '#777', lineHeight: 20 },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  prevBtn: {
    flex: 1, borderWidth: 2,
    borderRadius: 18, paddingVertical: 16, alignItems: 'center',
  },
  prevBtnText: { fontSize: 16, fontWeight: '700' },
  nextBtn: {
    flex: 2, borderRadius: 18, paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40, shadowRadius: 14, elevation: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
