// Lưu trữ JWT an toàn bằng expo-secure-store (A2: Bearer JWT + SecureStore).
//
// expo-secure-store không hỗ trợ trên web, nên có fallback dùng bộ nhớ tạm
// để app vẫn chạy được khi phát triển trên trình duyệt.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'pethelper.auth.token';

const isWeb = Platform.OS === 'web';

// Fallback trong RAM cho web (chỉ tồn tại trong phiên chạy).
let memoryToken: string | null = null;

export async function saveToken(token: string): Promise<void> {
  if (isWeb) {
    memoryToken = token;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (isWeb) {
    return memoryToken;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    memoryToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
