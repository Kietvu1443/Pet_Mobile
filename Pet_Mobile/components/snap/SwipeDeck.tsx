// Deck vuốt PetSnap — lớp cử chỉ + animation (bản sắc legacy).
//
// Chỉ hiển thị tối đa 2 thẻ: thẻ trên cùng (vuốt được) và thẻ kế tiếp (tĩnh, nằm sau
// tạo chiều sâu). Vuốt phải = like (TÍM), trái = dislike (ĐỎ); qua ngưỡng (hoặc vẩy
// nhanh) thì thẻ bay đi và gọi onLike/onDislike, chưa qua thì bật về giữa. Khi kéo,
// một lớp "wash" màu phủ dần lên thẻ + con dấu LIKE/NOPE hiện ra.
//
// Mỗi thẻ keyed theo pet.id để PetCard remount khi deck tiến (reset carousel ảnh).
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { SNAP_COLORS, SNAP_FONTS } from '@/constants/petsnap-theme';
import type { Pet } from '@/lib/snap/adapter';
import { PetCard } from './PetCard';

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_W * 0.28; // kéo quá mức này (hoặc vẩy nhanh) = commit
const FLING_VELOCITY = 800; // vận tốc px/s đủ để commit dù chưa qua ngưỡng
const OFF_SCREEN = SCREEN_W * 1.5; // đích bay ra khỏi màn hình

// Màu "wash" phủ thẻ khi kéo — đúng overlay legacy: like tím .72, nope ĐỎ SẪM .72.
const LIKE_WASH = SNAP_COLORS.like; // #7c3aed = rgba(124,58,237) của legacy
const NOPE_WASH = '#7f1d1d'; // rgba(127,29,29) — đỏ sẫm legacy, KHÔNG phải đỏ tươi của nút
const WASH_MAX = 0.72; // legacy .swipe-overlay alpha

// Asset gốc của PetSnap legacy (frontend/images/btn-*.png) — nguồn chân lý cho nút.
const FAB_ART = {
  like: require('@/assets/images/snap/btn-like.png'),
  nope: require('@/assets/images/snap/btn-nope.png'),
};

type Props = {
  queue: Pet[];
  acting: boolean;
  onLike: (petId: number) => void;
  onDislike: (petId: number) => void;
};

// Cho phép footer (nút Bỏ qua/Thích) kích hoạt cùng animation vuốt như fab/cử chỉ.
export type SwipeDeckHandle = {
  like: () => void;
  dislike: () => void;
};

