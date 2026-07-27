// BottomNav — custom floating bottom navigation bar with sliding active indicator.
//
// Tái hiện chính xác Premium Mobile UI Design/src/app/components/BottomNav.tsx:
//   - Glass pill với nền trắng đục và độ mờ 50
//   - 4 tabs chia đều và nút quét QR chính giữa
//   - Nền hồng hoạt họa trượt ngang (iOS-style sliding animation) sử dụng Reanimated spring.
//
// Thư viện:
//   - expo-blur (BlurView) cho hiệu ứng kính mờ
//   - @expo/vector-icons / Ionicons cho icon
//   - react-native-reanimated cho animation spring trượt ngang

import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/theme/ThemeContext';

export type Tab = 'pets' | 'adopt' | 'favorites' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

type TabItem = {
  id: Tab;
  ionIcon: keyof typeof Ionicons.glyphMap;
  ionIconFilled: keyof typeof Ionicons.glyphMap;
  labelKey: 'tabs:pets' | 'tabs:adopt' | 'tabs:favorites' | 'tabs:profile';
  fillOnActive: boolean;
};

const LEFT_TABS: TabItem[] = [
  { id: 'pets',      ionIcon: 'paw-outline',    ionIconFilled: 'paw',         labelKey: 'tabs:pets',  fillOnActive: true  },
  { id: 'adopt',     ionIcon: 'search-outline',  ionIconFilled: 'search',      labelKey: 'tabs:adopt', fillOnActive: false },
];

const RIGHT_TABS: TabItem[] = [
  { id: 'favorites', ionIcon: 'heart-outline',   ionIconFilled: 'heart',       labelKey: 'tabs:favorites', fillOnActive: true  },
  { id: 'profile',   ionIcon: 'person-outline',  ionIconFilled: 'person',      labelKey: 'tabs:profile',   fillOnActive: false },
];

const PILL_W = 66;
const PILL_H = 52;
const FAB_SIZE = 50;
const FAB_AREA = 64;

function NavTab({
  tab,
  isActive,
  onPress,
  onLayout,
  mutedColor,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  onLayout: (e: any) => void;
  mutedColor: string;
}) {
  const { t } = useTranslation(['tabs', 'common']);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.90, { stiffness: 400, damping: 25 }, () => {
      scale.value = withSpring(1, { stiffness: 400, damping: 25 });
    });
    onPress();
  };

  return (
    <Pressable onPress={handlePress} onLayout={onLayout} style={styles.navTabPressable}>
      <Animated.View style={animStyle}>
        <View style={styles.tabContent}>
          <Ionicons
            name={tab.ionIcon}
            size={21}
            color={isActive ? 'white' : mutedColor}
          />
          <Text style={[styles.label, isActive ? styles.activeLabel : { color: mutedColor }]}>
            {t(tab.labelKey)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const fabScale = useSharedValue(1);
  const indicatorX = useSharedValue(0);
  const hasInitialized = useRef(false);
  const { theme, resolvedColorScheme } = useTheme();
  const primaryColor = theme.colors.primary;
  const isDark = resolvedColorScheme === 'dark';

  const tabPositions = useRef<Record<Tab, number>>({
    pets: 0,
    adopt: 0,
    favorites: 0,
    profile: 0,
  });

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleFabPress = () => {
    fabScale.value = withSpring(0.86, { stiffness: 500, damping: 24 }, () => {
      fabScale.value = withSpring(1, { stiffness: 500, damping: 24 });
    });
  };

  const handleTabLayout = useCallback((tabId: Tab, x: number, width: number) => {
    if (tabPositions.current[tabId] !== 0) {
      return;
    }

    const targetX = x + (width - PILL_W) / 2;
    if (targetX <= 0) return;

    tabPositions.current[tabId] = targetX;
    
    if (activeTab === tabId && !hasInitialized.current) {
      indicatorX.value = targetX;
      hasInitialized.current = true;
    }
  }, [activeTab, indicatorX]);

  useEffect(() => {
    const targetX = tabPositions.current[activeTab];
    if (targetX > 0) {
      indicatorX.value = withSpring(targetX, {
        stiffness: 160,
        damping: 26,
      });
    }
  }, [activeTab, indicatorX]);

  return (
    <View
      style={[
        styles.outerWrapper,
        { paddingBottom: Math.max(12, insets.bottom) },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.glassPill,
          {
            backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Animated.View style={[styles.activePillIndicator, { backgroundColor: primaryColor, shadowColor: primaryColor }, indicatorStyle]} />

        <NavTab
          tab={LEFT_TABS[0]}
          isActive={activeTab === LEFT_TABS[0].id}
          onPress={() => onTabChange(LEFT_TABS[0].id)}
          onLayout={(e) => handleTabLayout(LEFT_TABS[0].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
          mutedColor={theme.colors.muted}
        />
        <NavTab
          tab={LEFT_TABS[1]}
          isActive={activeTab === LEFT_TABS[1].id}
          onPress={() => onTabChange(LEFT_TABS[1].id)}
          onLayout={(e) => handleTabLayout(LEFT_TABS[1].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
          mutedColor={theme.colors.muted}
        />

        <View style={styles.inlineFabWrapper}>
          <Pressable onPress={handleFabPress}>
            <Animated.View style={[styles.fab, { backgroundColor: primaryColor, shadowColor: primaryColor }, fabStyle]}>
              <Ionicons name="scan-outline" size={20} color="white" />
            </Animated.View>
          </Pressable>
        </View>

        <NavTab
          tab={RIGHT_TABS[0]}
          isActive={activeTab === RIGHT_TABS[0].id}
          onPress={() => onTabChange(RIGHT_TABS[0].id)}
          onLayout={(e) => handleTabLayout(RIGHT_TABS[0].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
          mutedColor={theme.colors.muted}
        />
        <NavTab
          tab={RIGHT_TABS[1]}
          isActive={activeTab === RIGHT_TABS[1].id}
          onPress={() => onTabChange(RIGHT_TABS[1].id)}
          onLayout={(e) => handleTabLayout(RIGHT_TABS[1].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
          mutedColor={theme.colors.muted}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 100,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.60)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 12,
  },
  navTabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  activePillIndicator: {
    position: 'absolute',
    left: 0,
    top: 9,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  tabContent: {
    width: PILL_W,
    height: PILL_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: 'white',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: 'rgba(100,100,120,0.65)',
  },
  inlineFabWrapper: {
    width: FAB_AREA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 16,
    elevation: 12,
  },
});
