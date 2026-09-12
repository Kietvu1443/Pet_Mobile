// Safe Location Helper with accurate GPS flow & no fake coordinates
// Ngăn chặn crash app khi native module ExpoLocation chưa được nạp/link trong môi trường hiện tại

import { requireOptionalNativeModule } from 'expo-modules-core';

export type SafeCoords = {
  latitude: number;
  longitude: number;
};

// Neutral default map center for initial camera view in Vietnam (NEVER used as fake user GPS)
export const DEFAULT_MAP_CENTER: SafeCoords = {
  latitude: 10.7769,
  longitude: 106.7009,
};

// Backwards-compatibility alias
export const DEFAULT_HCMC_COORDS = DEFAULT_MAP_CENTER;

/**
 * Trạng thái kết quả định vị
 */
export type LocationResultStatus =
  | 'SUCCESS'
  | 'PERMISSION_DENIED'
  | 'SERVICES_DISABLED'
  | 'TIMEOUT'
  | 'UNAVAILABLE';

export type SafeLocationResult = {
  status: LocationResultStatus;
  location: SafeCoords | null;
  isLastKnown?: boolean;
  permissionGranted: boolean;
  errorMessage?: string;
};

// 3 distinct cache states:
// undefined = not checked yet
// valid object = available
// null = checked and unavailable
let cachedLocationModule: any = undefined;

export function isExpoLocationAvailable(): boolean {
  return getLocationModule() !== null;
}

function getLocationModule(): any | null {
  if (cachedLocationModule !== undefined) {
    return cachedLocationModule;
  }

  try {
    // Kiểm tra xem native module ExpoLocation có thực sự tồn tại trong binary đang chạy hay không
    // requireOptionalNativeModule trả về null an toàn mà không ném exception hay gây crash Metro
    if (typeof requireOptionalNativeModule === 'function') {
      const nativeMod = requireOptionalNativeModule('ExpoLocation');
      if (!nativeMod) {
        cachedLocationModule = null;
        return null;
      }
    }

    // Khi native module đã được compile trong binary, nạp expo-location bình thường
    const mod = require('expo-location');
    if (mod && typeof mod.getForegroundPermissionsAsync === 'function') {
      cachedLocationModule = mod;
      return mod;
    }
    cachedLocationModule = null;
    return null;
  } catch (err) {
    console.log('[safeLocation] expo-location not available:', err);
    cachedLocationModule = null;
    return null;
  }
}

/**
 * Validate latitude and longitude values
 */
