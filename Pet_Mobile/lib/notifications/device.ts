// Stub: expo-notifications and expo-device are not installed.
// These stubs prevent crashes when push notification features are called.

const STUB_WARN = '[Device Stub] expo-notifications and expo-device are not installed. Push notifications are disabled.';

export async function registerDevicePushToken(): Promise<void> {
  console.warn(STUB_WARN);
}

export async function unregisterDevicePushToken(): Promise<void> {
  console.warn(STUB_WARN);
}
