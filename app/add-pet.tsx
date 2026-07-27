// AddPetScreen — Màn hình đăng ký thú cưng mới (3 bước).
//
// Nguồn dữ liệu:
//   - Form fields: component state
//   - Submit: POST /api/v1/pets (TODO: kiểm tra endpoint này có tồn tại không)
//             Hiện tại submission là visual-only (TODO comment bên dưới).
//
// 3 bước:
//   Bước 1 — Thông tin cơ bản: loài, giống, tên, giới tính, ảnh
//   Bước 2 — Chi tiết: tuổi, màu lông, khu vực, tính cách
//   Bước 3 — Hoàn tất: xem lại & đăng
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TRAITS_SUGGESTIONS = [
  'Hiền lành', 'Năng động', 'Yêu trẻ con', 'Trầm tính',
  'Sạch sẽ', 'Thông minh', 'Quấn người', 'Hòa đồng với thú khác', 'Độc lập',
];

const STEPS = [
  { step: 1, title: 'Thông tin cơ bản', subtitle: 'Loài, giống & ảnh đại diện' },
  { step: 2, title: 'Chi tiết', subtitle: 'Tính cách & mô tả' },
  { step: 3, title: 'Hoàn tất', subtitle: 'Xem lại & đăng' },
];

type Species = 'cat' | 'dog' | 'other';
type Gender = 'male' | 'female';

