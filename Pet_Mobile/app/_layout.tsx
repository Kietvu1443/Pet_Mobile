import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import '@/lib/language/i18n';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { navigateFromNotification } from '@/lib/notifications/device';
import { fetchGlobalUnread } from '@/lib/notifications/unread';
import { updateService } from '@/lib/updates/updateService';
import { UpdateBanner } from '@/components/UpdateBanner';

export const unstable_settings = {
  anchor: '(tabs)',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  // Nạp font Fredoka (bản sắc PetSnap legacy) — chờ cùng với bootstrap auth.
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  const ready = !isBootstrapping && fontsLoaded;

  // Notification listeners — only after bootstrap
  useEffect(() => {
    if (!ready || !isAuthenticated) return;

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void fetchGlobalUnread();
    });

    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type as string | undefined;
      if (type) {
        navigateFromNotification(type, router, pathname);
      }
    });

    return () => {
      receivedSub.remove();
      tapSub.remove();
    };
  }, [ready, isAuthenticated, router, pathname]);

  // OTA Check - trigger background check once ready
  useEffect(() => {
    if (ready) {
      updateService.checkAndPreDownloadOTA();
    }
  }, [ready]);

  // Route gate: chuyển hướng theo trạng thái đăng nhập sau khi bootstrap xong.
  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, ready, segments, router]);

  // Chờ bootstrap (token + /auth/me) VÀ font xong trước khi hiển thị điều hướng
  // (tránh nháy font hệ thống trước khi Fredoka nạp xong).
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UpdateBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </NavThemeProvider>
  );
}
