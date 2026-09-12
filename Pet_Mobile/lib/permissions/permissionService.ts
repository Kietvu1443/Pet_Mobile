import { Linking } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Cache checked modules
let cachedLocationMod: any = undefined;
let cachedImagePickerMod: any = undefined;
let cachedNotificationsMod: any = undefined;

function getNotificationsMod(): any | null {
  if (cachedNotificationsMod !== undefined) return cachedNotificationsMod;
  try {
    const mod = require('expo-notifications');
    cachedNotificationsMod = mod || null;
    return cachedNotificationsMod;
  } catch {
    cachedNotificationsMod = null;
    return null;
  }
}

function getLocationMod(): any | null {
  if (cachedLocationMod !== undefined) return cachedLocationMod;
  try {
    if (typeof requireOptionalNativeModule === 'function') {
      const nativeMod = requireOptionalNativeModule('ExpoLocation');
      if (!nativeMod) {
        cachedLocationMod = null;
        return null;
      }
    }
    const mod = require('expo-location');
    cachedLocationMod = mod || null;
    return cachedLocationMod;
  } catch {
    cachedLocationMod = null;
    return null;
  }
}

function getImagePickerMod(): any | null {
  if (cachedImagePickerMod !== undefined) return cachedImagePickerMod;
  try {
    if (typeof requireOptionalNativeModule === 'function') {
      const nativeMod = requireOptionalNativeModule('ExpoImagePicker');
      if (!nativeMod) {
        cachedImagePickerMod = null;
        return null;
      }
    }
    const mod = require('expo-image-picker');
    cachedImagePickerMod = mod || null;
    return cachedImagePickerMod;
  } catch {
    cachedImagePickerMod = null;
    return null;
  }
}

/**
 * Kiểm tra xem quyền vị trí Foreground đã được cấp hay chưa (Không bật popup native)
 */
export async function checkLocationPermission(): Promise<boolean> {
  const mod = getLocationMod();
  if (!mod || typeof mod.getForegroundPermissionsAsync !== 'function') {
    return false;
  }
  try {
    const res = await mod.getForegroundPermissionsAsync();
    return res?.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Yêu cầu quyền vị trí Foreground từ hệ điều hành Android
 */
export async function requestLocationPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  const mod = getLocationMod();
  if (!mod || typeof mod.requestForegroundPermissionsAsync !== 'function') {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }
  try {
    const res = await mod.requestForegroundPermissionsAsync();
    return {
      granted: res?.status === 'granted',
      canAskAgain: res?.canAskAgain ?? true,
      status: res?.status || 'denied',
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}

/**
 * Kiểm tra xem quyền truy cập thư viện ảnh (Media Library) đã được cấp chưa.
 * Lưu ý: Với Android 13+ (API 33+) và Expo ImagePicker v17, launchImageLibraryAsync()
 * sử dụng Android Photo Picker hệ thống (ActivityResultContracts.PickVisualMedia),
 * cơ chế này KHÔNG yêu cầu quyền runtime toàn thư viện (READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE).
 * Do đó, các màn hình chọn ảnh (avatar, pet, place) có thể mở trực tiếp Photo Picker mà không cần chặn quyền trước.
 */
export async function checkMediaLibraryPermission(): Promise<boolean> {
  const mod = getImagePickerMod();
  if (!mod || typeof mod.getMediaLibraryPermissionsAsync !== 'function') {
    return false;
  }
  try {
    const res = await mod.getMediaLibraryPermissionsAsync();
    return res?.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Yêu cầu quyền truy cập thư viện ảnh từ hệ điều hành Android
 */
export async function requestMediaLibraryPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  const mod = getImagePickerMod();
  if (!mod || typeof mod.requestMediaLibraryPermissionsAsync !== 'function') {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }
  try {
    const res = await mod.requestMediaLibraryPermissionsAsync();
    return {
      granted: res?.status === 'granted',
      canAskAgain: res?.canAskAgain ?? true,
      status: res?.status || 'denied',
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}

/**
 * Mở trang Cài đặt ứng dụng trên Android để người dùng cấp quyền nếu đã chọn "Không hỏi lại"
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (err) {
    console.log('[permissionService] openSettings error:', err);
  }
}

/**
 * Kiểm tra xem quyền thông báo đã được cấp hay chưa (im lặng, KHÔNG bật popup native)
 */
export async function checkNotificationPermission(): Promise<boolean> {
  const mod = getNotificationsMod();
  if (!mod || typeof mod.getPermissionsAsync !== 'function') {
    return false;
  }
  try {
    const res = await mod.getPermissionsAsync();
    return res?.status === 'granted' || res?.granted === true;
  } catch {
    return false;
  }
}

/**
 * Lấy thông tin chi tiết quyền thông báo của OS (status, canAskAgain, granted)
 * Chạy im lặng, không popup.
 */
export async function getNotificationPermissionDetails(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  const mod = getNotificationsMod();
  if (!mod || typeof mod.getPermissionsAsync !== 'function') {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }
  try {
    const res = await mod.getPermissionsAsync();
    const granted = res?.status === 'granted' || res?.granted === true;
    return {
      granted,
      canAskAgain: res?.canAskAgain ?? true,
      status: res?.status || (granted ? 'granted' : 'denied'),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'unavailable' };
  }
}

/**
 * Yêu cầu quyền thông báo từ hệ điều hành Android.
 * CHỈ được gọi khi người dùng đã chủ động bật toggle và xác nhận "Cho phép" trên AppDialog.
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}> {
  const mod = getNotificationsMod();
  if (!mod || typeof mod.requestPermissionsAsync !== 'function') {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }
  try {
    const res = await mod.requestPermissionsAsync();
    const granted = res?.status === 'granted' || res?.granted === true;
    return {
      granted,
      canAskAgain: res?.canAskAgain ?? true,
      status: res?.status || (granted ? 'granted' : 'denied'),
    };
  } catch {
    return { granted: false, canAskAgain: true, status: 'denied' };
  }
}
