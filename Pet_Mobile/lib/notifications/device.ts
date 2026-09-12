import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { isRunningInExpoGo } from 'expo';

import { apiRequest } from '../api/client';

const PUSH_TOKEN_KEY = 'pethelper.push.token';
const PUSH_PREFERENCE_KEY = 'pethelper.push.enabled_pref';

export async function getLocalPushPreference(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(PUSH_PREFERENCE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export async function setLocalPushPreference(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(PUSH_PREFERENCE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

const KNOWN_SCREENS: Record<string, string> = {
  HOUSING_APPROVED: '/housing-review',
  HOUSING_REJECTED: '/housing-review',
  SHELTER_APPROVED: '/shelter-registration',
  SHELTER_REJECTED: '/shelter-registration',
  ADOPTION_APPROVED: '/(tabs)/profile',
  ADOPTION_REJECTED: '/(tabs)/profile',
  PET_RETURN_CREATED: '/(tabs)/profile',
  PET_RETURN_UPDATED: '/(tabs)/profile',
  PLACE_APPROVED: '/places-map',
  PLACE_REJECTED: '/places-map',
  // Legacy types support
  return_workflow: '/(tabs)/profile',
  system: '/(tabs)/profile',
};

/**
 * Core registration handler
 */
async function performRegistration(token: string): Promise<void> {
  await apiRequest('/devices', {
    method: 'POST',
    body: { push_token: token, device_platform: Platform.OS },
  });
}

/**
 * Register push token with the backend.
 * TUYỆT ĐỐI KHÔNG tự động request native permission.
 * Chỉ đăng ký khi:
 * 1. App-level preference (pushEnabled) là true.
 * 2. OS Notification permission ĐÃ ĐƯỢC CẤP (granted) từ trước.
 */
export async function registerDevicePushToken(appPushEnabled?: boolean): Promise<void> {
  // 1. Expo Go Guard
  if (isRunningInExpoGo()) {
    console.warn('[Push] Remote push notifications are not supported in Expo Go sandbox. Skipping registration.');
    return;
  }

  // 2. Physical Device Guard
  if (!Device.isDevice) {
    console.warn('[Push] Simulator detected. Skipping push registration.');
    return;
  }

  // 3. App-level preference check
  if (appPushEnabled !== undefined) {
    await setLocalPushPreference(appPushEnabled);
    if (!appPushEnabled) {
      console.log('[Push] App preference pushEnabled is false. Skipping registration.');
      return;
    }
  } else {
    const isLocalEnabled = await getLocalPushPreference();
    if (!isLocalEnabled) {
      console.log('[Push] Local push preference is disabled. Skipping registration.');
      return;
    }
  }

  try {
    // 4. Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 5. Silent permission check - TUYỆT ĐỐI KHÔNG tự động gọi requestPermissionsAsync()
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      console.log('[Push] OS Notification permission is not granted. Skipping token registration.');
      return;
    }

    // 6. Retrieve project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[Push] EAS Project ID not found in app config. Skipping registration.');
      return;
    }

    // 7. Request token
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    // 8. Check cache to avoid duplicate registration API calls
    const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (storedToken === token) {
      return;
    }

    try {
      await performRegistration(token);
    } catch (err: any) {
      // 9. Retry registration once if rejected (e.g. 401, 404, or stale cache)
      console.warn('[Push] First registration attempt failed. Clearing cache and retrying...', err.message);
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
      await performRegistration(token);
    }

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (err: any) {
    console.warn('[Push] Failed to register device push token:', err.message || err);
  }
}

/**
 * Unregister push token on logout or when user toggles off push notifications
 */
export async function unregisterDevicePushToken(): Promise<void> {
  if (isRunningInExpoGo()) return;

  try {
    await setLocalPushPreference(false);
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await apiRequest(`/devices/${token}`, { method: 'DELETE' });
    }
  } catch (err: any) {
    console.warn('[Push] Failed to unregister device push token:', err.message || err);
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

/**
 * Handle navigation when clicking a push notification, checking for duplicate paths
 */
export function navigateFromNotification(type: string, router: any, currentPathname?: string, fallback?: string): void {
  const route = KNOWN_SCREENS[type];
  if (route) {
    if (currentPathname === route) {
      console.log(`[Push Navigation] Already on target route: ${route}. Skipping duplicate push.`);
      return;
    }
    router.push(route);
  } else {
    console.warn(`[Push Navigation] Unknown notification type: "${type}". Defaulting to fallback.`);
    if (fallback && currentPathname !== fallback) {
      router.push(fallback);
    }
  }
}
