import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOTAStore, otaStore } from '@/lib/updates/otaStore';
import { updateService } from '@/lib/updates/updateService';
import { useTheme } from '@/lib/theme/ThemeContext';
import { SNAP_FONTS } from '@/constants/petsnap-theme';

export const UpdateBanner: React.FC = () => {
  const { hasUpdate, isDownloaded, dismissedUpdateGroup, updateInfo } = useOTAStore();
  const { theme } = useTheme();

  if (!hasUpdate || !isDownloaded || !updateInfo) {
    return null;
  }

  // If user dismissed banner for this specific updateGroup, hide banner
  if (dismissedUpdateGroup === updateInfo.updateGroup) {
    return null;
  }

  const handleApply = () => {
    updateService.applyOTAUpdate();
  };

  const handleDismiss = () => {
    otaStore.dismissBanner(updateInfo.updateGroup);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        <Ionicons name="sparkles" size={20} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.text} numberOfLines={1}>
          Đã tải sẵn bản cập nhật {updateInfo.version}!
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleApply}
        >
          <Text style={styles.buttonText}>Khởi động lại</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          onPress={handleDismiss}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontFamily: SNAP_FONTS.semibold,
    color: '#FFFFFF',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: SNAP_FONTS.bold,
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
