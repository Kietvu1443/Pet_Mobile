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
  address?: string | null;
  preferences?: { quickRole?: string; pushEnabled?: boolean; emailEnabled?: boolean } | null;
};

export type LoginResponse = {
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

// POST /api/v1/auth/google — trả về { token, user } xác thực qua Google idToken.
export function loginWithGoogle(token: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    auth: false,
    body: { token },
  });
}

// POST /api/v1/auth/facebook — trả về { token, user } xác thực qua Facebook accessToken.
export function loginWithFacebook(accessToken: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/facebook', {
    method: 'POST',
    auth: false,
    body: { accessToken },
  });
}

// Dữ liệu đăng ký — khớp hợp đồng POST /api/v1/auth/register.
export type RegisterData = {
  display_name: string;
  name: string;
  phone?: string;
  email?: string;
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

export type SendOtpResponse = {
  email: string;
  waitSeconds: number;
};

export type VerifyOtpResponse = {
  token: string;
  user: User;
};

// POST /api/v1/auth/send-otp — gửi mã OTP về email (yêu cầu token)
export function sendEmailOtp(email?: string): Promise<SendOtpResponse> {
  return apiRequest<SendOtpResponse>('/auth/send-otp', {
    method: 'POST',
    body: email ? { email } : {},
  });
}

// POST /api/v1/auth/verify-otp — xác nhận mã OTP (yêu cầu token)
export function verifyEmailOtp(otp: string): Promise<VerifyOtpResponse> {
  return apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: { otp },
  });
}