function FormLabel({ children, inline }: { children: string; inline?: boolean }) {
  return (
    <Text style={[styles.formLabel, inline && { marginBottom: 0 }]}>{children}</Text>
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
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      style={styles.formInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#CCCCCC"
      keyboardType={keyboardType}
    />
  );
}

function Step1({
  species, setSpecies,
  gender, setGender,
  name, setName,
  breed, setBreed,
}: {
  species: Species; setSpecies: (s: Species) => void;
  gender: Gender; setGender: (g: Gender) => void;
  name: string; setName: (v: string) => void;
  breed: string; setBreed: (v: string) => void;
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
        <FormLabel>Ảnh đại diện *</FormLabel>
        <Pressable style={styles.photoUpload}>
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={26} color="#FF4FA3" />
          </View>
          <Text style={styles.photoUploadTitle}>Thêm ảnh</Text>
          <Text style={styles.photoUploadSub}>Tối đa 5 ảnh · JPG, PNG</Text>
        </Pressable>
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
        <FormInput value={name} onChangeText={setName} placeholder="Tên thú cưng..." />
      </View>

      {/* Breed */}
      <View style={{ marginBottom: 20 }}>
        <FormLabel>Giống *</FormLabel>
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
  color, setColor,
  traits, traitInput, setTraitInput,
  addCustomTrait, toggleTrait,
}: {
  ageYear: string; setAgeYear: (v: string) => void;
  ageMonth: string; setAgeMonth: (v: string) => void;
  color: string; setColor: (v: string) => void;
  traits: string[]; traitInput: string; setTraitInput: (v: string) => void;
  addCustomTrait: () => void; toggleTrait: (t: string) => void;
}) {
  return (
    <View>
      {/* Age */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Tuổi *</FormLabel>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[{ val: ageYear, set: setAgeYear, unit: 'năm' }, { val: ageMonth, set: setAgeMonth, unit: 'tháng' }].map(({ val, set, unit }) => (
            <View key={unit} style={{ flex: 1, position: 'relative' }}>
              <TextInput
                style={[styles.formInput, { paddingRight: 56 }]}
                value={val}
                onChangeText={set}
                keyboardType="numeric"
                placeholderTextColor="#CCCCCC"
              />
              <Text style={styles.ageUnit}>{unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Color */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Màu lông</FormLabel>
        <FormInput value={color} onChangeText={setColor} placeholder="VD: Vàng, Đen trắng, Tam thể..." />
      </View>

      {/* Location selects - static UI */}
      <View style={{ marginBottom: 24 }}>
        <FormLabel>Khu vực *</FormLabel>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.formInput, { flex: 1, justifyContent: 'center' }]}>
            <Text style={{ color: '#CCCCCC', fontSize: 14 }}>Thành phố...</Text>
          </View>
          <View style={[styles.formInput, { flex: 1, justifyContent: 'center' }]}>
            <Text style={{ color: '#CCCCCC', fontSize: 14 }}>Chọn phường...</Text>
          </View>
        </View>
      </View>

      {/* Traits */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FormLabel inline>Tính cách *</FormLabel>
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
            style={[styles.formInput, { flex: 1 }]}
            value={traitInput}
            onChangeText={setTraitInput}
            placeholder="Nhập tính cách..."
            placeholderTextColor="#CCCCCC"
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

function Step3({ name, breed, species, gender, traits }: {
  name: string; breed: string; species: Species; gender: Gender; traits: string[];
}) {
  const speciesEmoji = species === 'cat' ? '🐱' : species === 'dog' ? '🐶' : '🐰';
  return (
    <View>
      <View style={styles.previewCard}>
        <View style={styles.previewImageArea}>
          <Text style={{ fontSize: 80 }}>{speciesEmoji}</Text>
        </View>
        <View style={{ padding: 20 }}>
          <Text style={styles.previewName}>{name || 'Tên bé'}</Text>
          <Text style={styles.previewBreed}>{breed || 'Giống'} · {gender === 'male' ? 'Đực' : 'Cái'}</Text>
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
        <Text style={{ fontSize: 22, flexShrink: 0 }}>🎉</Text>
        <View>
          <Text style={styles.previewNoteTitle}>Sắp hoàn tất!</Text>
          <Text style={styles.previewNoteDesc}>
            Sau khi đăng, hồ sơ của bé sẽ được hiển thị để người dùng khác có thể nhận nuôi.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AddPetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [species, setSpecies] = useState<Species>('cat');
  const [gender, setGender] = useState<Gender>('male');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [ageYear, setAgeYear] = useState('0');
  const [ageMonth, setAgeMonth] = useState('0');
  const [color, setColor] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState('');

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

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      // TODO: Replace with POST /api/v1/pets when backend endpoint confirmed
      router.back();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm thú cưng</Text>
        <Pressable>
          <Text style={styles.draftBtn}>Lưu bản nháp</Text>
        </Pressable>
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View>
          <Text style={styles.stepTag}>Bước {step} / {STEPS.length}</Text>
          <Text style={styles.stepTitle}>{STEPS[step - 1].title}</Text>
          <Text style={styles.stepSub}>{STEPS[step - 1].subtitle}</Text>
        </View>
        <View style={styles.stepDots}>
          {STEPS.map((s) => (
            <View
              key={s.step}
              style={[
                styles.stepDot,
                { width: s.step === step ? 32 : 7 },
                s.step <= step && styles.stepDotActive,
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
          />
        )}
        {step === 2 && (
          <Step2
            ageYear={ageYear} setAgeYear={setAgeYear}
            ageMonth={ageMonth} setAgeMonth={setAgeMonth}
            color={color} setColor={setColor}
            traits={traits} traitInput={traitInput}
            setTraitInput={setTraitInput}
            addCustomTrait={addCustomTrait}
            toggleTrait={toggleTrait}
          />
        )}
        {step === 3 && (
          <Step3 name={name} breed={breed} species={species} gender={gender} traits={traits} />
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        {step > 1 && (
          <Pressable
            style={({ pressed }) => [styles.prevBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.prevBtnText}>Quay lại</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {step < 3 ? 'Tiếp tục' : 'Đăng ngay 🐾'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 20, paddingTop: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  draftBtn: { fontSize: 14, fontWeight: '600', color: '#FF4FA3' },
  // Step indicator
  stepIndicator: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 8,
  },
  stepTag: {
    color: '#FF4FA3', fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3,
  },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  stepSub: { fontSize: 13, color: '#888' },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stepDot: {
    height: 7, borderRadius: 4, backgroundColor: '#EEE',
  },
  stepDotActive: { backgroundColor: '#FF4FA3' },
  // Form fields
  formLabel: {
    fontSize: 11, fontWeight: '800', color: '#888',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white', borderWidth: 1.5, borderColor: '#EEE',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: '#1A1A1A',
  },
  // Photo upload
  photoUpload: {
    height: 180, backgroundColor: 'white', borderRadius: 22,
    borderWidth: 2, borderColor: '#FFBBD8', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  cameraIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center',
  },
  photoUploadTitle: { fontSize: 15, fontWeight: '600', color: '#FF4FA3' },
  photoUploadSub: { fontSize: 12, color: '#BBB' },
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
    flexDirection: 'row', backgroundColor: 'white',
    borderRadius: 18, borderWidth: 1.5, borderColor: '#EEE',
    padding: 4, gap: 4,
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
  genderBtnText: { fontSize: 15, fontWeight: '700', color: '#888' },
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
    height: 200, backgroundColor: '#FFF0F7',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  previewBreed: { fontSize: 15, color: '#777', marginBottom: 16 },
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
    backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  prevBtn: {
    flex: 1, backgroundColor: 'white', borderWidth: 2, borderColor: '#EEE',
    borderRadius: 18, paddingVertical: 16, alignItems: 'center',
  },
  prevBtnText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  nextBtn: {
    flex: 2, backgroundColor: '#FF4FA3', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40, shadowRadius: 14, elevation: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
