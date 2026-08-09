// AdoptScreen — Màn hình Nhận nuôi (tab index).
//
// Tái hiện chính xác Premium Mobile UI Design/src/app/components/AdoptScreen.tsx.
//
// Nguồn dữ liệu:
//   - queue (swipe deck)      <- usePetQueue() -> GET /pet-snap (backend)
//   - like/dislike actions    <- usePetQueue() -> POST /pet-snap/:id/like|dislike (backend)
//   - adoption requests list  <- GET /api/v1/adoption-requests/my (backend)
//   - verified badge          <- computeVerified(pet.code) (mockAdapter computed)
//   - traits                  <- getMockTraits(pet.type, pet.breed) (mockAdapter computed)
//   - location                <- extractLocation(contact_info) — NOTE: not in RawPet yet
//                                falls back to "TP. Hồ Chí Minh" (mockAdapter computed)
//
// Tabs:
//   "explore"   — swipe deck + action buttons
//   "connected" — adoption requests list from backend
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUnreadNotifications } from '@/lib/notifications/unread';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeContext';

import { usePetQueue } from '@/lib/snap/usePetQueue';
import { apiRequest } from '@/lib/api/client';
import {
  computeVerified,
  getMockTraits,
} from '@/adapters/mockAdapter';
import type { Pet } from '@/lib/snap/adapter';

// ---------------------------------------------------------------------------
// Adoption requests types
// ---------------------------------------------------------------------------
type AdoptionRequest = {
  id: number;
  petId: number;
  petName: string;
  petImage: string | null;
  petBreed: string | null;
  petAge: string | null;
  petGender: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type AdoptionRequestsResponse = {
  requests: Array<{
    id: number;
    pet_id: number;
    pet_name?: string;
    pet_image?: string;
    pet_breed?: string;
    pet_age?: string;
    pet_gender?: string;
    status: string;
    created_at?: string;
  }>;
};

function adaptRequest(r: AdoptionRequestsResponse['requests'][number]): AdoptionRequest {
  return {
    id: r.id,
    petId: r.pet_id,
    petName: r.pet_name ?? 'Thú cưng',
    petImage: r.pet_image ?? null,
    petBreed: r.pet_breed ?? null,
    petAge: r.pet_age ?? null,
    petGender: r.pet_gender ?? null,
    status: (r.status as AdoptionRequest['status']) ?? 'pending',
    createdAt: r.created_at ?? '',
  };
}

function formatDate(iso: string): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '--';
  }
}


// ---------------------------------------------------------------------------
// SwipeCard — faithful recreation of reference design in React Native
// ---------------------------------------------------------------------------
const SWIPE_THRESHOLD = 100;
const SUPERLIKE_THRESHOLD = -100;

