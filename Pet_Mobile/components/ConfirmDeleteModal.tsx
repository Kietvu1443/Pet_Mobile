import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/ThemeContext';

interface ConfirmDeleteModalProps {
  visible: boolean;
  petName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  petName,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {/* Top Warning/Trash Icon */}
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.errorContainer }]}>
            <Ionicons name="trash-outline" size={32} color={theme.colors.error} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Xác nhận xóa thú cưng
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.muted }]}>
            Bạn có chắc muốn xóa bé <Text style={[styles.petNameHighlight, { color: theme.colors.text }]}>{petName || 'thú cưng'}</Text> khỏi danh sách thú cưng của bạn?
          </Text>
          <Text style={[styles.warningSub, { color: theme.colors.error }]}>
            Hành động này không thể hoàn tác.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: theme.colors.border },
                pressed && { opacity: 0.7 },
                loading && { opacity: 0.5 },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>Hủy</Text>
            </Pressable>

            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.deleteBtn,
                { backgroundColor: theme.colors.error, shadowColor: theme.colors.error },
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                loading && { opacity: 0.6 },
              ]}
              onPress={onConfirm}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>Xóa thú cưng</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 6,
  },
  warningSub: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  petNameHighlight: {
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1.4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
