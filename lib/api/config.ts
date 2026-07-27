// Cấu hình API base URL (A1: chiến lược base URL theo môi trường).
//
// Thứ tự ưu tiên:
//   1. DEV: tự lấy IP của máy đang chạy Metro bundler (chính là máy chạy
//      backend) -> đổi mạng thì app tự bám theo IP mới, không cần sửa tay.
//   2. PRODUCTION/STAGING: expo.extra.apiBaseUrl trong app.json.
//   3. Dự phòng: mặc định theo nền tảng (Android emulator dùng 10.0.2.2).
//
// Backend Express mặc định chạy ở PORT 3000.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_PORT = 3000;

// Host (IP LAN) mà Metro bundler đang phục vụ bundle JS — cũng là máy
// đang chạy backend. Bám theo host này nên mỗi lần đổi mạng IP tự cập nhật.
function metroHost(): string | null {
  const hostUri =
    // Expo SDK 49+: dạng "192.168.1.5:8081"
    Constants.expoConfig?.hostUri ??
    // Expo Go bản cũ
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (typeof hostUri !== 'string') return null;
  const host = hostUri.split(':')[0]?.trim();
  return host && host.length > 0 ? host : null;
}

// Android emulator không thấy "localhost" của máy host — phải dùng 10.0.2.2.
// iOS simulator và web dùng localhost trực tiếp.
function platformLocalhost(): string {
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function devBaseUrl(): string {
  let host = metroHost();
  // Nếu Metro báo localhost (emulator/web) thì map sang địa chỉ phù hợp nền tảng.
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    host = platformLocalhost();
  }
  return `http://${host}:${DEV_PORT}`;
}

function resolveBaseUrl(): string {
  // Production/staging: dùng URL cố định khai báo trong app.json.
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  if (!__DEV__ && typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim().replace(/\/+$/, '');
  }
  // Dev: tự phát hiện IP của Metro (máy chạy backend).
  return devBaseUrl();
}

// Origin gốc (không có /api/v1) — dùng để phân giải đường dẫn ảnh tương đối (A4).
export const API_ORIGIN = resolveBaseUrl();

// Tiền tố cho toàn bộ JSON API v1.
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
