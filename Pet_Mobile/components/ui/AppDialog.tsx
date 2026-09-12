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

export type AppDialogVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'confirm'
  | 'destructive'
  | 'permission';

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AppDialogVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  /** Nếu true, chỉ hiển thị một nút chính duy nhất (cho thông báo thông tin/thành công) */
  singleButton?: boolean;
  children?: React.ReactNode;
}

export const AppDialog: React.FC<AppDialogProps> = ({
  visible,
  title,
  message,
  variant = 'confirm',
  iconName,
  confirmText,
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  singleButton = false,
  children,
}) => {
  const { theme } = useTheme();

  // Xác định icon và màu sắc chủ đạo theo variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          defaultIcon: 'trash-outline' as const,
          iconColor: theme.colors.error,
          iconBg: theme.colors.errorContainer,
          confirmBtnBg: theme.colors.error,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Xóa',
        };
      case 'warning':
        return {
          defaultIcon: 'warning-outline' as const,
          iconColor: theme.colors.warning,
          iconBg: theme.colors.warningContainer,
          confirmBtnBg: theme.colors.warning,
          confirmTextColor: '#00220F',
          defaultConfirmText: 'Đồng ý',
        };
      case 'error':
        return {
          defaultIcon: 'alert-circle-outline' as const,
          iconColor: theme.colors.error,
          iconBg: theme.colors.errorContainer,
          confirmBtnBg: theme.colors.error,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Đã hiểu',
        };
      case 'success':
        return {
          defaultIcon: 'checkmark-circle-outline' as const,
          iconColor: theme.colors.success,
          iconBg: theme.colors.successContainer,
          confirmBtnBg: theme.colors.success,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Đã hiểu',
        };
      case 'permission':
        return {
          defaultIcon: 'shield-checkmark-outline' as const,
          iconColor: theme.colors.primary,
          iconBg: theme.colors.primaryContainer,
          confirmBtnBg: theme.colors.primary,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Cho phép',
        };
      case 'info':
        return {
          defaultIcon: 'information-circle-outline' as const,
          iconColor: theme.colors.primary,
          iconBg: theme.colors.primaryContainer,
          confirmBtnBg: theme.colors.primary,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Đã hiểu',
        };
      case 'confirm':
      default:
        return {
          defaultIcon: 'help-circle-outline' as const,
          iconColor: theme.colors.primary,
          iconBg: theme.colors.primaryContainer,
          confirmBtnBg: theme.colors.primary,
          confirmTextColor: '#FFFFFF',
          defaultConfirmText: 'Xác nhận',
        };
    }
  };

  const vConfig = getVariantStyles();
  const activeIcon = iconName || vConfig.defaultIcon;
  const activeConfirmText = confirmText || vConfig.defaultConfirmText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {/* Top Circular Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: vConfig.iconBg }]}>
            <Ionicons name={activeIcon} size={32} color={vConfig.iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>

          {/* Description Message */}
          {message ? (
            <Text style={[styles.message, { color: theme.colors.muted }]}>
              {message}
            </Text>
          ) : null}

          {/* Optional Children Content */}
          {children}

          {/* Action Buttons */}
          <View style={[styles.buttonRow, { marginTop: children ? 12 : 24 }]}>
            {!singleButton && (
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
                <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>
                  {cancelText}
                </Text>
              </Pressable>
            )}

            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: vConfig.confirmBtnBg },
                singleButton && styles.singleConfirmBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                loading && { opacity: 0.6 },
              ]}
              onPress={onConfirm}
            >
              {loading ? (
                <ActivityIndicator color={vConfig.confirmTextColor} size="small" />
              ) : (
                <Text style={[styles.confirmBtnText, { color: vConfig.confirmTextColor }]}>
                  {activeConfirmText}
                </Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
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
    minHeight: 48,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.3,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  singleConfirmBtn: {
    flex: 1,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