export function isValidCoords(coords: any): coords is SafeCoords {
  if (!coords) return false;
  const lat = Number(coords.latitude);
  const lng = Number(coords.longitude);
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Xin quyền vị trí an toàn (không crash nếu thiếu native module)
 */
export async function safeRequestLocationPermission(): Promise<{ granted: boolean; status: string }> {
  const mod = getLocationModule();
  if (!mod || typeof mod.requestForegroundPermissionsAsync !== 'function') {
    return { granted: false, status: 'unavailable' };
  }
  try {
    if (typeof mod.getForegroundPermissionsAsync === 'function') {
      const current = await mod.getForegroundPermissionsAsync();
      if (current?.status === 'granted') {
        return { granted: true, status: 'granted' };
      }
    }
    const result = await mod.requestForegroundPermissionsAsync();
    return {
      granted: result?.status === 'granted',
      status: result?.status || 'denied',
    };
  } catch {
    return { granted: false, status: 'denied' };
  }
}

// In-memory location cache with 5-minute validity
let inMemoryLocation: { coords: SafeCoords; timestamp: number } | null = null;

/**
 * Lấy vị trí GPS người dùng một cách chính xác và an toàn:
 * 1. getForegroundPermissionsAsync() -> nếu chưa cấp thì requestForegroundPermissionsAsync()
 * 2. hasServicesEnabledAsync() -> kiểm tra dịch vụ vị trí của thiết bị
 * 3. getLastKnownPositionAsync() -> vị trí nhanh dự phòng
 * 4. getCurrentPositionAsync({ accuracy: Balanced }) với Promise.race timeout 8s
 * 5. Trả về SafeLocationResult có cấu trúc (KHÔNG FAKE TỌA ĐỘ)
 */
export async function safeGetUserLocation(requestIfDenied: boolean = false): Promise<SafeLocationResult> {
  const mod = getLocationModule();
  if (!mod) {
    return {
      status: 'UNAVAILABLE',
      location: null,
      permissionGranted: false,
      errorMessage: 'Module định vị không khả dụng trong môi trường hiện tại.',
    };
  }

  // 1. Kiểm tra / Xin quyền truy cập vị trí
  try {
    let permStatus = 'undetermined';
    if (typeof mod.getForegroundPermissionsAsync === 'function') {
      const existing = await mod.getForegroundPermissionsAsync();
      permStatus = existing?.status || 'undetermined';
    }

    if (permStatus !== 'granted' && requestIfDenied && typeof mod.requestForegroundPermissionsAsync === 'function') {
      const requested = await mod.requestForegroundPermissionsAsync();
      permStatus = requested?.status || 'denied';
    }

    if (permStatus !== 'granted') {
      return {
        status: 'PERMISSION_DENIED',
        location: null,
        permissionGranted: false,
        errorMessage: 'Ứng dụng cần quyền vị trí để hiển thị các địa điểm gần bạn.',
      };
    }
  } catch (err: any) {
    console.log('[safeLocation] Permission check error:', err);
    return {
      status: 'PERMISSION_DENIED',
      location: null,
      permissionGranted: false,
      errorMessage: err?.message || 'Không thể yêu cầu quyền vị trí.',
    };
  }

  // 2. Kiểm tra dịch vụ vị trí của thiết bị
  try {
    if (typeof mod.hasServicesEnabledAsync === 'function') {
      const enabled = await mod.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          status: 'SERVICES_DISABLED',
          location: null,
          permissionGranted: true,
          errorMessage: 'Dịch vụ vị trí của thiết bị đang tắt.',
        };
      }
    }
  } catch (err) {
    console.log('[safeLocation] hasServicesEnabledAsync error:', err);
  }

  // 3. Thử lấy lastKnownPosition trước (vị trí gần nhất để dự phòng)
  let lastKnownCoords: SafeCoords | null = null;
  try {
    if (typeof mod.getLastKnownPositionAsync === 'function') {
      const lastKnown = await mod.getLastKnownPositionAsync({ maxAge: 180000 });
      if (lastKnown?.coords && isValidCoords(lastKnown.coords)) {
        lastKnownCoords = {
          latitude: Number(lastKnown.coords.latitude),
          longitude: Number(lastKnown.coords.longitude),
        };
        inMemoryLocation = { coords: lastKnownCoords, timestamp: Date.now() };
      }
    }
  } catch (err) {
    // Bỏ qua lỗi lastKnown, tiếp tục lấy fresh
  }

  // 4. Lấy vị trí GPS tươi mới với timeout 5 giây
  let freshCoords: SafeCoords | null = null;
  let isTimedOut = false;

  try {
    if (typeof mod.getCurrentPositionAsync === 'function') {
      const fetchPromise = mod.getCurrentPositionAsync({
        accuracy: mod.Accuracy?.Balanced ?? 3,
      });

      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 5000);
      });

      const freshLoc: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (freshLoc?.coords && isValidCoords(freshLoc.coords)) {
        freshCoords = {
          latitude: Number(freshLoc.coords.latitude),
          longitude: Number(freshLoc.coords.longitude),
        };
        inMemoryLocation = { coords: freshCoords, timestamp: Date.now() };
      }
    }
  } catch (err: any) {
    if (err?.message === 'LOCATION_TIMEOUT') {
      isTimedOut = true;
    } else {
      console.log('[safeLocation] getCurrentPositionAsync error:', err?.message || err);
    }
  }

  // Nếu lấy được vị trí GPS tươi mới
  if (freshCoords) {
    return {
      status: 'SUCCESS',
      location: freshCoords,
      isLastKnown: false,
      permissionGranted: true,
    };
  }

  // Nếu timeout hoặc fresh thất bại nhưng có lastKnown -> dùng lastKnown
  if (lastKnownCoords) {
    return {
      status: 'SUCCESS',
      location: lastKnownCoords,
      isLastKnown: true,
      permissionGranted: true,
    };
  }

  // Nếu timeout và không có cả lastKnown
  if (isTimedOut) {
    return {
      status: 'TIMEOUT',
      location: null,
      permissionGranted: true,
      errorMessage: 'Hết thời gian chờ nhận tín hiệu GPS.',
    };
  }

  return {
    status: 'UNAVAILABLE',
    location: null,
    permissionGranted: true,
    errorMessage: 'Không thể xác định vị trí hiện tại.',
  };
}