export const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(function SwipeDeck(
  { queue, acting, onLike, onDislike },
  ref,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const top = queue[0];
  const next = queue[1];

  // Gọi sau khi animation bay ra xong: phát tín hiệu rồi reset vị trí cho thẻ mới.
  const commit = useCallback(
    (petId: number, kind: 'like' | 'dislike') => {
      translateX.value = 0;
      translateY.value = 0;
      if (kind === 'like') onLike(petId);
      else onDislike(petId);
    },
    [onLike, onDislike, translateX, translateY],
  );

  const buzz = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const fly = useCallback(
    (dir: 1 | -1) => {
      if (!top || acting) return;
      const petId = top.id;
      const kind = dir === 1 ? 'like' : 'dislike';
      buzz();
      translateX.value = withTiming(dir * OFF_SCREEN, { duration: 240 }, (done) => {
        if (done) runOnJS(commit)(petId, kind);
      });
    },
    [top, acting, buzz, commit, translateX],
  );

  // Phơi like()/dislike() cho footer — dùng chung fly() nên giữ nguyên animation.
  useImperativeHandle(ref, () => ({ like: () => fly(1), dislike: () => fly(-1) }), [fly]);

  const pan = Gesture.Pan()
    .enabled(!!top && !acting)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.25; // hạn chế trôi dọc
    })
    .onEnd((e) => {
      const passed = Math.abs(translateX.value) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > FLING_VELOCITY;
      if (passed && top) {
        const dir = translateX.value > 0 ? 1 : -1;
        const kind = dir === 1 ? 'like' : 'dislike';
        runOnJS(buzz)();
        translateX.value = withTiming(dir * OFF_SCREEN, { duration: 240 }, (done) => {
          if (done) runOnJS(commit)(top.id, kind);
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_W, 0, SCREEN_W], [-12, 0, 12])}deg` },
    ],
  }));

  const likeWashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, WASH_MAX], 'clamp'),
  }));
  const nopeWashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [WASH_MAX, 0], 'clamp'),
  }));
  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.6], [0, 1], 'clamp'),
  }));
  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.6, 0], [1, 0], 'clamp'),
  }));

  // Thẻ kế tiếp lớn dần khi thẻ trên bị kéo đi (tạo cảm giác "tiến lên").
  const nextStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return { transform: [{ scale: interpolate(progress, [0, 1], [0.94, 1]) }] };
  });

  return (
    <View style={styles.deck}>
      {/* Thẻ kế tiếp nằm sau, không nhận cử chỉ. */}
      {next ? (
        <Animated.View key={next.id} style={[styles.cardWrap, nextStyle]} pointerEvents="none">
          <PetCard pet={next} />
        </Animated.View>
      ) : null}

      {/* Thẻ trên cùng — vuốt được. */}
      {top ? (
        <GestureDetector gesture={pan}>
          <Animated.View key={top.id} style={[styles.cardWrap, topStyle]}>
            <PetCard pet={top} />

            {/* Lớp wash màu phủ thẻ khi kéo. */}
            <Animated.View
              style={[styles.wash, { backgroundColor: LIKE_WASH }, likeWashStyle]}
              pointerEvents="none"
            />
            <Animated.View
              style={[styles.wash, { backgroundColor: NOPE_WASH }, nopeWashStyle]}
              pointerEvents="none"
            />

            {/* Con dấu LIKE / NOPE. */}
            <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]} pointerEvents="none">
              <Text style={styles.stampText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]} pointerEvents="none">
              <Text style={styles.stampText}>NOPE</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : null}

      {/* Nút tròn (fab) nổi trên đáy thẻ — như .floating-actions của legacy. */}
      <View style={styles.actions}>
        <FabButton kind="nope" disabled={!top || acting} onPress={() => fly(-1)} />
        <FabButton kind="like" disabled={!top || acting} onPress={() => fly(1)} />
      </View>
    </View>
  );
});

function FabButton({
  kind,
  disabled,
  onPress,
}: {
  kind: 'like' | 'nope';
  disabled: boolean;
  onPress: () => void;
}) {
  const color = kind === 'like' ? SNAP_COLORS.like : SNAP_COLORS.nope;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: color, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}>
      {/* Asset gốc đã chứa sẵn vòng tròn màu + glyph; phủ kín nút như legacy (.fab-btn img). */}
      <Image source={FAB_ART[kind]} resizeMode="contain" style={styles.fabArt} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    margin: 12, // thẻ gần như lấp đầy stage; fab nổi đè lên đáy thẻ (panel chừa chỗ)
    borderRadius: 24,
    shadowColor: '#13240b',
    shadowOpacity: 0.32,
    shadowRadius: 18, // legacy .pet-card box-shadow 0 14px 36px
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  stamp: {
    position: 'absolute',
    top: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  likeStamp: {
    left: 22,
    transform: [{ rotate: '-14deg' }],
  },
  nopeStamp: {
    right: 22,
    transform: [{ rotate: '14deg' }],
  },
  stampText: {
    color: '#ffffff',
    fontFamily: SNAP_FONTS.bold,
    fontSize: 30,
    letterSpacing: 2,
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18, // nổi đè lên đáy thẻ (legacy .floating-actions bottom:12 trên card)
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 52, // legacy .floating-actions @720px
  },
  fab: {
    width: 68, // legacy .fab-btn @720px
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.34, // legacy box-shadow 0 14px 30px rgba(0,0,0,.34)
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  fabArt: {
    width: '100%', // legacy .fab-btn img { width:100%; height:100% }
    height: '100%',
    borderRadius: 34, // legacy .fab-btn img { border-radius: 50% } — cắt asset, không đụng shadow
  },
});
