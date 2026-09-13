import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';

interface PetQrModalProps {
  visible: boolean;
  onClose: () => void;
  petName: string;
  token?: string | null;
  canonicalUrl?: string | null;
  petImageUrl?: string | null;
  petTypeLabel?: string;
}

export const PetQrModal: React.FC<PetQrModalProps> = ({
  visible,
  onClose,
  petName,
  token,
  canonicalUrl,
  petImageUrl,
  petTypeLabel = 'Thú cưng',
}) => {
  const { theme } = useTheme();

  const qrValue = canonicalUrl || (token ? `https://pethelper.app/pet/${token}` : '');

  const handleShare = async () => {
    if (!qrValue) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Xem hồ sơ công khai của bé ${petName || 'thú cưng'} trên Pet Helper: ${qrValue}`,
        url: qrValue,
        title: `Hồ sơ thú cưng: ${petName}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          {/* Close button */}
          <Pressable
            style={[styles.closeBtn, { backgroundColor: theme.colors.surface }]}
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </Pressable>

          {/* Pet info header */}
          <View style={styles.petHeader}>
            {petImageUrl ? (
              <Image
                source={{ uri: petImageUrl }}
                style={styles.petAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.petAvatarFallback, { backgroundColor: theme.colors.primaryContainer }]}>
                <Ionicons name="paw" size={24} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.petInfo}>
              <Text style={[styles.petName, { color: theme.colors.text }]} numberOfLines={1}>
                {petName || 'Bé cưng'}
              </Text>
              <Text style={[styles.petSub, { color: theme.colors.muted }]}>
                {petTypeLabel} • Mã định danh an toàn
              </Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={200}
                color="#1A1C1E"
                backgroundColor="#FFFFFF"
              />
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Đang tạo mã QR...</Text>
              </View>
            )}
          </View>

          {/* Instruction */}
          <Text style={[styles.hintText, { color: theme.colors.muted }]}>
            Quét mã để xem hồ sơ công khai của bé.{'\n'}
            Thông tin cá nhân của chủ nuôi được bảo mật 100%.
          </Text>

          {/* Canonical URL preview */}
          {qrValue ? (
            <View style={[styles.urlBadge, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="link-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.urlText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="middle">
                {qrValue}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.shareBtnText}>Chia sẻ liên kết</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
    paddingRight: 28,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  petAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 2,
  },
  petSub: {
    fontSize: 12,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  urlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 18,
    maxWidth: '100%',
  },
  urlText: {
    fontSize: 12,
    fontFamily: 'Fredoka-Medium',
  },
  btnRow: {
    width: '100%',
  },
  shareBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
  },
});
