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

export type Tab = 'pets' | 'adopt' | 'favorites' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

type TabItem = {
  id: Tab;
  ionIcon: keyof typeof Ionicons.glyphMap;
  ionIconFilled: keyof typeof Ionicons.glyphMap;
  label: string;
  fillOnActive: boolean;
};

const LEFT_TABS: TabItem[] = [
  { id: 'pets',      ionIcon: 'paw-outline',    ionIconFilled: 'paw',         label: 'Thú cưng',  fillOnActive: true  },
  { id: 'adopt',     ionIcon: 'search-outline',  ionIconFilled: 'search',      label: 'Nhận nuôi', fillOnActive: false },
];

const RIGHT_TABS: TabItem[] = [
  { id: 'favorites', ionIcon: 'heart-outline',   ionIconFilled: 'heart',       label: 'Yêu thích', fillOnActive: true  },
  { id: 'profile',   ionIcon: 'person-outline',  ionIconFilled: 'person',      label: 'Hồ sơ',     fillOnActive: false },
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
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  onLayout: (e: any) => void;
}) {
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
            color={isActive ? 'white' : 'rgba(100,100,120,0.65)'}
          />
          <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
            {tab.label}
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
    // Lock in the coordinate once measured to prevent transition reflows from corrupting it
    if (tabPositions.current[tabId] !== 0) {
      return;
    }

    const targetX = x + (width - PILL_W) / 2;
    if (targetX <= 0) return;

    tabPositions.current[tabId] = targetX;
    
    // Only initialize the indicator position directly without animation on mount
    if (activeTab === tabId && !hasInitialized.current) {
      indicatorX.value = targetX;
      hasInitialized.current = true;
    }
  }, [activeTab, indicatorX]);

  // Smooth slide transition when activeTab changes
  useEffect(() => {
    const targetX = tabPositions.current[activeTab];
    if (hasInitialized.current && typeof targetX === 'number' && targetX !== 0) {
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
      <BlurView intensity={50} tint="light" style={styles.glassPill}>
        <Animated.View style={[styles.activePillIndicator, indicatorStyle]} />

        <NavTab
          tab={LEFT_TABS[0]}
          isActive={activeTab === LEFT_TABS[0].id}
          onPress={() => onTabChange(LEFT_TABS[0].id)}
          onLayout={(e) => handleTabLayout(LEFT_TABS[0].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
        />
        <NavTab
          tab={LEFT_TABS[1]}
          isActive={activeTab === LEFT_TABS[1].id}
          onPress={() => onTabChange(LEFT_TABS[1].id)}
          onLayout={(e) => handleTabLayout(LEFT_TABS[1].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
        />

        <View style={styles.inlineFabWrapper}>
          <Pressable onPress={handleFabPress}>
            <Animated.View style={[styles.fab, fabStyle]}>
              <Ionicons name="scan-outline" size={20} color="white" />
            </Animated.View>
          </Pressable>
        </View>

        <NavTab
          tab={RIGHT_TABS[0]}
          isActive={activeTab === RIGHT_TABS[0].id}
          onPress={() => onTabChange(RIGHT_TABS[0].id)}
          onLayout={(e) => handleTabLayout(RIGHT_TABS[0].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
        />
        <NavTab
          tab={RIGHT_TABS[1]}
          isActive={activeTab === RIGHT_TABS[1].id}
          onPress={() => onTabChange(RIGHT_TABS[1].id)}
          onLayout={(e) => handleTabLayout(RIGHT_TABS[1].id, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
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
    backgroundColor: '#FF4FA3',
    borderRadius: 14,
    shadowColor: '#FF4FA3',
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
    backgroundColor: '#FF3D9A',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3D9A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 16,
    elevation: 12,
  },
});
