import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { AppDialog, AppDialogProps } from '../components/ui/AppDialog';
import {
  checkLocationPermission,
  requestLocationPermission,
  openAppSettings,
} from '../lib/permissions/permissionService';
import {
  Place,
  PlaceType,
  fetchNearbyPlaces,
  PLACE_CATEGORIES,
  placeQueryKeys,
} from '../lib/api/places';
import { CustomPlaceMarker } from '../components/map/CustomPlaceMarker';
import { resolveImageUrl } from '../lib/images/resolveUrl';
import { SafeMapView, type SafeMapViewRef } from '../components/map/SafeMapView';
import {
  safeGetUserLocation,
  safeGetFastLocation,
  calculateDistanceMeters,
  DEFAULT_MAP_CENTER,
  SafeCoords,
} from '../lib/location/safeLocation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;



const FILTER_TYPES: { id: 'all' | PlaceType; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả', icon: 'apps' },
  { id: 'shelter', label: 'Trại cứu hộ', icon: 'home' },
  { id: 'veterinary', label: 'Thú y 24/7', icon: 'medical-services' },
  { id: 'grooming', label: 'Spa Grooming', icon: 'content-cut' },
  { id: 'pet_cafe', label: 'Cafe thú cưng', icon: 'local-cafe' },
  { id: 'park', label: 'Công viên', icon: 'park' },
  { id: 'meetup', label: 'Điểm hẹn offline', icon: 'groups' },
  { id: 'pet_shop', label: 'Pet Shop', icon: 'shopping-bag' },
];

