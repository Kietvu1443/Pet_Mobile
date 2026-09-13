// AdoptionRequestModal — Modal nhập lý do nhận nuôi thú cưng cho Pet_Mobile.
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { submitAdoptionRequest, type CreateAdoptionRequestResponse } from '@/lib/api/adoptionRequests';
import { resolveImageUrl } from '@/lib/images/resolveUrl';

type AdoptionRequestModalProps = {
  visible: boolean;
  petId: number;
  petName: string;
  petImage?: string | null;
  petBreed?: string | null;
  onClose: () => void;
  onSuccess: (res: CreateAdoptionRequestResponse) => void;
  onErrorConflict?: () => void;
};

export function AdoptionRequestModal({
  visible,
  petId,
  petName,
  petImage,
  petBreed,
  onClose,
  onSuccess,
  onErrorConflict,
}: AdoptionRequestModalProps) {
  const { theme } = useTheme();

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarUrl = petImage ? resolveImageUrl(petImage) : null;

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMsg('Vui lòng nhập lý do bạn muốn nhận nuôi bé.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await submitAdoptionRequest({
        petId,
        message: trimmedMessage,
      });
      setMessage('');
      onClose();
      onSuccess(res);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : 'Không thể gửi yêu cầu nhận nuôi.';

      if (status === 409 || msg.includes('đã gửi') || msg.includes('đã được nhận nuôi')) {
        onClose();
        if (onErrorConflict) {
          onErrorConflict();
        } else {
          setErrorMsg(msg);
        }
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <View style={styles.petHeader}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.petImage} />
            ) : (
              <View style={[styles.petImagePlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                <Ionicons name="paw" size={24} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.petInfo}>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                Đăng ký nhận nuôi {petName}
              </Text>
              {Boolean(petBreed) && (
                <Text style={[styles.breedText, { color: theme.colors.muted }]}>{petBreed}</Text>
              )}
            </View>
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Lý do bạn muốn nhận nuôi bé: <Text style={{ color: theme.colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: errorMsg ? theme.colors.error : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Ví dụ: Tôi có kinh nghiệm chăm sóc thú cưng, gia đình có sân vườn và môi trường sống phù hợp..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setErrorMsg(null);
              }}
              editable={!submitting}
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
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>Hủy</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.colors.primary },
                (submitting || !message.trim()) && { opacity: 0.6 },
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !message.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Gửi đăng ký</Text>
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
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  petImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  breedText: {
    fontSize: 13,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
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
    flex: 1.5,
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
