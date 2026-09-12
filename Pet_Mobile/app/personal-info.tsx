// PersonalInfoScreen — Màn hình thông tin cá nhân.
//
// Nguồn dữ liệu:
//   - user.name, user.email <- GET /api/v1/auth/me (backend, EDITABLE)
//   - user.avatar           <- GET /api/v1/auth/me (backend)
//   - gender                <- component state only
//   - phone, birthday       <- mockAdapter
//
// Save: PATCH /api/v1/auth/profile với { name }
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/lib/theme/ThemeContext";
import { AppDialog, AppDialogProps } from "@/components/ui/AppDialog";
import { apiRequest } from "@/lib/api/client";
import { calculateProfileCompletion } from "@/lib/profile/profileCompletion";
import { resolveImageUrl } from "@/lib/images/resolveUrl";

type GenderOption = "male" | "female" | "other";

const GENDER_OPTIONS: { id: GenderOption; label: string }[] = [
  { id: "male", label: "♂ Nam" },
  { id: "female", label: "♀ Nữ" },
  { id: "other", label: "✦ Khác" },
];

const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

// Parse a backend date string (YYYY-MM-DD or ISO) into a local-timezone Date.
function parseBackendDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

// Format a Date → "DD/MM/YYYY" for display.
function toDisplayDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

