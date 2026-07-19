// Trạng thái xác thực dùng chung cho toàn app.
//
// Phase 1:
//   - login(displayName, password): gọi /auth/login, lưu token (SecureStore) + user
//   - bootstrap khi mở app: nếu có token đã lưu thì gọi /auth/me để xác thực;
//     token hỏng/hết hạn -> xoá phiên
//   - 401 tập trung -> tự đăng xuất (A3)
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '../api/client';
import { getMe, login as apiLogin, register as apiRegister, type RegisterData, type User } from '../api/auth';
import { registerDevicePushToken, unregisterDevicePushToken } from '../notifications/device';
import { clearToken, getToken, saveToken } from './tokenStore';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (displayName: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Bootstrap khi mở app: xác thực token đã lưu bằng /auth/me.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getToken();
      if (!stored) {
        if (mounted) setIsBootstrapping(false);
        return;
      }
      try {
        const me = await getMe();
        if (mounted) setUser(me);
      } catch {
        // Token hỏng/hết hạn -> xoá phiên (A3).
        await clearToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Handler 401 tập trung (A3): client gọi khi gặp 401 -> xoá token + user.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearToken();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login: async (displayName: string, password: string) => {
        const result = await apiLogin(displayName, password);
        await saveToken(result.token);
        // /auth/login returns a subset; fetch full profile from /auth/me
        const me = await getMe();
        setUser(me);
        registerDevicePushToken();
      },
      register: async (data: RegisterData) => {
        const result = await apiRegister(data);
        await saveToken(result.token);
        // /auth/register returns a subset; fetch full profile from /auth/me
        const me = await getMe();
        setUser(me);
        registerDevicePushToken();
      },
      logout: async () => {
        await unregisterDevicePushToken();
        await clearToken();
        setUser(null);
      },
      refreshUser,
    }),
    [user, isBootstrapping, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}
