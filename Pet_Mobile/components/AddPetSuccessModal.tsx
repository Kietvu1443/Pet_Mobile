import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

interface AddPetSuccessModalProps {
  visible: boolean;
  petName: string;
  onConfirm: () => void;
}

export const AddPetSuccessModal: React.FC<AddPetSuccessModalProps> = ({
  visible,
  petName,
  onConfirm,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {/* Top Emoji / Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={styles.emoji}>🎉</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Thành công! 🎉
          </Text>

          {/* Subtitle / Description */}
          <Text style={[styles.description, { color: theme.colors.muted }]}>
            Đã thêm bé <Text style={[styles.petNameHighlight, { color: theme.colors.primary }]}>{petName || 'thú cưng'}</Text> vào danh sách thú cưng của bạn.
          </Text>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmBtnText}>Xem danh sách thú cưng 🐾</Text>
          </Pressable>
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
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  petNameHighlight: {
    fontWeight: '700',
  },
  confirmBtn: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