/**
 * Tính khoảng cách giữa 2 tọa độ theo mét (Haversine formula)
 */
export function calculateDistanceMeters(coords1: SafeCoords, coords2: SafeCoords): number {
  const R = 6371e3; // metres
  const φ1 = (coords1.latitude * Math.PI) / 180;
  const φ2 = (coords2.latitude * Math.PI) / 180;
  const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Lấy vị trí đã cache trong bộ nhớ (hợp lệ trong 5 phút)
 */
export function getCachedUserLocation(): SafeCoords | null {
  if (!inMemoryLocation) return null;
  if (Date.now() - inMemoryLocation.timestamp > 300000) {
    return null;
  }
  return inMemoryLocation.coords;
}

/**
 * Lấy vị trí nhanh không block UI:
 * 1. Trả về ngay nếu có in-memory cache hợp lệ (< 5 phút)
 * 2. Nếu có quyền, lấy nhanh getLastKnownPositionAsync (maxAge 3 phút)
 * 3. Fallback sang safeGetUserLocation() nếu chưa có vị trí nào
 */
export async function safeGetFastLocation(requestIfDenied: boolean = false): Promise<SafeLocationResult> {
  const cached = getCachedUserLocation();
  if (cached) {
    return {
      status: 'SUCCESS',
      location: cached,
      isLastKnown: true,
      permissionGranted: true,
    };
  }

  const mod = getLocationModule();
  if (!mod) {
    return {
      status: 'UNAVAILABLE',
      location: null,
      permissionGranted: false,
      errorMessage: 'Module định vị không khả dụng trong môi trường hiện tại.',
    };
  }

  try {
    if (typeof mod.getForegroundPermissionsAsync === 'function') {
      const current = await mod.getForegroundPermissionsAsync();
      if (current?.status === 'granted' && typeof mod.getLastKnownPositionAsync === 'function') {
        const lastKnown = await mod.getLastKnownPositionAsync({ maxAge: 180000 });
        if (lastKnown?.coords && isValidCoords(lastKnown.coords)) {
          const coords: SafeCoords = {
            latitude: Number(lastKnown.coords.latitude),
            longitude: Number(lastKnown.coords.longitude),
          };
          inMemoryLocation = { coords, timestamp: Date.now() };
          return {
            status: 'SUCCESS',
            location: coords,
            isLastKnown: true,
            permissionGranted: true,
          };
        }
      }
    }
  } catch (err) {
    console.log('[safeLocation] Fast location check error:', err);
  }

  return safeGetUserLocation(requestIfDenied);
}

/**
 * Lấy tọa độ GPS hiện tại (trả về null nếu không có GPS/bị từ chối quyền)
 */
export async function safeGetCurrentPosition(requestIfDenied: boolean = false): Promise<SafeCoords | null> {
  const res = await safeGetUserLocation(requestIfDenied);
  return res.location;
}

/**
 * Reverse geocode an toàn
 */
export async function safeReverseGeocode(coords: SafeCoords): Promise<string | null> {
  if (!isValidCoords(coords)) return null;
  const mod = getLocationModule();
  if (!mod || typeof mod.reverseGeocodeAsync !== 'function') {
    return null;
  }
  try {
    const [geo] = await mod.reverseGeocodeAsync(coords);
    if (geo) {
      const parts = [geo.streetNumber, geo.street, geo.district, geo.city].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : null;
    }
  } catch {
    // Fallback quietly
  }
  return null;
}