function SwipeCard({
  pet,
  onLike,
  onDislike,
  onDetail,
  isBehind = false,
}: {
  pet: Pet;
  onLike: () => void;
  onDislike: () => void;
  onDetail: () => void;
  isBehind?: boolean;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const verified = computeVerified(pet.code);
  // TODO: Replace with actual traits from backend when available
  const traits = getMockTraits(pet.type, pet.breed);

  const cardStyle = useAnimatedStyle(() => {
    if (isBehind) {
      return {
        transform: [{ scale: 0.94 }, { translateY: 14 }],
        borderRadius: 28,
        overflow: 'hidden' as const,
        zIndex: 1,
      };
    }
    const rotate = interpolate(tx.value, [-300, 0, 300], [-22, 0, 22], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
      ],
      zIndex: 2,
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [30, 110], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-110, -30], [1, 0], Extrapolation.CLAMP),
  }));

  const superlikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-110, -40], [1, 0], Extrapolation.CLAMP),
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (isBehind) return;
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (isBehind) return;
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      if (e.translationX > SWIPE_THRESHOLD && absX > absY) {
        tx.value = withTiming(600, { duration: 300 }, () => { runOnJS(onLike)(); });
      } else if (e.translationX < -SWIPE_THRESHOLD && absX > absY) {
        tx.value = withTiming(-600, { duration: 300 }, () => { runOnJS(onDislike)(); });
      } else if (e.translationY < SUPERLIKE_THRESHOLD && absY > absX) {
        ty.value = withTiming(-600, { duration: 300 }, () => { runOnJS(onLike)(); });
      } else {
        tx.value = withSpring(0, { stiffness: 400, damping: 30 });
        ty.value = withSpring(0, { stiffness: 400, damping: 30 });
      }
    });

  const mainImage = pet.avatarUri ?? (pet.photos[0]?.uri ?? null);

  if (isBehind) {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F5F5F5' }]} />
        )}
        <View style={styles.cardGradient} />
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
        <Pressable
          style={styles.cardInner}
          onPress={onDetail}
        >
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F0F0' }]} />
          )}
          <View style={styles.cardGradient} />

          {/* Verified badge */}
          {verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FF4FA3" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}

          {/* THÍCH stamp */}
          <Animated.View style={[styles.likeStamp, likeOpacity]}>
            <Text style={styles.likeStampText}>THÍCH</Text>
          </Animated.View>

          {/* BỎ QUA stamp */}
          <Animated.View style={[styles.nopeStamp, nopeOpacity]}>
            <Text style={styles.nopeStampText}>BỎ QUA</Text>
          </Animated.View>

          {/* SIÊU THÍCH stamp */}
          <Animated.View style={[styles.superlikeStamp, superlikeOpacity]}>
            <Text style={styles.superlikeStampText}>SIÊU THÍCH</Text>
          </Animated.View>

          {/* Pet info overlay */}
          <View style={styles.cardInfoOverlay}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardPetName}>{pet.name}</Text>
              <Text style={styles.cardPetAge}>{pet.age ?? ''}</Text>
            </View>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardBreed}>🐾 {pet.breed ?? pet.type ?? '--'}</Text>
              <Text style={styles.cardDot}>·</Text>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.75)" />
              {/* TODO: Replace with actual location from pets.contact_info or pets.location */}
              <Text style={styles.cardLocation}>TP. Hồ Chí Minh</Text>
            </View>
            <View style={styles.cardTraitsRow}>
              {traits.slice(0, 3).map((t) => (
                <View key={t} style={styles.traitChip}>
                  <Text style={styles.traitChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// ActionButton
// ---------------------------------------------------------------------------
function ActionBtn({
  children,
  onPress,
  size,
  shadow,
  badge,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  size: number;
  shadow: string;
  badge?: string;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: theme.colors.card, width: size, height: size, shadowColor: shadow, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {children}
      {badge && (
        <View style={[styles.actionBtnBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.card }]}>
          <Text style={styles.actionBtnBadgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ConnectedTab — adoption requests from backend
// ---------------------------------------------------------------------------
function ConnectedTab() {
  const { theme } = useTheme();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    apiRequest<AdoptionRequestsResponse>('/adoption-requests/my')
      .then((data) => {
        if (!alive) return;
        setRequests((data.requests ?? []).map(adaptRequest));
      })
      .catch(() => { if (alive) setRequests([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const pendingCount  = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  const filters = [
    { id: 'all',      label: 'Tất cả',      count: requests.length },
    { id: 'pending',  label: 'Chờ duyệt',   count: pendingCount },
    { id: 'approved', label: 'Chờ liên hệ', count: approvedCount },
  ];

  const filtered = requests.filter((r) => {
    if (activeFilter === 'pending')  return r.status === 'pending';
    if (activeFilter === 'approved') return r.status === 'approved';
    return true;
  });

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ paddingTop: 16 }}>
      {/* Filter chips */}
      <View style={styles.connectedFilters}>
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <Pressable
              key={f.id}
              style={[
                styles.connFilter,
                { backgroundColor: isActive ? theme.colors.primary : theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.connFilterText, { color: isActive ? 'white' : theme.colors.text }]}>
                {f.label}
              </Text>
              {f.count > 0 && (
                <View style={[styles.connFilterBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.colors.primary }]}>
                  <Text style={styles.connFilterBadgeText}>{f.count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyConnected}>
          <View style={[styles.emptyConnectedIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="heart-outline" size={30} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyConnectedTitle, { color: theme.colors.text }]}>Chưa kết nối</Text>
          <Text style={[styles.emptyConnectedSub, { color: theme.colors.muted }]}>Thích một bé để bắt đầu kết nối!</Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {filtered.map((req) => {
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';
            const bg = isApproved ? theme.colors.successContainer : isRejected ? theme.colors.errorContainer : theme.colors.warningContainer;
            const color = isApproved ? theme.colors.success : isRejected ? theme.colors.error : theme.colors.warning;
            const label = isApproved ? 'Đã duyệt' : isRejected ? 'Bị từ chối' : 'Chờ duyệt';
            return (
              <View key={req.id} style={[styles.requestCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.requestCardTop}>
                  {req.petImage ? (
                    <Image source={{ uri: req.petImage }} style={styles.requestPetImage} />
                  ) : (
                    <View style={[styles.requestPetImage, { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="paw" size={24} color={theme.colors.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.requestNameRow}>
                      <Text style={[styles.requestPetName, { color: theme.colors.text }]}>{req.petName}</Text>
                      <View style={[styles.requestStatusBadge, { backgroundColor: bg }]}>
                        <Text style={[styles.requestStatusText, { color }]}>{label}</Text>
                      </View>
                      <Text style={[styles.requestDate, { color: theme.colors.muted }]}>{formatDate(req.createdAt)}</Text>
                    </View>
                    <Text style={[styles.requestMeta, { color: theme.colors.muted }]}>
                      {[req.petBreed, req.petAge, req.petGender === 'male' ? 'Đực' : req.petGender === 'female' ? 'Cái' : null].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
                {req.status === 'pending' && (
                  <View style={[styles.pendingNotice, { backgroundColor: theme.colors.warningContainer, borderColor: theme.colors.warning }]}>
                    <View style={[styles.pendingNoticeIcon, { backgroundColor: theme.colors.card }]}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                    </View>
                    <View>
                      <Text style={[styles.pendingNoticeTitle, { color: theme.colors.warning }]}>Chờ trại duyệt</Text>
                      <Text style={[styles.pendingNoticeSub, { color: theme.colors.muted }]}>Trại đang xem xét yêu cầu của bạn</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdoptScreen
// ---------------------------------------------------------------------------
export default function AdoptScreen() {
  const { theme } = useTheme();
  const { queue, status, errorMsg, acting, like, dislike, superlike, reload } = usePetQueue();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['tabs', 'common']);
  const { unread } = useUnreadNotifications();

  const [activeTab, setActiveTab] = useState<'explore' | 'connected'>('explore');

  const currentPet = queue[0] ?? null;
  const nextPet = queue[1] ?? null;
  const ready = status === 'ready' && currentPet !== null;

  const handleLike = useCallback(() => {
    if (!currentPet || acting) return;
    void like(currentPet.id);
  }, [currentPet, acting, like]);

  const handleDislike = useCallback(() => {
    if (!currentPet || acting) return;
    void dislike(currentPet.id);
  }, [currentPet, acting, dislike]);

  const handleSuperlike = useCallback(() => {
    if (!currentPet || acting) return;
    void superlike(currentPet.id);
  }, [currentPet, acting, superlike]);

  const handleDetail = useCallback(() => {
    if (!currentPet) return;
    router.push(`/pet-detail?petId=${currentPet.id}` as any);
  }, [currentPet, router]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTag, { color: theme.colors.primary }]}>{t('tabs:adopt')}</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('tabs:explore')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={18} color={theme.colors.text} />
            {unread > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.notifBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="options-outline" size={18} color={theme.colors.text} />
            <View style={[styles.filterDot, { backgroundColor: theme.colors.primary }]} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        {(['explore', 'connected'] as const).map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive, { color: activeTab === tab ? theme.colors.text : theme.colors.muted }]}>
              {tab === 'explore' ? t('tabs:explore') : t('tabs:connected')}
            </Text>
            <View style={[styles.tabUnderline, { backgroundColor: 'transparent' }, activeTab === tab && { backgroundColor: theme.colors.primary }]} />
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'explore' ? (
        <>
          {/* Card Area */}
          <View style={styles.cardArea}>
            {status === 'loading' ? (
              <View style={[styles.stateBox, { backgroundColor: theme.colors.card }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.stateMuted, { color: theme.colors.muted }]}>Đang tìm thú cưng phù hợp…</Text>
              </View>
            ) : status === 'error' ? (
              <View style={[styles.stateBox, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.stateEmoji, { backgroundColor: theme.colors.primaryContainer }]}><Text style={{ fontSize: 40 }}>😿</Text></View>
                <Text style={[styles.stateTitle, { color: theme.colors.text }]}>Không thể tải</Text>
                <Text style={[styles.stateMuted, { color: theme.colors.muted }]}>{errorMsg}</Text>
                <Pressable style={[styles.stateBtn, { backgroundColor: theme.colors.primary }]} onPress={reload}>
                  <Text style={styles.stateBtnText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : !ready ? (
              <View style={[styles.stateBox, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.stateEmoji, { backgroundColor: theme.colors.primaryContainer }]}><Text style={{ fontSize: 40 }}>🐾</Text></View>
                <Text style={[styles.stateTitle, { color: theme.colors.text }]}>Đã hết rồi!</Text>
                <Text style={[styles.stateMuted, { color: theme.colors.muted }]}>Bạn đã xem hết các bé hôm nay. Quay lại sau nhé!</Text>
                <Pressable style={[styles.stateBtn, { backgroundColor: theme.colors.primary }]} onPress={reload}>
                  <Text style={styles.stateBtnText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {nextPet && (
                  <SwipeCard
                    key={`behind-${nextPet.id}`}
                    pet={nextPet}
                    onLike={() => {}}
                    onDislike={() => {}}
                    onDetail={() => {}}
                    isBehind
                  />
                )}
                <SwipeCard
                  key={`top-${currentPet!.id}`}
                  pet={currentPet!}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onDetail={handleDetail}
                />
              </>
            )}
          </View>

          {/* Action Buttons */}
          {ready && (
            <View style={[styles.actionBar, { paddingBottom: Math.max(8, insets.bottom) + 70 }]}>
              <ActionBtn onPress={handleDislike} size={52} shadow="#000" disabled={acting}>
                <Ionicons name="close" size={22} color="#FF4D4F" />
              </ActionBtn>

              <ActionBtn onPress={handleSuperlike} size={62} shadow="#FFB800" disabled={acting}>
                <Ionicons name="star" size={26} color="#FFB800" />
              </ActionBtn>

              {/* Primary like button — larger, pink gradient */}
              <Pressable
                onPress={handleLike}
                disabled={acting}
                style={({ pressed }) => [
                  styles.likeBtn,
                  { opacity: acting ? 0.5 : pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="heart" size={34} color="white" />
              </Pressable>

              <ActionBtn onPress={() => {}} size={62} shadow="#FFB340">
                <Ionicons name="sparkles" size={24} color="#FFB340" />
              </ActionBtn>

              <ActionBtn onPress={() => {}} size={52} shadow="#000">
                <Ionicons name="refresh" size={20} color="#888" />
              </ActionBtn>
            </View>
          )}
        </>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.connectedContent,
            { paddingBottom: Math.max(16, insets.bottom) + 70 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ConnectedTab />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9FC', paddingHorizontal: 24 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTag: {
    color: '#FF4FA3', fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', lineHeight: 38 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF4FA3',
    borderWidth: 2, borderColor: 'white',
  },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FF4D4F',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: 'white', fontSize: 10, fontWeight: '800',
  },
  // Tabs
  tabs: {
    flexDirection: 'row', gap: 24,
    borderBottomWidth: 1.5, borderBottomColor: '#EEE',
    marginBottom: 0,
  },
  tabItem: { paddingBottom: 12 },
  tabText: { fontSize: 15, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabUnderline: { height: 2, borderRadius: 2, backgroundColor: 'transparent', marginTop: 2 },
  tabUnderlineActive: { backgroundColor: '#FF4FA3' },
  // Card area
  cardArea: {
    flex: 1, position: 'relative', marginTop: 20, marginBottom: 20, minHeight: 0,
  },
  cardInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18, shadowRadius: 40, elevation: 20,
  },
  cardGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: '40%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // Stamps
  verifiedBadge: {
    position: 'absolute', top: 18, left: 0, right: 0,
    alignSelf: 'center', width: 130,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#FF4FA3' },
  likeStamp: {
    position: 'absolute', top: 52, left: 20,
    borderWidth: 3, borderColor: '#34C759',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5,
    transform: [{ rotate: '-16deg' }],
  },
  likeStampText: { color: '#34C759', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  nopeStamp: {
    position: 'absolute', top: 52, right: 20,
    borderWidth: 3, borderColor: '#FF4D4F',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5,
    transform: [{ rotate: '16deg' }],
  },
  nopeStampText: { color: '#FF4D4F', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  superlikeStamp: {
    position: 'absolute', top: '40%', alignSelf: 'center', left: '25%',
    borderWidth: 3, borderColor: '#3A7AFE',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5,
  },
  superlikeStampText: { color: '#3A7AFE', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  // Card info overlay
  cardInfoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 22, paddingBottom: 26,
  },
  cardNameRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 8,
  },
  cardPetName: { color: 'white', fontSize: 34, fontWeight: '800', lineHeight: 38 },
  cardPetAge: { color: 'rgba(255,255,255,0.88)', fontSize: 22, fontWeight: '400', paddingBottom: 3 },
  cardMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap',
  },
  cardBreed: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  cardDot: { color: 'rgba(255,255,255,0.5)' },
  cardLocation: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  cardTraitsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  traitChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  traitChipText: { color: 'white', fontSize: 13, fontWeight: '500' },
  // State boxes (empty/error/loading)
  stateBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: 'white', borderRadius: 28, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  stateEmoji: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#FFF5FA', alignItems: 'center', justifyContent: 'center',
  },
  stateTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  stateMuted: { fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 220, lineHeight: 21 },
  stateBtn: {
    backgroundColor: '#FF4FA3', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38, shadowRadius: 10, elevation: 6,
  },
  stateBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  // Action bar
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 14, paddingTop: 8, flexShrink: 0,
  },
  actionBtn: {
    borderRadius: 999, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  actionBtnBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#3A7AFE',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  actionBtnBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  likeBtn: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#FF4FA3',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4FA3', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50, shadowRadius: 18, elevation: 12,
  },
  // Connected tab
  connectedContent: { paddingTop: 4 },
  connectedFilters: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
  },
  connFilter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  connFilterActive: { backgroundColor: '#1A1A1A', shadowOpacity: 0 },
  connFilterText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  connFilterTextActive: { color: 'white' },
  connFilterBadge: {
    backgroundColor: '#FF4FA3', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  connFilterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  connFilterBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  // Request card
  requestCard: {
    backgroundColor: 'white', borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  requestCardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  requestPetImage: { width: 76, height: 76, borderRadius: 18, flexShrink: 0 },
  requestNameRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4,
  },
  requestPetName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  requestStatusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2 },
  requestStatusText: { fontSize: 12, fontWeight: '600' },
  requestDate: { marginLeft: 'auto', fontSize: 12, color: '#AAAAAA' },
  requestMeta: { fontSize: 13, color: '#888', marginBottom: 5 },
  pendingNotice: {
    marginTop: 14, backgroundColor: '#FFFBF0',
    borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#FFEBB0',
  },
  pendingNoticeIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#FFB340', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20, shadowRadius: 4, elevation: 3,
  },
  pendingNoticeTitle: { fontSize: 13, fontWeight: '700', color: '#FFB340', marginBottom: 2 },
  pendingNoticeSub: { fontSize: 12, color: '#888' },
  emptyConnected: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyConnectedIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF5FA', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyConnectedTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptyConnectedSub: { fontSize: 14, color: '#777' },
});
