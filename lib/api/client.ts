// API client dùng chung cho toàn app.
//
// Trách nhiệm:
//   - Ghép base URL (A1) với đường dẫn endpoint
//   - Gắn header Authorization: Bearer <token> (A2)
//   - Giải bao response chuẩn { success, message, data } của backend
//   - Xử lý tập trung lỗi 401 -> đăng xuất/đăng nhập lại (A3)
import { API_BASE_URL } from './config';
import { getToken } from '../auth/tokenStore';

// Hình dạng response chuẩn từ utils/apiResponse.js của backend.
export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

// Lỗi API có kèm status và message tiếng Việt từ backend.
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Hook xử lý 401 tập trung (A3). AuthProvider sẽ đăng ký hàm này để
// xoá token và đưa người dùng về màn đăng nhập, tránh phụ thuộc vòng.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Một số endpoint công khai (vd /auth/config) không cần token.
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined
      ? (body instanceof FormData ? body : JSON.stringify(body))
      : undefined,
    signal,
  });

  // Cố gắng parse JSON; nếu thất bại thì giữ payload null.
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  // 401 -> kích hoạt đăng xuất tập trung (A3) rồi ném lỗi.
  if (response.status === 401) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(401, payload?.message ?? 'Vui lòng đăng nhập tài khoản', payload?.data);
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? 'Đã xảy ra lỗi, vui lòng thử lại';
    throw new ApiError(response.status, message, payload?.data);
  }

  return payload.data as T;
}
