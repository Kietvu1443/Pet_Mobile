// Lệnh gọi API xác thực.
//
// Phase 1: login() + getMe() phục vụ luồng đăng nhập và bootstrap khi mở app.
// Đăng nhập dùng display_name (tên đăng nhập) + password — KHÔNG phải email.
import { apiRequest } from './client';

export type AuthConfig = {
  googleClientId: string;
  facebookAppId: string;
};

// Hồ sơ người dùng trả về từ backend (login trả tập con, /auth/me trả đầy đủ).
export type User = {
  id: number;
  display_name: string;
  name: string;
  email: string;
  role: number;
  verify: number;
  avatar?: string | null;
  bg_preference?: string | null;
  birthday?: string | null;
  gender?: string | null;
  phone?: string | null;
};

type LoginResponse = {
  token: string;
  user: User;
};

type MeResponse = {
  user: User;
};

// GET /api/v1/auth/config — công khai, dùng làm smoke test kết nối.
export function getAuthConfig(signal?: AbortSignal): Promise<AuthConfig> {
  return apiRequest<AuthConfig>('/auth/config', { auth: false, signal });
}

// POST /api/v1/auth/login — trả về { token, user }.
export function login(displayName: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { display_name: displayName, password },
  });
}

// Dữ liệu đăng ký — khớp hợp đồng POST /api/v1/auth/register.
export type RegisterData = {
  display_name: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// POST /api/v1/auth/register — trả về { token, user } (tự động đăng nhập).
export function register(data: RegisterData): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: data,
  });
}

// GET /api/v1/auth/me — yêu cầu Bearer token; dùng để bootstrap & xác thực token.
export async function getMe(signal?: AbortSignal): Promise<User> {
  const data = await apiRequest<MeResponse>('/auth/me', { signal });
  return data.user;
}
