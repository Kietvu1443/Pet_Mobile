import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { otaStore, OTAUpdateInfo } from './otaStore';
import { API_BASE_URL } from '../api/config';

const STORAGE_KEYS = {
  LAST_CHECKED_AT: 'pethelper.ota.lastCheckedAt',
};

const THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 hours throttle

export const updateService = {
  /**
   * Check for OTA updates with 6h throttle and background pre-download.
   */
  async checkAndPreDownloadOTA(): Promise<void> {
    // Stale-While-Revalidate: If already pre-downloaded in memory, skip network check
    if (otaStore.getState().isDownloaded) {
      return;
    }

    // Check throttle with AsyncStorage
    try {
      const lastCheckedStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECKED_AT);
      if (lastCheckedStr) {
        const lastChecked = parseInt(lastCheckedStr, 10);
        if (!isNaN(lastChecked) && Date.now() - lastChecked < THROTTLE_MS) {
          return;
        }
      }
    } catch {
      // Ignore storage read errors and proceed to check
    }

    otaStore.setState({ isChecking: true, error: null });

    try {
      // In development mode without updates enabled, expo-updates returns isAvailable=false or throws.
      if (__DEV__) {
        otaStore.setState({ isChecking: false });
        return;
      }

      const updateCheck = await Updates.checkForUpdateAsync();
      if (!updateCheck.isAvailable) {
        otaStore.setState({ isChecking: false, hasUpdate: false });
        return;
      }

      otaStore.setState({ isDownloading: true, hasUpdate: true });

      const runtimeVersion = Updates.runtimeVersion || '1.0.0';
      const channel = Updates.channel || 'production';

      // Concurrent pre-download of JS bundle & backend changelog API fetch
      const [fetchResult, changelogRes] = await Promise.allSettled([
        Updates.fetchUpdateAsync(),
        fetch(`${API_BASE_URL}/app/latest-update?channel=${encodeURIComponent(channel)}&runtimeVersion=${encodeURIComponent(runtimeVersion)}`),
      ]);

      const isFetched = fetchResult.status === 'fulfilled';
      let backendInfo: OTAUpdateInfo | null = null;

      if (changelogRes.status === 'fulfilled' && changelogRes.value.ok) {
        try {
          const json = await changelogRes.value.json();
          if (json.success && json.data) {
            backendInfo = json.data;
          }
        } catch {
          // Ignore JSON parse failure
        }
      }

      const fallbackInfo: OTAUpdateInfo = backendInfo || {
        version: 'Mới nhất',
        updateGroup: fetchResult.status === 'fulfilled' && fetchResult.value?.manifest?.id ? fetchResult.value.manifest.id : 'ota-update',
        runtimeVersion: String(runtimeVersion),
        channel: String(channel),
        releaseDate: new Date().toISOString().split('T')[0],
        isMandatory: false,
        changelog: ['Bản cập nhật tối ưu hiệu năng và sửa lỗi hệ thống.'],
      };

      otaStore.setState({
        isChecking: false,
        isDownloading: false,
        isDownloaded: isFetched,
        hasUpdate: true,
        updateInfo: fallbackInfo,
      });
    } catch (error: any) {
      console.warn('[updateService] checkAndPreDownloadOTA error:', error?.message || error);
      otaStore.setState({
        isChecking: false,
        isDownloading: false,
        error: error?.message || 'Không thể kiểm tra cập nhật',
      });
    } finally {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_AT, String(Date.now()));
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
    if (!currentState.isDownloaded) {
      console.warn('[updateService] Cannot apply update: bundle has not been downloaded yet.');
      return;
    }

    const updateGroup = currentState.updateInfo?.updateGroup || 'unknown';
    const runtimeVersion = currentState.updateInfo?.runtimeVersion || String(Updates.runtimeVersion || '1.0.0');

    // Telemetry log to backend with 2.5s best-effort timeout
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
          platform: Platform.OS,
          appliedAt: new Date().toISOString(),
        }),
      }).finally(() => clearTimeout(timeoutId));
    } catch {
      // Best-effort telemetry: ignore failure or timeout
    }

    console.log('[updateService] Applying OTA update and reloading app...', {
      updateGroup,
      runtimeVersion,
      appliedAt: Date.now(),
    });

    try {
      await Updates.reloadAsync();
    } catch (err) {
      console.error('[updateService] reloadAsync error:', err);
    }
  },
};
