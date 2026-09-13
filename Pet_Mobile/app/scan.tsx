import React, { useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/lib/theme/ThemeContext';
import { AppDialog, AppDialogProps } from '@/components/ui/AppDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);

// Safe native module loader
// Prevents crash when development client has not yet compiled the native ExpoCamera binary
type CameraModuleType = {
  CameraView: any;
  useCameraPermissions: () => [any, () => Promise<any>];
};

let ExpoCamera: CameraModuleType | null = null;
let isNativeCameraSupported = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require('expo-camera');
  if (pkg && pkg.CameraView) {
    ExpoCamera = pkg;
    isNativeCameraSupported = true;
  }
} catch {
  isNativeCameraSupported = false;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  // Manual code input modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const isScanningRef = useRef(false);

  const extractTokenFromQr = (data: string): string | null => {
    if (!data) return null;
    const trimmed = data.trim();

    // 1. https://pethelper.app/pet/<token>
    const httpsMatch = trimmed.match(/^https?:\/\/pethelper\.app\/pet\/([^\s?#/]+)/i);
    if (httpsMatch && httpsMatch[1]) {
      return httpsMatch[1];
    }

    // 2. petmobile://pet/<token>
    const schemeMatch = trimmed.match(/^petmobile:\/\/pet\/([^\s?#/]+)/i);
    if (schemeMatch && schemeMatch[1]) {
      return schemeMatch[1];
    }

    // 3. Raw canonical token format: v1.<iv>.<tag>.<data>
    if (trimmed.startsWith('v1.') && trimmed.split('.').length === 4) {
      return trimmed;
    }

    // 4. Shelter pet code format: e.g. S5181, A4730
    if (/^[A-Z]\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (isScanningRef.current || scanned) return;

      isScanningRef.current = true;
      setScanned(true);

      const token = extractTokenFromQr(data);

      if (token) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to public pet detail
        router.replace(`/pet/${encodeURIComponent(token)}` as any);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setDialogConfig({
          visible: true,
          variant: 'warning',
          title: 'Mã QR không hợp lệ',
          message: 'Mã QR này không thuộc hệ thống Pet Helper hoặc đã hết hạn. Vui lòng quét mã QR hợp lệ của thú cưng.',
          confirmText: 'Quét lại',
          singleButton: true,
          onConfirm: () => {
            setDialogConfig(null);
            setTimeout(() => {
              isScanningRef.current = false;
              setScanned(false);
            }, 500);
          },
        });
      }
    },
    [router, scanned]
  );

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;

    setManualModalVisible(false);
    setManualCode('');

    const token = extractTokenFromQr(trimmed) || trimmed;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(`/pet/${encodeURIComponent(token)}` as any);
  };

  // If native camera is not yet compiled into this dev client binary, show resilient fallback
  if (!isNativeCameraSupported) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Header */}
        <View style={[styles.fallbackTopBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={[styles.fallbackIconCircle, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.fallbackHeaderTitle, { color: theme.colors.text }]}>Quét mã QR</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Content Card */}
        <View style={styles.fallbackContent}>
          <View style={[styles.fallbackIconBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="qr-code-outline" size={54} color={theme.colors.primary} />
          </View>

          <Text style={[styles.fallbackTitle, { color: theme.colors.text }]}>
            Nhập mã hoặc liên kết thú cưng
          </Text>

          <Text style={[styles.fallbackDesc, { color: theme.colors.muted }]}>
            Bản build dev client hiện tại trên máy chưa bao gồm mô-đun Camera native (chạy <Text style={{ fontFamily: 'Fredoka-SemiBold' }}>npx expo run:android</Text> để mở máy ảnh trực tiếp).{'\n\n'}
            Bạn có thể nhập liên kết QR hoặc mã thú cưng bên dưới để xem hồ sơ:
          </Text>

          <TextInput
            style={[
              styles.fallbackInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border || 'transparent',
              },
            ]}
            placeholder="Dán liên kết (https://...) hoặc mã bé..."
            placeholderTextColor={theme.colors.muted}
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={({ pressed }) => [
              styles.fallbackConfirmBtn,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleManualSubmit}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.fallbackConfirmText}>Xem hồ sơ thú cưng</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Active Camera View */}
      <ActiveCameraInner
        torch={torch}
        scanned={scanned}
        onBarcodeScanned={handleBarcodeScanned}
        theme={theme}
        onClose={() => router.back()}
      />

      {/* Top Header Overlay */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.iconCircle}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Quét mã QR</Text>

        <Pressable
          style={[styles.iconCircle, torch && styles.torchActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTorch(!torch);
          }}
          hitSlop={8}
        >
          <Ionicons
            name={torch ? 'flash' : 'flash-off'}
            size={20}
            color={torch ? '#F59E0B' : '#FFFFFF'}
          />
        </Pressable>
      </View>

      {/* Viewfinder Target in Center */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.scanBox}>
          {/* Corner Guides */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.instructionText}>
          Đặt mã QR của thú cưng vào khung hình
        </Text>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.manualInputBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => setManualModalVisible(true)}
        >
          <Ionicons name="keypad-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.manualInputBtnText}>Nhập mã hoặc đường dẫn thủ công</Text>
        </Pressable>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Nhập mã thủ công
            </Text>
            <Text style={[styles.modalDesc, { color: theme.colors.muted }]}>
              Dán liên kết QR hoặc mã thú cưng (ví dụ: https://pethelper.app/pet/... hoặc S5181):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border || 'transparent',
                },
              ]}
              placeholder="Nhập mã hoặc liên kết..."
              placeholderTextColor={theme.colors.muted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => {
                  setManualModalVisible(false);
                  setManualCode('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.text }]}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invalid QR Alert Dialog */}
      {dialogConfig && (
        <AppDialog
          visible={dialogConfig.visible}
          variant={dialogConfig.variant}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          singleButton={dialogConfig.singleButton}
          onConfirm={dialogConfig.onConfirm}
        />
      )}
    </View>
  );
}

// Inner component isolated so useCameraPermissions is only called when ExpoCamera exists
function ActiveCameraInner({
  torch,
  scanned,
  onBarcodeScanned,
  theme,
  onClose,
}: {
  torch: boolean;
  scanned: boolean;
  onBarcodeScanned: ({ data }: { data: string }) => void;
  theme: any;
  onClose: () => void;
}) {
  const [permission, requestPermission] = ExpoCamera!.useCameraPermissions();

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#111827' }]}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background, padding: 24 }]}>
        <View style={[styles.permissionIconCircle, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="camera-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
          Quyền truy cập Camera
        </Text>
        <Text style={[styles.permissionDesc, { color: theme.colors.muted }]}>
          Pet Helper cần sử dụng camera để quét mã QR và xem hồ sơ công khai của thú cưng.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.permissionBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Cấp quyền truy cập máy ảnh</Text>
        </Pressable>

        <Pressable style={styles.permissionBackBtn} onPress={onClose}>
          <Text style={[styles.permissionBackText, { color: theme.colors.muted }]}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const CameraComponent = ExpoCamera!.CameraView;

  return (
    <CameraComponent
      style={StyleSheet.absoluteFillObject}
      facing="back"
      enableTorch={torch}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fallbackIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Fredoka-SemiBold',
  },
  fallbackContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  fallbackIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  fallbackInput: {
    width: '100%',
    maxWidth: 340,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  fallbackConfirmBtn: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 340,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  permissionBtn: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Fredoka-SemiBold',
  },
  permissionBackBtn: {
    padding: 10,
  },
  permissionBackText: {
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Fredoka-SemiBold',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
    marginTop: 28,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  manualInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  manualInputBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Fredoka-SemiBold',
  },
});
