// Màn hình đăng ký tài khoản — Phong cách Kawaii từ Helper/Signup.html.
//
// Màu nền vàng pastel #FFF4CC, cún SVG, bong bóng "Hi!" nảy nhẹ.
// Logic: gọi register() từ AuthContext -> tự đăng nhập -> route gate chuyển (tabs).
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { Circle, Ellipse, Path, Svg } from "react-native-svg";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { RegisterData } from "@/lib/api/auth";

// ─── Nhân vật cún hoạt họa SVG ───────────────────────────────────────────────
function DogCharacter() {
  return (
    <Svg width={130} height={130} viewBox="0 0 200 200" fill="none">
      <Ellipse
        cx={45}
        cy={80}
        rx={25}
        ry={35}
        fill="#83541D"
        transform="rotate(-30 45 80)"
      />
      <Ellipse
        cx={155}
        cy={80}
        rx={25}
        ry={35}
        fill="#83541D"
        transform="rotate(30 155 80)"
      />
      <Circle cx={100} cy={110} r={70} fill="#F4DED1" />
      <Circle cx={75} cy={105} r={5} fill="#241912" />
      <Circle cx={77} cy={103} r={1.5} fill="#fff" />
      <Circle cx={125} cy={105} r={5} fill="#241912" />
      <Circle cx={127} cy={103} r={1.5} fill="#fff" />
      <Circle cx={60} cy={120} r={8} fill="#FFDAD6" />
      <Circle cx={140} cy={120} r={8} fill="#FFDAD6" />
      <Circle cx={100} cy={125} r={20} fill="#FFF1EA" />
      <Circle cx={100} cy={120} r={4} fill="#241912" />
      <Path
        d="M92 125 C 92 135, 100 135, 100 125 C 100 135, 108 135, 108 125"
        stroke="#241912"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Bong bóng thoại "Hi!" ────────────────────────────────────────────────────
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
      ]),
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View
      style={[styles.speechBubble, { transform: [{ translateY: floatAnim }] }]}
    >
      <Text style={styles.speechText}>Hi!</Text>
      <View style={styles.speechTail} />
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
  keyboardType,
  autoCapitalize = "none",
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
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: "go" | "done" | "next";
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputPill,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        focused && { borderColor: theme.colors.primary, borderWidth: 2 },
        !editable && { opacity: 0.6 },
      ]}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={focused ? theme.colors.primary : theme.colors.muted}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.inputText, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={secureTextEntry}
        editable={editable}
        keyboardType={keyboardType}
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
export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const PHONE_REGEX = /^0[35789][0-9]{8}$/;

  function normalizePhone(raw: string): string {
    return raw.replace(/\s+|-/g, "").replace(/^\+84/, "0");
  }

  const normalizedPhone = normalizePhone(phone);
  const isValidPhone = PHONE_REGEX.test(normalizedPhone);

  const isFormEmpty =
    displayName.trim().length === 0 ||
    name.trim().length === 0 ||
    phone.trim().length === 0 ||
    password.length === 0 ||
    confirmPassword.length === 0;

  const canSubmit = isValidPhone && !submitting && !isFormEmpty;

  async function handleSubmit() {
    if (!canSubmit) return;

    setError("");

    if (!isValidPhone) {
      setError("Số điện thoại không đúng định dạng (VD: 0912345678)");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);

    const data: RegisterData = {
      display_name: displayName.trim(),
      name: name.trim(),
      phone: normalizedPhone,
      password,
      confirmPassword,
    };

    try {
      await register(data);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : "Không thể đăng ký, vui lòng thử lại";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Khu vực minh họa ── */}
        <View style={styles.illustrationWrapper}>
          <SpeechBubble />
          <View style={[styles.dogCircle, { borderColor: theme.colors.border }]}>
            <DogCharacter />
          </View>
        </View>

        {/* ── Tiêu đề ── */}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
            Đăng ký để đồng hành cùng các bé thú cưng!
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <InputPill
            iconName="person-outline"
            placeholder="Tên đăng nhập *"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!submitting}
            returnKeyType="next"
          />

          <InputPill
            iconName="card-outline"
            placeholder="Họ và tên *"
            value={name}
            onChangeText={setName}
            editable={!submitting}
            returnKeyType="next"
          />

          <InputPill
            iconName="call-outline"
            placeholder="Số điện thoại *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!submitting}
            returnKeyType="next"
          />

          <InputPill
            iconName="lock-closed-outline"
            placeholder="Mật khẩu (tối thiểu 8 ký tự) *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!submitting}
            returnKeyType="next"
            rightElement={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.muted}
                />
              </Pressable>
            }
          />

          <InputPill
            iconName="shield-checkmark-outline"
            placeholder="Xác nhận mật khẩu *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            rightElement={
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.muted}
                />
              </Pressable>
            }
          />

          {/* Thông báo lỗi */}
          {error.length > 0 && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
              <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Nút đăng ký */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={styles.btnWrapper}
          >
            <View
              style={[
                styles.registerBtn,
                canSubmit
                  ? { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.disabled, shadowOpacity: 0 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerBtnText}>Đăng ký</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.muted }]}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const PRIMARY = "#83541D";
const ACCENT = "#E5A96A";
const BG = "#FFF4CC"; // Vàng pastel — giống Helper/Signup.html
const ON_SURFACE = "#241912";
const ON_SURFACE_VARIANT = "#514539";
const OUTLINE_VARIANT = "#D5C3B5";

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: "center",
  },
  // Illustration
  illustrationWrapper: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    width: 160,
    height: 145,
    justifyContent: "flex-end",
  },
  dogCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ffeade",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  // Speech bubble
  speechBubble: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
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
    fontFamily: "Fredoka_700Bold",
    fontSize: 18,
    color: PRIMARY,
    lineHeight: 22,
  },
  speechTail: {
    position: "absolute",
    bottom: -8,
    left: 14,
    width: 14,
    height: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: ACCENT,
    transform: [{ rotate: "45deg" }],
  },
  // Header text
  headerText: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Fredoka_700Bold",
    fontSize: 34,
    color: PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Fredoka_400Regular",
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
  },
  // Form
  form: {
    width: "100%",
    gap: 12,
    marginBottom: 4,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
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
    fontFamily: "Fredoka_400Regular",
    fontSize: 15,
    color: ON_SURFACE,
  },
  eyeBtn: {
    marginLeft: 8,
    padding: 2,
  },
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  errorText: {
    fontFamily: "Fredoka_400Regular",
    fontSize: 14,
    color: "#ba1a1a",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  // Register button
  btnWrapper: {
    width: '100%',
    marginTop: 4,
  },
  registerBtn: {
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  registerBtnDisabled: {
    opacity: 0.5,
  },
  registerBtnText: {
    fontFamily: "Fredoka_600SemiBold",
    fontSize: 18,
    color: ON_SURFACE,
    letterSpacing: 0.3,
  },
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontFamily: "Fredoka_400Regular",
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
  },
  footerLink: {
    fontFamily: "Fredoka_700Bold",
    fontSize: 15,
    color: PRIMARY,
    textDecorationLine: "underline",
  },
});
