import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { isRunningInExpoGo } from 'expo';

import { apiRequest } from '../api/client';

const PUSH_TOKEN_KEY = 'pethelper.push.token';

const KNOWN_SCREENS: Record<string, string> = {
  HOUSING_APPROVED: '/housing-review',
  HOUSING_REJECTED: '/housing-review',
  SHELTER_APPROVED: '/shelter-registration',
  SHELTER_REJECTED: '/shelter-registration',
  ADOPTION_APPROVED: '/(tabs)/profile',
  ADOPTION_REJECTED: '/(tabs)/profile',
  PET_RETURN_CREATED: '/(tabs)/profile',
  PET_RETURN_UPDATED: '/(tabs)/profile',
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
 * Register push token with the backend
 */
export async function registerDevicePushToken(): Promise<void> {
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

  try {
    // 3. Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 4. Permission flow
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Push] Notification permission denied. Skipping registration.');
      return;
    }

    // 5. Retrieve project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[Push] EAS Project ID not found in app config. Skipping registration.');
      return;
    }

    // 6. Request token
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    // 7. Check cache to avoid duplicate registration API calls
    const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (storedToken === token) {
      return;
    }

    try {
      await performRegistration(token);
    } catch (err: any) {
      // 8. Retry registration once if rejected (e.g. 401, 404, or stale cache)
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
 * Unregister push token on logout
 */
export async function unregisterDevicePushToken(): Promise<void> {
  if (isRunningInExpoGo()) return;

  try {
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
