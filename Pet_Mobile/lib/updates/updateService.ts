import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { otaStore, OTAUpdateInfo, OTA_STORAGE_KEYS } from './otaStore';
import { API_BASE_URL } from '../api/config';

const THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 hours throttle

export const updateService = {
  /**
   * Fetch latest update metadata (changelog, version, etc.) from backend.
   */
  async fetchBackendUpdateInfo(): Promise<OTAUpdateInfo | null> {
    try {
      const runtimeVersion = Updates.runtimeVersion || '1.0.0';
      const channel = Updates.channel || 'production';
      const currentVer = otaStore.getState().currentVersion || '1.0.0';
      const res = await fetch(
        `${API_BASE_URL}/app/latest-update?channel=${encodeURIComponent(channel)}&runtimeVersion=${encodeURIComponent(runtimeVersion)}&currentVersion=${encodeURIComponent(currentVer)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[updateService] fetchBackendUpdateInfo error:', e);
    }
    return null;
  },

  /**
   * Check for OTA updates with 6h throttle and background pre-download.
   */
  async checkAndPreDownloadOTA(force: boolean = false): Promise<void> {
    // Initialize persisted state (e.g. dismissedUpdateGroup, currentVersion) if not loaded
    await otaStore.initPersistedState();

    // Stale-While-Revalidate: If already pre-downloaded in memory, skip network check
    if (otaStore.getState().isDownloaded && !force) {
      return;
    }

    // Check throttle with AsyncStorage unless force is requested
    if (!force) {
      try {
        const lastCheckedStr = await AsyncStorage.getItem(OTA_STORAGE_KEYS.LAST_CHECKED_AT);
        if (lastCheckedStr) {
          const lastChecked = parseInt(lastCheckedStr, 10);
          if (!isNaN(lastChecked) && Date.now() - lastChecked < THROTTLE_MS) {
            return;
          }
        }
      } catch {
        // Ignore storage read errors and proceed to check
      }
    }

    otaStore.setState({ isChecking: true, error: null });

    try {
      // 1. Luôn truy vấn thông tin cập nhật kế tiếp từ backend theo log
      const backendInfo = await this.fetchBackendUpdateInfo();

      if (!backendInfo || (backendInfo as any).hasUpdate === false) {
        otaStore.setState({
          isChecking: false,
          isDownloading: false,
          hasUpdate: false,
          isDownloaded: false,
          updateInfo: null,
        });
        return;
      }

      // 2. Nếu đang chạy trong standalone build có native expo-updates
      if (!__DEV__ && Updates.isEnabled) {
        try {
          const updateCheck = await Updates.checkForUpdateAsync();
          if (updateCheck.isAvailable) {
            otaStore.setState({ isDownloading: true, hasUpdate: true, updateInfo: backendInfo });
            const fetchResult = await Updates.fetchUpdateAsync();
            if (fetchResult && fetchResult.isNew) {
              otaStore.setState({
                isChecking: false,
                isDownloading: false,
                isDownloaded: true,
                hasUpdate: true,
                updateInfo: backendInfo,
              });
              return;
            }
          }
        } catch (nativeErr) {
          console.warn('[updateService] Native Updates check error:', nativeErr);
        }
      }

      // 3. Có bản cập nhật mới theo thứ tự log backend
      otaStore.setState({
        isChecking: false,
        isDownloading: false,
        isDownloaded: false,
        hasUpdate: true,
        updateInfo: backendInfo,
      });
    } catch (error: any) {
      console.warn('[updateService] checkAndPreDownloadOTA error:', error?.message || error);
      otaStore.setState({
        isChecking: false,
        isDownloading: false,
        hasUpdate: false,
        isDownloaded: false,
        error: error?.message || 'Không thể kiểm tra cập nhật',
      });
    } finally {
      try {
        await AsyncStorage.setItem(OTA_STORAGE_KEYS.LAST_CHECKED_AT, String(Date.now()));
      } catch {
        // Ignore storage write error
      }
    }
  },

  /**
   * Safely apply the downloaded update with best-effort telemetry logging.
   */
  async applyOTAUpdate(): Promise<void> {
    const currentState = otaStore.getState();
    const targetVersion = currentState.updateInfo?.version || '1.0.0';
    const updateGroup = currentState.updateInfo?.updateGroup || 'unknown';
    const runtimeVersion = currentState.updateInfo?.runtimeVersion || String(Updates.runtimeVersion || '1.0.0');

    // 1. Lưu phiên bản mới vào AsyncStorage & otaStore ngay lập tức
    await otaStore.setCurrentVersion(targetVersion);

    // 2. Telemetry log to backend with 2.5s best-effort timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      await fetch(`${API_BASE_URL}/app/update-applied`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          updateGroup,
          runtimeVersion,
          version: targetVersion,
          platform: Platform.OS,
          appliedAt: new Date().toISOString(),
        }),
      }).finally(() => clearTimeout(timeoutId));
    } catch {
      // Best-effort telemetry
    }

    console.log('[updateService] Successfully applied update to version:', targetVersion);

    // 3. Reset trạng thái modal
    otaStore.setState({
      isChecking: false,
      isDownloading: false,
      isDownloaded: false,
      hasUpdate: false,
      updateInfo: null,
    });

    // 4. Nếu là standalone build với expo-updates native thì reload bundle
    if (!__DEV__ && Updates.isEnabled) {
      try {
        await Updates.reloadAsync();
      } catch (err) {
        console.error('[updateService] reloadAsync error:', err);
      }
    }
  },
};
