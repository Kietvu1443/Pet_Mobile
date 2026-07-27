// Màn hình đăng nhập — Phiên bản thiết kế lại theo phong cách Kawaii.
//
// Giữ nguyên toàn bộ logic nghiệp vụ (AuthContext, ApiError).
// Nâng cấp giao diện: cún SVG hoạt họa, bong bóng thoại nảy nhẹ,
// inputs hình viên thuốc có icon, nền pastel ấm áp.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';

import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

// ─── Nhân vật cún hoạt họa SVG ───────────────────────────────────────────────
function DogCharacter() {
  return (
    <Svg width={140} height={140} viewBox="0 0 200 200" fill="none">
      {/* Tai trái */}
      <Ellipse
        cx={45}
        cy={80}
        rx={25}
        ry={35}
        fill="#83541D"
        transform="rotate(-30 45 80)"
      />
      {/* Tai phải */}
      <Ellipse
        cx={155}
        cy={80}
        rx={25}
        ry={35}
        fill="#83541D"
        transform="rotate(30 155 80)"
      />
      {/* Khuôn mặt */}
      <Circle cx={100} cy={110} r={70} fill="#F4DED1" />
      {/* Mắt trái */}
      <Circle cx={75} cy={105} r={5} fill="#241912" />
      {/* Phản chiếu mắt trái */}
      <Circle cx={77} cy={103} r={1.5} fill="#fff" />
      {/* Mắt phải */}
      <Circle cx={125} cy={105} r={5} fill="#241912" />
      {/* Phản chiếu mắt phải */}
      <Circle cx={127} cy={103} r={1.5} fill="#fff" />
      {/* Má hồng trái */}
      <Circle cx={60} cy={120} r={8} fill="#FFDAD6" />
      {/* Má hồng phải */}
      <Circle cx={140} cy={120} r={8} fill="#FFDAD6" />
      {/* Vùng mõm */}
      <Circle cx={100} cy={125} r={20} fill="#FFF1EA" />
      {/* Mũi */}
      <Circle cx={100} cy={120} r={4} fill="#241912" />
      {/* Miệng */}
      <Path
        d="M92 125 C 92 135, 100 135, 100 125 C 100 135, 108 135, 108 125"
        stroke="#241912"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Bong bóng thoại "Hi!" nảy nhẹ ──────────────────────────────────────────
function SpeechBubble() {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View
      style={[styles.speechBubble, { transform: [{ translateY: floatAnim }] }]}
    >
      <Text style={styles.speechText}>Hi!</Text>
      {/* Đuôi bong bóng */}
      <View style={styles.speechTail} />
    </Animated.View>
  );
}

// ─── Biểu tượng trang trí bay lơ lửng ────────────────────────────────────────
function FloatingIcon({
  name,
  size,
  top,
  left,
  right,
  bottom,
  delay = 0,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  delay?: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingIcon,
        { top: top as number, left: left as number, right: right as number, bottom: bottom as number },
        { transform: [{ translateY: floatAnim }] },
      ]}
    >
      <Ionicons name={name} size={size} color="rgba(131,84,29,0.15)" />
    </Animated.View>
  );
}

// ─── InputPill ────────────────────────────────────────────────────────────────
function InputPill({
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  editable = true,
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  rightElement,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'go' | 'done' | 'next';
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputPill,
        focused && styles.inputPillFocused,
        !editable && styles.inputPillDisabled,
      ]}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={focused ? '#83541D' : '#837468'}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(131,116,104,0.5)"
        secureTextEntry={secureTextEntry}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightElement}
    </View>
  );
}

// ─── Màn hình chính ──────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    displayName.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await login(displayName.trim(), password);
      // Route gate tự chuyển về (tabs) sau khi user được set.
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : 'Không thể đăng nhập, vui lòng thử lại';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Biểu tượng trang trí nền */}
      <FloatingIcon name="paw" size={36} top={70} left={20} delay={0} />
      <FloatingIcon name="star" size={24} top={160} right={18} delay={600} />
      <FloatingIcon name="paw" size={28} bottom={220} left={12} delay={1200} />
      <FloatingIcon name="flower-outline" size={32} bottom={100} right={20} delay={400} />
      <FloatingIcon name="heart-outline" size={22} top={380} right={10} delay={900} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Khu vực minh họa ── */}
        <View style={styles.illustrationWrapper}>
          <SpeechBubble />
          <View style={styles.dogCircle}>
            <DogCharacter />
          </View>
        </View>

        {/* ── Tiêu đề ── */}
        <View style={styles.headerText}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục!</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <InputPill
            iconName="person-outline"
            placeholder="Tên đăng nhập"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!submitting}
            returnKeyType="next"
          />

          <InputPill
            iconName="lock-closed-outline"
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            rightElement={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#837468"
                />
              </Pressable>
            }
          />

          {/* Thông báo lỗi */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Nút Đăng nhập */}
          <TouchableOpacity
            style={[styles.loginBtn, !canSubmit && styles.loginBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#241912" />
            ) : (
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Dải phân cách OAuth (giữ nguyên vị trí, chỉ style) ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, styles.socialBtnFb]}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-facebook" size={20} color="#fff" />
            <Text style={[styles.socialBtnText, styles.socialBtnTextFb]}>
              Facebook
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const PRIMARY = '#83541D';
const ACCENT = '#E5A96A';
const BG = '#EDF7FF';
const SURFACE = '#fff8f5';
const ON_SURFACE = '#241912';
const ON_SURFACE_VARIANT = '#514539';
const OUTLINE_VARIANT = '#D5C3B5';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    alignItems: 'center',
  },
  // Floating decorations
  floatingIcon: {
    position: 'absolute',
    zIndex: 0,
  },
  // Illustration
  illustrationWrapper: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    width: 180,
    height: 160,
    justifyContent: 'flex-end',
  },
  dogCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ffeade',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  // Speech bubble
  speechBubble: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: ACCENT,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  speechText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    color: PRIMARY,
    lineHeight: 22,
  },
  speechTail: {
    position: 'absolute',
    bottom: -8,
    left: 14,
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: ACCENT,
    transform: [{ rotate: '45deg' }],
  },
  // Header text
  headerText: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 36,
    color: PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 16,
    color: ON_SURFACE_VARIANT,
  },
  // Form
  form: {
    width: '100%',
    gap: 14,
    marginBottom: 4,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    borderWidth: 2,
    borderColor: OUTLINE_VARIANT,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputPillFocused: {
    borderColor: ACCENT,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  inputPillDisabled: {
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontFamily: 'Fredoka_400Regular',
    fontSize: 16,
    color: ON_SURFACE,
  },
  eyeBtn: {
    marginLeft: 8,
    padding: 2,
  },
  // Error
  errorText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 14,
    color: '#ba1a1a',
    textAlign: 'center',
  },
  // Login button
  loginBtn: {
    backgroundColor: ACCENT,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 18,
    color: ON_SURFACE,
    letterSpacing: 0.3,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: OUTLINE_VARIANT,
  },
  dividerText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 11,
    color: ON_SURFACE_VARIANT,
    letterSpacing: 1.2,
  },
  // Social buttons
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: OUTLINE_VARIANT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialBtnFb: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialBtnText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
    color: ON_SURFACE,
  },
  socialBtnTextFb: {
    color: '#fff',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
  },
  footerLink: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 15,
    color: PRIMARY,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
