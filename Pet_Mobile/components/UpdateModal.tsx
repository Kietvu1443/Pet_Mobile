import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOTAStore, otaStore } from '@/lib/updates/otaStore';
import { updateService } from '@/lib/updates/updateService';
import { useTheme } from '@/lib/theme/ThemeContext';
import { SNAP_FONTS } from '@/constants/petsnap-theme';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onClose }) => {
  const { isDownloading, isDownloaded, hasUpdate, updateInfo, currentVersion } = useOTAStore();
  const { theme } = useTheme();

  React.useEffect(() => {
    if (visible) {
      updateService.checkAndPreDownloadOTA(true);
    }
  }, [visible]);

  const handleApply = async () => {
    if (isDownloaded) {
      await updateService.applyOTAUpdate();
      onClose();
    } else {
      otaStore.setState({ isDownloading: true });
      setTimeout(() => {
        otaStore.setState({ isDownloading: false, isDownloaded: true });
      }, 1000);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons
                name={hasUpdate ? 'rocket-sharp' : 'checkmark-circle-outline'}
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {hasUpdate ? `Bản cập nhật ${updateInfo?.version || ''}` : 'Thông tin phiên bản'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
                {hasUpdate
                  ? `Phát hành: ${updateInfo?.releaseDate || 'Mới'} (Hiện tại: v${currentVersion})`
                  : `Phiên bản ${currentVersion} (Mới nhất)`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.muted} />
            </Pressable>
          </View>

          {/* Changelog / Status Section */}
          <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {hasUpdate ? 'Điểm mới trong bản cập nhật này:' : 'Trạng thái phiên bản:'}
            </Text>
            {hasUpdate && updateInfo?.changelog && updateInfo.changelog.length > 0 ? (
              updateInfo.changelog.map((item, index) => (
                <View key={index} style={styles.changelogItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.colors.primary}
                    style={styles.checkIcon}
                  />
                  <Text style={[styles.changelogText, { color: theme.colors.text }]}>
                    {item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.changelogText, { color: theme.colors.muted }]}>
                {hasUpdate
                  ? 'Bao gồm nhiều cải tiến hiệu năng và sửa lỗi giao diện người dùng.'
                  : 'Bạn đang sử dụng phiên bản mới nhất. Chưa có bản cập nhật nào mới hơn.'}
              </Text>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            {isDownloading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
                  Đang tải bản cập nhật...
                </Text>
              </View>
            ) : hasUpdate ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.colors.primary },
                    pressed && styles.pressed,
                  ]}
                  onPress={handleApply}
                >
                  <Ionicons name="refresh-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>
                    {isDownloaded ? 'Khởi động lại để áp dụng' : 'Tải bản cập nhật'}
                  </Text>
                </Pressable>

                {!updateInfo?.isMandatory && (
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                    onPress={onClose}
                  >
                    <Text style={[styles.secondaryBtnText, { color: theme.colors.muted }]}>
                      Để sau
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.colors.primary },
                    pressed && styles.pressed,
                  ]}
                  onPress={onClose}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>Đã là phiên bản mới nhất</Text>
                </Pressable>

                {currentVersion !== '1.0.0' && (
                  <Pressable
                    onPress={async () => {
                      await otaStore.resetVersion();
                      updateService.checkAndPreDownloadOTA(true);
                    }}
                    style={{ marginTop: 12, alignSelf: 'center', padding: 4 }}
                  >
                    <Text style={{ fontSize: 12, color: theme.colors.muted, textDecorationLine: 'underline' }}>
                      Đặt lại về phiên bản 1.0.0 (Thử nghiệm)
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: SNAP_FONTS.bold,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: SNAP_FONTS.regular,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  changelogScroll: {
    maxHeight: 220,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.semibold,
    marginBottom: 10,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  changelogText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.regular,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.medium,
    marginLeft: 8,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: SNAP_FONTS.bold,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: SNAP_FONTS.medium,
  },
  pressed: {
    opacity: 0.8,
  },
});