// Format a Date → "YYYY-MM-DD" for the backend API.
function formatDateToBackend(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Strip non-numeric characters except an optional leading +.
function cleanPhone(text: string): string {
  const cleaned = text.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  const plus = cleaned.startsWith("+") ? "+" : "";
  return plus + cleaned.replace(/\+/g, "");
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();

  // Backend-supported fields
  const [name, setName] = useState(user?.name ?? "");
  const [emailInput, setEmailInput] = useState(user?.email ?? "");
  const [birthday, setBirthday] = useState<Date | null>(
    user?.birthday ? parseBackendDate(user.birthday) : null,
  );
  const [gender, setGender] = useState<GenderOption>(
    (user?.gender && ["male", "female", "other"].includes(user.gender)
      ? user.gender
      : "female") as GenderOption,
  );
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saving, setSaving] = useState(false);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [otpError, setOtpError] = useState("");

  // Avatar upload state
  const [uploading, setUploading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Phone validation state
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  const isVerifiedEmail = useMemo(() => {
    const currentEmail = (user?.email || "").trim().toLowerCase();
    const inputEmail = emailInput.trim().toLowerCase();
    return Boolean(
      inputEmail && inputEmail === currentEmail && user?.verify === 1,
    );
  }, [user, emailInput]);

  const displayAvatar =
    localAvatarUri ?? (user?.avatar ? resolveImageUrl(user.avatar) : null);
  const displayBirthday = toDisplayDate(birthday);
  const completion = useMemo(() => calculateProfileCompletion(user), [user]);

  // Cooldown countdown timer for OTP
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const executeAvatarPickAndUpload = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
      formData.append("avatar", {
        uri: picked.uri,
        type: picked.mimeType ?? "image/jpeg",
        name: picked.fileName ?? "avatar.jpg",
      } as unknown as Blob);
      await apiRequest("/auth/avatar", {
        method: "POST",
        body: formData,
      });
      await refreshUser();
      setLocalAvatarUri(null);
      setDialogConfig({
        visible: true,
        variant: "success",
        title: "Thành công",
        message: "Ảnh đại diện đã được cập nhật.",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } catch (e) {
      setLocalAvatarUri(null);
      setDialogConfig({
        visible: true,
        variant: "error",
        title: "Lỗi tải ảnh",
        message: e instanceof Error ? e.message : "Không thể tải ảnh lên",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setUploading(false);
    }
  }, [refreshUser]);

  const handlePickAvatar = useCallback(() => {
    if (uploading) return;
    executeAvatarPickAndUpload();
  }, [uploading, executeAvatarPickAndUpload]);

  const handleSendOtp = useCallback(async () => {
    if (sendingOtp || cooldownSeconds > 0) return;

    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập địa chỉ email trước khi xác minh");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      return;
    }

    setEmailError(null);
    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await apiRequest<{
        message: string;
        data?: { waitSeconds?: number };
      }>("/auth/send-otp", {
        method: "POST",
        body: { email: trimmedEmail },
      });

      setCooldownSeconds(res.data?.waitSeconds || 60);
      setShowOtpModal(true);
      setDialogConfig({
        visible: true,
        variant: "success",
        iconName: "mail-outline",
        title: "Đã gửi mã OTP",
        message: res.message || "Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } catch (e) {
      setDialogConfig({
        visible: true,
        variant: "error",
        title: "Lỗi gửi mã OTP",
        message: e instanceof Error ? e.message : "Không thể gửi mã OTP",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setSendingOtp(false);
    }
  }, [sendingOtp, cooldownSeconds, emailInput]);

  const handleVerifyOtp = useCallback(async () => {
    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6) {
      setOtpError("Vui lòng nhập đúng 6 chữ số mã OTP");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    try {
      await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: { otp: trimmedOtp },
      });

      await refreshUser();
      setShowOtpModal(false);
      setOtpCode("");
      setDialogConfig({
        visible: true,
        variant: "success",
        iconName: "checkmark-circle-outline",
        title: "Thành công",
        message: "Email của bạn đã được xác thực thành công!",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Không thể xác nhận mã OTP");
    } finally {
      setVerifyingOtp(false);
    }
  }, [otpCode, refreshUser]);

  // Sync state when user object is loaded/refreshed
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmailInput(user.email ?? "");
      setBirthday(user.birthday ? parseBackendDate(user.birthday) : null);
      setGender(
        (user.gender && ["male", "female", "other"].includes(user.gender)
          ? user.gender
          : "female") as GenderOption,
      );
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (phone && !PHONE_REGEX.test(phone)) {
      setPhoneTouched(true);
      return;
    }

    // Build diff payload: only include fields that were actually changed
    const diffPayload: Record<string, any> = {};

    const trimmedName = name.trim();
    if (trimmedName !== (user?.name ?? "")) {
      diffPayload.name = trimmedName;
    }

    const formattedBirthday = formatDateToBackend(birthday);
    const initialBirthday = user?.birthday
      ? formatDateToBackend(parseBackendDate(user.birthday))
      : null;
    if (formattedBirthday !== initialBirthday) {
      diffPayload.birthday = formattedBirthday;
    }

    if (gender !== (user?.gender ?? "female")) {
      diffPayload.gender = gender;
    }

    const trimmedPhone = cleanPhone(phone);
    if (trimmedPhone !== (user?.phone ?? "")) {
      diffPayload.phone = trimmedPhone || null;
    }

    const trimmedAddress = address.trim();
    if (trimmedAddress !== (user?.address ?? "")) {
      diffPayload.address = trimmedAddress || null;
    }

    // If nothing changed, return directly
    if (Object.keys(diffPayload).length === 0) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/auth/profile", {
        method: "PATCH",
        body: diffPayload,
      });
      await refreshUser();
      router.back();
    } catch (e) {
      setDialogConfig({
        visible: true,
        variant: "error",
        title: "Lỗi",
        message: e instanceof Error ? e.message : "Không thể lưu thay đổi",
        singleButton: true,
        confirmText: "Đã hiểu",
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    user,
    name,
    birthday,
    gender,
    phone,
    address,
    refreshUser,
    router,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={[
          styles.screen,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: theme.colors.card },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={theme.colors.text}
              />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Thông tin cá nhân
            </Text>
          </View>

          {/* Profile completion banner */}
          <View
            style={[
              styles.completionBanner,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.completionScore,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Text
                style={[
                  styles.completionScoreText,
                  { color: theme.colors.primary },
                ]}
              >
                {completion.percentage}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[styles.completionTitle, { color: theme.colors.text }]}
              >
                {completion.helperText.title}
              </Text>
              <Text
                style={[styles.completionSub, { color: theme.colors.muted }]}
              >
                {completion.helperText.description}
              </Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  style={[styles.avatar, { borderColor: theme.colors.primary }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={36}
                    color={theme.colors.muted}
                  />
                </View>
              )}
              <Pressable
                style={[
                  styles.cameraBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.card,
                  },
                ]}
                onPress={handlePickAvatar}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={13} color="white" />
                )}
              </Pressable>
              {uploading && (
                <View
                  style={[
                    styles.avatarUploadOverlay,
                    { backgroundColor: theme.colors.overlay },
                  ]}
                >
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </View>
            <Pressable onPress={handlePickAvatar} disabled={uploading}>
              <Text
                style={[
                  styles.changeAvatarText,
                  { color: theme.colors.primary },
                  uploading && { opacity: 0.4 },
                ]}
              >
                {uploading ? "Đang tải..." : "Đổi ảnh đại diện"}
              </Text>
            </Pressable>
          </View>

          {/* Section: Cá nhân */}
          <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>
            Cá nhân
          </Text>

          <View style={styles.rowGroup}>
            {/* Name */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Họ và tên
              </Text>
              <View
                style={[
                  styles.fieldRow,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={theme.colors.muted}
                />
                <TextInput
                  style={[styles.fieldInput, { color: theme.colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Họ và tên..."
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>

            {/* Birthday */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Ngày sinh
              </Text>
              <Pressable
                onPress={() => {
                  setTempDate(birthday ?? new Date());
                  setShowDatePicker(true);
                }}
              >
                <View
                  style={[
                    styles.fieldRow,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.muted}
                  />
                  <TextInput
                    style={[styles.fieldInput, { color: theme.colors.text }]}
                    value={displayBirthday}
                    editable={false}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
              </Pressable>

              {/* Android date picker */}
              {showDatePicker && Platform.OS === "android" && (
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

              {/* iOS date picker modal */}
              {Platform.OS === "ios" && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View
                    style={[
                      styles.modalOverlay,
                      { backgroundColor: theme.colors.overlay },
                    ]}
                  >
                    <View
                      style={[
                        styles.modalContent,
                        { backgroundColor: theme.colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.modalHeader,
                          { borderBottomColor: theme.colors.border },
                        ]}
                      >
                        <Pressable onPress={() => setShowDatePicker(false)}>
                          <Text
                            style={[
                              styles.modalCancelText,
                              { color: theme.colors.muted },
                            ]}
                          >
                            Huỷ
                          </Text>
                        </Pressable>
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          Chọn ngày sinh
                        </Text>
                        <Pressable
                          onPress={() => {
                            setBirthday(tempDate);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalConfirmText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Chọn
                          </Text>
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

          {/* Gender */}
          <View style={styles.genderWrapper}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              Giới tính
            </Text>
            <View
              style={[
                styles.genderRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {GENDER_OPTIONS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[
                    styles.genderBtn,
                    gender === g.id && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => setGender(g.id)}
                >
                  <Text
                    style={[
                      styles.genderBtnText,
                      { color: gender === g.id ? "white" : theme.colors.muted },
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Section: Liên hệ */}
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.muted, marginTop: 28 },
            ]}
          >
            Liên hệ
          </Text>

          {/* Email */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldHeaderRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.text, marginBottom: 0 },
                ]}
              >
                Email
              </Text>
              {isVerifiedEmail ? (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: theme.colors.successContainer },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.verifiedText,
                      { color: theme.colors.success },
                    ]}
                  >
                    Đã xác minh
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleSendOtp}
                  disabled={sendingOtp || cooldownSeconds > 0}
                  style={({ pressed }) => [
                    styles.verifyActionBtn,
                    { backgroundColor: theme.colors.primaryContainer },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {sendingOtp ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.verifyActionText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {cooldownSeconds > 0
                        ? `Gửi lại (${cooldownSeconds}s)`
                        : "Xác minh OTP"}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                style={[styles.fieldInput, { color: theme.colors.text }]}
                value={emailInput}
                onChangeText={(t) => {
                  setEmailInput(t);
                  if (emailError) setEmailError(null);
                }}
                placeholder="Nhập email của bạn..."
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <Text
                style={[
                  styles.validationWarning,
                  { color: theme.colors.error, marginTop: 4 },
                ]}
              >
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Address */}
          <View style={[styles.fieldWrapper, { marginBottom: 36 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              Địa chỉ
            </Text>
            <View
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                style={[styles.fieldInput, { color: theme.colors.text }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Địa chỉ của bạn..."
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={[styles.fieldWrapper, { marginBottom: 36 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              Số điện thoại
            </Text>
            <View
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
                phoneTouched &&
                  phone &&
                  !PHONE_REGEX.test(phone) && {
                    borderColor: theme.colors.error,
                  },
              ]}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                style={[styles.fieldInput, { color: theme.colors.text }]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(cleanPhone(text));
                  setPhoneTouched(true);
                }}
                placeholder="+84912345678"
                placeholderTextColor={theme.colors.muted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={15}
              />
            </View>
            {phoneTouched && phone && !PHONE_REGEX.test(phone) && (
              <Text
                style={[
                  styles.validationWarning,
                  { color: theme.colors.error },
                ]}
              >
                Số điện thoại không hợp lệ (9-15 chữ số)
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(16, insets.bottom),
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelText, { color: theme.colors.text }]}>
              Huỷ
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
              pressed && { opacity: 0.85 },
              saving && { opacity: 0.6 },
            ]}
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

        {/* Modal nhập OTP xác minh email */}
        <Modal
          visible={showOtpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOtpModal(false)}
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor: theme.colors.overlay,
                justifyContent: "center",
              },
            ]}
          >
            <View
              style={[
                styles.otpModalCard,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View style={styles.otpModalHeader}>
                <Ionicons
                  name="mail-unread-outline"
                  size={36}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.otpModalTitle, { color: theme.colors.text }]}
                >
                  Xác minh Email
                </Text>
                <Text
                  style={[
                    styles.otpModalSubtitle,
                    { color: theme.colors.muted },
                  ]}
                >
                  Mã OTP 6 chữ số đã được gửi tới{" "}
                  <Text style={{ fontWeight: "700", color: theme.colors.text }}>
                    {emailInput}
                  </Text>
                </Text>
              </View>

              <TextInput
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={otpCode}
                onChangeText={(t) => {
                  setOtpCode(t.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                placeholder="123456"
                placeholderTextColor={theme.colors.muted}
                keyboardType="number-pad"
                maxLength={6}
              />

              {otpError.length > 0 && (
                <Text
                  style={[styles.otpErrorText, { color: theme.colors.error }]}
                >
                  {otpError}
                </Text>
              )}

              <View style={styles.otpModalActions}>
                <Pressable
                  style={[
                    styles.otpCancelBtn,
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setShowOtpModal(false)}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                    Hủy
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.otpConfirmBtn,
                    { backgroundColor: theme.colors.primary },
                    (verifyingOtp || otpCode.length !== 6) && { opacity: 0.6 },
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.otpConfirmText}>Xác nhận</Text>
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={handleSendOtp}
                disabled={sendingOtp || cooldownSeconds > 0}
                style={{ marginTop: 16, alignItems: "center" }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.primary,
                    fontWeight: "600",
                  }}
                >
                  {cooldownSeconds > 0
                    ? `Gửi lại mã sau ${cooldownSeconds}s`
                    : "Chưa nhận được mã? Gửi lại"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </Animated.View>

      {/* Standard AppDialog */}
      <AppDialog
        visible={Boolean(dialogConfig?.visible)}
        title={dialogConfig?.title || ""}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  // Completion banner
  completionBanner: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
  },
  completionScore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#FF4FA3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  completionScoreText: { fontSize: 16, fontWeight: "800" },
  completionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  completionSub: { fontSize: 12 },
  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: { position: "relative", marginBottom: 10 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4FA3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  changeAvatarText: { fontSize: 14, fontWeight: "600" },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  // Form
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  rowGroup: { flexDirection: "row", gap: 12, marginBottom: 16 },
  fieldWrapper: { flex: 1, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  verifyActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifyActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  fieldRow: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  // Gender
  genderWrapper: {},
  genderRow: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 4,
    gap: 4,
  },
  genderBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnText: { fontSize: 14, fontWeight: "700" },
  // Verified badge
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexShrink: 0,
  },
  verifiedText: { fontSize: 11, fontWeight: "700" },
  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "700" },
  saveBtn: {
    flex: 2,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  saveText: { fontSize: 16, fontWeight: "700", color: "white" },
  // Validation
  validationWarning: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  // iOS Datepicker modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "700",
  },
  // OTP Modal
  otpModalCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  otpModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },
  otpModalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 14,
    marginBottom: 12,
  },
  otpErrorText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  otpModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  otpCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  otpConfirmBtn: {
    flex: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  otpConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});