export default function PlacesMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mapRef = useRef<SafeMapViewRef>(null);
  const flatListRef = useRef<FlatList>(null);
  const hasCenteredOnce = useRef<boolean>(false);
  const hasUserInteractedWithMap = useRef<boolean>(false);
  const selectedPlaceRef = useRef<Place | null>(null);
  const placesRef = useRef<Place[]>([]);
  const fetchSeqRef = useRef<number>(0);
  const queryLocationRef = useRef<SafeCoords | null>(null);

  const [userLocation, setUserLocation] = useState<SafeCoords | null>(null);
  const [queryLocation, setQueryLocation] = useState<SafeCoords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | PlaceType>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  useEffect(() => {
    selectedPlaceRef.current = selectedPlace;
  }, [selectedPlace]);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    queryLocationRef.current = queryLocation;
  }, [queryLocation]);

  const loadPlaces = useCallback(
    async (typeFilter: 'all' | PlaceType, loc: SafeCoords | null, isSilent = false) => {
      const seq = ++fetchSeqRef.current;
      try {
        if (!isSilent) setLoading(true);
        setLoadError(null);
        const queryCoords = loc || DEFAULT_MAP_CENTER;

        // Ưu tiên đọc từ TanStack Query cache nếu có
        const cached = queryClient.getQueryData<Place[]>(
          placeQueryKeys.nearby({
            lat: queryCoords.latitude,
            lng: queryCoords.longitude,
            type: typeFilter !== 'all' ? typeFilter : undefined,
          })
        );
        if (cached && cached.length > 0 && placesRef.current.length === 0) {
          setPlaces(cached);
          setSelectedPlace((prev) => prev || cached[0]);
        }

        const res = await fetchNearbyPlaces({
          lat: queryCoords.latitude,
          lng: queryCoords.longitude,
          radius: 30,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          limit: 50,
        });

        // Bỏ qua nếu có request mới hơn (ngăn race conditions)
        if (fetchSeqRef.current !== seq) return;

        // Nếu không có GPS thực tế, loại bỏ distance_km để tránh tính sai khoảng cách từ trung tâm
        const sanitized = loc ? res : res.map((p) => ({ ...p, distance_km: null }));
        setPlaces(sanitized);

        // Lưu vào TanStack Query cache
        queryClient.setQueryData(
          placeQueryKeys.nearby({
            lat: queryCoords.latitude,
            lng: queryCoords.longitude,
            type: typeFilter !== 'all' ? typeFilter : undefined,
          }),
          sanitized
        );

        if (sanitized.length > 0) {
          setSelectedPlace((prev) => {
            if (prev) {
              const matched = sanitized.find((p) => p.id === prev.id);
              if (matched) return matched;
            }
            return sanitized[0];
          });
        } else {
          setSelectedPlace(null);
        }
      } catch (e: any) {
        console.log('[PlacesMap] Load places error:', e);
        if (placesRef.current.length === 0 && fetchSeqRef.current === seq) {
          setLoadError(e?.message || 'Không thể tải danh sách địa điểm. Vui lòng kiểm tra kết nối mạng.');
        }
      } finally {
        if (fetchSeqRef.current === seq) {
          setLoading(false);
        }
      }
    },
    [queryClient]
  );

  // GIAI ĐOẠN ĐỊNH VỊ: 2-stage fast location (Không block UI, tuân thủ Camera an toàn)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Giai đoạn 1: Lấy ngay vị trí cache / last-known
        const fastRes = await safeGetFastLocation();
        if (!isMounted) return;

        setHasLocationPermission(fastRes.permissionGranted);
        if (fastRes.status === 'SUCCESS' && fastRes.location) {
          setUserLocation(fastRes.location);
          setQueryLocation((prev) => prev || fastRes.location);
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo(fastRes.location, 14);
          }
        } else {
          setQueryLocation((prev) => prev || DEFAULT_MAP_CENTER);
        }

        // Giai đoạn 2: Lấy fresh GPS ở background song song
        const freshRes = await safeGetUserLocation();
        if (!isMounted) return;

        setHasLocationPermission(freshRes.permissionGranted);
        if (freshRes.status === 'SUCCESS' && freshRes.location) {
          const freshLoc = freshRes.location;

          // QUY TẮC CAMERA AN TOÀN:
          // Tuyệt đối không tự động di chuyển camera nếu user đang xem vị trí khác hoặc đang tương tác với map!
          if (!hasCenteredOnce.current && !hasUserInteractedWithMap.current && selectedPlaceRef.current === null) {
            hasCenteredOnce.current = true;
            mapRef.current?.flyTo(freshLoc, 14);
          }

          setUserLocation(freshLoc);

          // Cập nhật queryLocation nếu người dùng chưa chuyển sang xem địa điểm mẫu (vẫn đang bám theo GPS)
          setQueryLocation((prev) => {
            if (!prev) return freshLoc;
            const isAtSampleCenter =
              Math.abs(prev.latitude - DEFAULT_MAP_CENTER.latitude) < 0.001 &&
              Math.abs(prev.longitude - DEFAULT_MAP_CENTER.longitude) < 0.001;
            if (isAtSampleCenter) return prev;

            const hasSignificantMove = calculateDistanceMeters(prev, freshLoc) > 50;
            return hasSignificantMove ? freshLoc : prev;
          });
        }
      } catch (e) {
        console.log('[PlacesMap] Init location error:', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Screen Focus: Khi quay lại từ Place Detail hoặc Add Place, silently sync với Query Cache & backend
  useFocusEffect(
    useCallback(() => {
      // Đồng bộ ngay từ cache nếu có mutation vừa diễn ra
      const cached = queryClient.getQueriesData<Place[]>({ queryKey: ['places', 'nearby'] });
      if (cached && cached.length > 0) {
        setPlaces((prevPlaces) => {
          if (prevPlaces.length === 0) return prevPlaces;
          let hasChange = false;
          const updated = prevPlaces.map((p) => {
            for (const [, cacheList] of cached) {
              if (Array.isArray(cacheList)) {
                const item = cacheList.find((c) => c.id === p.id);
                if (item && (item.rating_avg !== p.rating_avg || item.review_count !== p.review_count)) {
                  hasChange = true;
                  return { ...p, rating_avg: item.rating_avg, review_count: item.review_count };
                }
              }
            }
            return p;
          });
          return hasChange ? updated : prevPlaces;
        });

        // Đồng bộ cả selectedPlace nếu đang trúng địa điểm được cập nhật
        if (selectedPlaceRef.current) {
          const selId = selectedPlaceRef.current.id;
          for (const [, cacheList] of cached) {
            if (Array.isArray(cacheList)) {
              const item = cacheList.find((c) => c.id === selId);
              if (item) {
                setSelectedPlace((prev) =>
                  prev ? { ...prev, rating_avg: item.rating_avg, review_count: item.review_count } : prev
                );
              }
            }
          }
        }
      }

      // Silent background refetch từ backend để đồng bộ tuyệt đối
      loadPlaces(selectedType, queryLocationRef.current, true);
    }, [selectedType, loadPlaces, queryClient])
  );

  useEffect(() => {
    loadPlaces(selectedType, queryLocation);
  }, [selectedType, queryLocation, loadPlaces]);

  const handleSelectPlace = (place: Place, index?: number) => {
    hasUserInteractedWithMap.current = true;
    setSelectedPlace(place);
    if (mapRef.current) {
      mapRef.current.flyTo(
        {
          latitude: place.latitude,
          longitude: place.longitude,
        },
        15
      );
    }
    if (index !== undefined && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  const fetchAndCenterUser = async () => {
    setIsLocating(true);
    try {
      const res = await safeGetUserLocation(true);
      setHasLocationPermission(res.permissionGranted);

      if (res.status === 'SUCCESS' && res.location) {
        setUserLocation(res.location);
        setQueryLocation(res.location);
        mapRef.current?.flyTo(res.location, 14);
      } else if (res.status === 'SERVICES_DISABLED') {
        setDialogConfig({
          visible: true,
          variant: 'warning',
          iconName: 'location-outline',
          title: 'Dịch vụ vị trí đang tắt',
          message: 'Dịch vụ vị trí (GPS) của thiết bị đang tắt. Vui lòng bật định vị trong cài đặt điện thoại.',
          confirmText: 'Mở Cài đặt',
          cancelText: 'Đóng',
          onConfirm: () => {
            setDialogConfig(null);
            openAppSettings();
          },
          onCancel: () => setDialogConfig(null),
        });
      } else if (res.status === 'TIMEOUT') {
        setDialogConfig({
          visible: true,
          variant: 'info',
          iconName: 'time-outline',
          title: 'Chưa nhận được GPS',
          message: 'Tín hiệu GPS chưa phản hồi kịp thời. Vui lòng thử lại hoặc di chuyển ra khu vực thông thoáng hơn.',
          singleButton: true,
          confirmText: 'Đã hiểu',
          onConfirm: () => setDialogConfig(null),
        });
      } else {
        setDialogConfig({
          visible: true,
          variant: 'error',
          iconName: 'alert-circle-outline',
          title: 'Không thể lấy vị trí',
          message: res.errorMessage || 'Không thể xác định vị trí hiện tại của thiết bị.',
          singleButton: true,
          confirmText: 'Đã hiểu',
          onConfirm: () => setDialogConfig(null),
        });
      }
    } catch (e) {
      console.log('[PlacesMap] Center user error:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleCenterUser = async () => {
    hasUserInteractedWithMap.current = false;
    if (isLocating) return;

    if (userLocation) {
      setQueryLocation(userLocation);
      mapRef.current?.flyTo(userLocation, 14);
      return;
    }

    const hasPerm = await checkLocationPermission();
    if (!hasPerm) {
      setDialogConfig({
        visible: true,
        variant: 'permission',
        iconName: 'navigate-circle-outline',
        title: 'Quyền truy cập vị trí',
        message: 'Ứng dụng cần quyền vị trí để định vị vị trí hiện tại và gợi ý các địa điểm thú cưng gần bạn nhất.',
        confirmText: 'Cho phép',
        cancelText: 'Để sau',
        onConfirm: async () => {
          setDialogConfig(null);
          const req = await requestLocationPermission();
          if (req.granted) {
            fetchAndCenterUser();
          } else if (!req.canAskAgain) {
            setDialogConfig({
              visible: true,
              variant: 'warning',
              iconName: 'settings-outline',
              title: 'Cần cấp quyền trong Cài đặt',
              message: 'Quyền vị trí đã bị từ chối. Vui lòng mở Cài đặt thiết bị để cho phép Pet Helper sử dụng vị trí.',
              confirmText: 'Mở Cài đặt',
              cancelText: 'Đóng',
              onConfirm: () => {
                setDialogConfig(null);
                openAppSettings();
              },
              onCancel: () => setDialogConfig(null),
            });
          }
        },
        onCancel: () => setDialogConfig(null),
      });
      return;
    }

    fetchAndCenterUser();
  };

  const handleMapLongPress = (coords: { latitude: number; longitude: number }) => {
    hasUserInteractedWithMap.current = true;
    setDialogConfig({
      visible: true,
      variant: 'confirm',
      iconName: 'location-outline',
      title: 'Đóng góp địa điểm 📍',
      message: 'Bạn có muốn thêm địa điểm thú cưng mới tại vị trí vừa chọn trên bản đồ không?',
      confirmText: 'Thêm địa điểm',
      cancelText: 'Hủy',
      onConfirm: () => {
        setDialogConfig(null);
        router.push({
          pathname: '/add-place',
          params: {
            lat: String(coords.latitude),
            lng: String(coords.longitude),
          },
        } as any);
      },
      onCancel: () => setDialogConfig(null),
    });
  };

  return (
    <View style={styles.screen}>
      <SafeMapView
        ref={mapRef}
        isFullScreen={true}
        places={places}
        userLocation={userLocation}
        selectedPlace={selectedPlace}
        onSelectPlace={handleSelectPlace}
        onTouchMap={() => {
          hasUserInteractedWithMap.current = true;
        }}
        onMapPress={() => {
          hasUserInteractedWithMap.current = true;
        }}
        onMapLongPress={handleMapLongPress}
        attributionStyle={{ bottom: 180 }}
        onRetry={() => loadPlaces(selectedType, queryLocation)}
      />

      {/* Top Floating Bar */}
      <View style={[styles.topBarContainer, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topNavRow} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.floatingCircleBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>

          <Text style={styles.topBarTitle}>Khám phá gần bạn</Text>

          <View style={styles.topRightActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleCenterUser();
              }}
              hitSlop={12}
              disabled={isLocating}
              style={({ pressed }) => [styles.floatingCircleBtn, pressed && { opacity: 0.8 }]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#00220F" />
              ) : (
                <MaterialIcons
                  name={hasLocationPermission && userLocation ? 'my-location' : 'location-searching'}
                  size={20}
                  color={userLocation ? '#16A34A' : '#00220F'}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/add-place' as any);
              }}
              hitSlop={12}
              style={({ pressed }) => [
                styles.floatingCircleBtn,
                styles.topAddBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Category Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TYPES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedType === item.id;
            return (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedType(item.id);
                }}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Floating Add Place Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add-place' as any);
        }}
        style={({ pressed }) => [
          styles.addPlaceFab,
          { bottom: insets.bottom + 235 },
          pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
        ]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addPlaceFabText}>Đóng góp địa điểm</Text>
      </Pressable>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingPill} pointerEvents="none">
          <ActivityIndicator size="small" color="#00220F" />
          <Text style={styles.loadingPillText}>Đang quét địa điểm...</Text>
        </View>
      )}

      {/* Bottom Places Carousel */}
      <View style={[styles.bottomCarouselContainer, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
        {loadError && places.length === 0 ? (
          <View style={styles.emptyCarouselCard}>
            <MaterialIcons name="wifi-off" size={24} color="#EF4444" />
            <Text style={styles.emptyCarouselText}>{loadError}</Text>
            <Pressable
              onPress={() => loadPlaces(selectedType, queryLocation)}
              style={({ pressed }) => [styles.exploreHcmcBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="refresh" size={15} color="#FFFFFF" />
              <Text style={styles.exploreHcmcBtnText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : places.length === 0 && !loading ? (
          <View style={styles.emptyCarouselCard}>
            <MaterialIcons name="location-off" size={24} color="#94A3B8" />
            <Text style={styles.emptyCarouselText}>
              Không tìm thấy địa điểm thú cưng quanh đây (bán kính 30km).
            </Text>
            <Pressable
              onPress={() => {
                hasUserInteractedWithMap.current = true;
                setQueryLocation(DEFAULT_MAP_CENTER);
                mapRef.current?.flyTo(DEFAULT_MAP_CENTER, 13);
              }}
              style={({ pressed }) => [styles.exploreHcmcBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="explore" size={15} color="#FFFFFF" />
              <Text style={styles.exploreHcmcBtnText}>Xem địa điểm mẫu tại TP.HCM</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            horizontal
            data={places}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(e) => {
              const contentOffset = e.nativeEvent.contentOffset.x;
              const index = Math.round(contentOffset / (CARD_WIDTH + 14));
              if (index >= 0 && index < places.length) {
                const activePlace = places[index];
                if (selectedPlaceRef.current?.id !== activePlace.id) {
                  setSelectedPlace(activePlace);
                  hasUserInteractedWithMap.current = true;
                }
              }
            }}
            renderItem={({ item, index }) => {
              const meta = PLACE_CATEGORIES[item.type as PlaceType] || PLACE_CATEGORIES.other;
              const isSelected = selectedPlace?.id === item.id;
              const imgUrl = item.image_url ? resolveImageUrl(item.image_url) : null;

              return (
                <Pressable
                  onPress={() => handleSelectPlace(item, index)}
                  style={[
                    styles.carouselCard,
                    isSelected && styles.carouselCardSelected,
                  ]}
                >
                  <View style={styles.carouselCardImageWrap}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.carouselCardImage} />
                    ) : (
                      <View style={[styles.carouselCardImagePlaceholder, { backgroundColor: meta.bgColor }]}>
                        <MaterialIcons name={(meta.icon as any) || 'pets'} size={32} color={meta.color} />
                      </View>
                    )}
                    <View style={[styles.carouselTypeBadge, { backgroundColor: meta.bgColor }]}>
                      <Text style={[styles.carouselTypeBadgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.carouselCardBody}>
                    <Text numberOfLines={1} style={styles.carouselCardTitle}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.carouselCardAddress}>
                      {item.address}
                    </Text>

                    <View style={styles.carouselCardFooter}>
                      <View style={styles.carouselRatingWrap}>
                        <MaterialIcons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.carouselRatingText}>
                          {item.rating_avg.toFixed(1)}
                        </Text>
                        <Text style={styles.carouselReviewCount}>
                          ({item.review_count})
                        </Text>
                      </View>

                      {item.distance_km != null && (
                        <Text style={styles.carouselDistance}>
                          📍 {item.distance_km} km
                        </Text>
                      )}

                      <Pressable
                        onPress={() => router.push(`/place/${item.id}` as any)}
                        style={styles.carouselDetailBtn}
                      >
                        <Text style={styles.carouselDetailBtnText}>Chi tiết</Text>
                        <MaterialIcons name="chevron-right" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* Standard AppDialog */}
      <AppDialog
        visible={Boolean(dialogConfig?.visible)}
        title={dialogConfig?.title || ''}
        message={dialogConfig?.message}
        variant={dialogConfig?.variant}
        iconName={dialogConfig?.iconName}
        confirmText={dialogConfig?.confirmText}
        cancelText={dialogConfig?.cancelText}
        singleButton={dialogConfig?.singleButton}
        loading={dialogConfig?.loading}
        onConfirm={dialogConfig?.onConfirm}
        onCancel={dialogConfig?.onCancel || (() => setDialogConfig(null))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 10,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topAddBtn: {
    backgroundColor: '#00220F',
  },
  filterList: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipSelected: {
    backgroundColor: '#00220F',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  addPlaceFab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00220F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 40,
  },
  addPlaceFabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingPill: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  loadingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00220F',
  },
  bottomCarouselContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  carouselCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  carouselCardSelected: {
    borderColor: '#00220F',
    transform: [{ scale: 1.02 }],
  },
  carouselCardImageWrap: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  carouselCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  carouselTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  carouselCardBody: {
    padding: 12,
  },
  carouselCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  carouselCardAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  carouselCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselRatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  carouselRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  carouselReviewCount: {
    fontSize: 10,
    color: '#94A3B8',
  },
  carouselDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00220F',
  },
  carouselDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00220F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 2,
  },
  carouselDetailBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCarouselCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCarouselText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  exploreHcmcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00220F',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 4,
  },
  exploreHcmcBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
