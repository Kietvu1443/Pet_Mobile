// VerifyEmailModal — Modal xác thực email qua mã OTP in-flow cho Pet_Mobile.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/api/auth';
import { saveToken } from '@/lib/auth/tokenStore';

type VerifyEmailModalProps = {
  visible: boolean;
  onClose: () => void;
  onVerifiedSuccess: () => void;
};

export function VerifyEmailModal({
  visible,
  onClose,
  onVerifiedSuccess,
}: VerifyEmailModalProps) {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible && user?.email) {
      setEmail(user.email);
    }
    if (!visible) {
      setOtp('');
      setErrorMsg(null);
      setSuccessInfo(null);
    }
  }, [visible, user?.email]);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleSendOtp = useCallback(async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }
    setErrorMsg(null);
    setSuccessInfo(null);
    setIsSending(true);

    try {
      const res = await sendEmailOtp(targetEmail);
      setCooldown(res.waitSeconds || 60);
      setSuccessInfo(`Mã OTP đã được gửi tới ${res.email || targetEmail}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi mã OTP. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setIsSending(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const res = await verifyEmailOtp(trimmedOtp);
      // Lưu token mới được backend cấp với verify = 1
      if (res.token) {
        await saveToken(res.token);
      }
      await refreshUser();
      onClose();
      onVerifiedSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  }, [otp, refreshUser, onClose, onVerifiedSuccess]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable
            style={styles.centerWrap}
            onPress={Keyboard.dismiss}
          >
            <Pressable
              style={[
                styles.container,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Ionicons name="mail-unread-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Xác minh Email</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              Bạn cần xác minh email để hoàn tất hồ sơ nhận nuôi thú cưng.
            </Text>
          </View>

          {/* Email input / display */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.colors.muted }]}>Địa chỉ email</Text>
            <View style={styles.emailRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.emailInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="example@email.com"
                placeholderTextColor={theme.colors.muted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMsg(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSending && !isVerifying}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: cooldown > 0 ? theme.colors.surface : theme.colors.primary,
                    borderColor: theme.colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSendOtp}
                disabled={isSending || cooldown > 0}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.sendBtnText,
                      { color: cooldown > 0 ? theme.colors.muted : '#fff' },
                    ]}
                  >
                    {cooldown > 0 ? `${cooldown}s` : 'Gửi mã'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Success / Feedback text */}
          {Boolean(successInfo) && (
            <View style={[styles.infoBanner, { backgroundColor: theme.colors.successContainer }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={[styles.infoText, { color: theme.colors.success }]}>{successInfo}</Text>
            </View>
          )}

          {/* OTP Input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.colors.muted }]}>Mã OTP 6 chữ số</Text>
            <TextInput
              style={[
                styles.input,
                styles.otpInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: errorMsg ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={theme.colors.muted}
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                setErrorMsg(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              editable={!isVerifying}
            />
          </View>

          {/* Error display */}
          {Boolean(errorMsg) && (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: theme.colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              disabled={isVerifying}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>Hủy</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.colors.primary },
                (isVerifying || otp.trim().length !== 6) && { opacity: 0.6 },
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleVerifyOtp}
              disabled={isVerifying || otp.trim().length !== 6}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Xác thực</Text>
              )}
            </Pressable>
          </View>
            </Pressable>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  emailInput: {
    flex: 1,
  },
  sendBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '800',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
