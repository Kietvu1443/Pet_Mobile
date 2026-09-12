import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppDialog, AppDialogProps } from '../ui/AppDialog';
import {
  checkLocationPermission,
  requestLocationPermission,
  openAppSettings,
} from '../../lib/permissions/permissionService';
import { Place, fetchNearbyPlaces, PLACE_CATEGORIES, placeQueryKeys } from '../../lib/api/places';
import {
  safeGetUserLocation,
  safeGetFastLocation,
  calculateDistanceMeters,
  DEFAULT_MAP_CENTER,
  SafeCoords,
} from '../../lib/location/safeLocation';
import { SafeMapView, type SafeMapViewRef } from './SafeMapView';

interface InlinePlaceMapProps {
  onOpenFullscreen?: () => void;
  onTouchMap?: (isInteracting: boolean) => void;
}

export function InlinePlaceMap({ onOpenFullscreen, onTouchMap }: InlinePlaceMapProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mapRef = useRef<SafeMapViewRef>(null);
  const hasCenteredOnce = useRef<boolean>(false);
  const hasUserInteractedWithMap = useRef<boolean>(false);
  const isFetchingPlacesRef = useRef<boolean>(false);
  const fetchSeqRef = useRef<number>(0);
  const selectedPlaceRef = useRef<Place | null>(null);

  const [userLocation, setUserLocation] = useState<SafeCoords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);
  const placesRef = useRef<Place[]>([]);

  useEffect(() => {
    selectedPlaceRef.current = selectedPlace;
  }, [selectedPlace]);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  // Tải danh sách địa điểm xung quanh tọa độ (ngăn chặn duplicate / race conditions)
  const loadNearbyPlaces = useCallback(async (coords: SafeCoords | null, isSilent = false) => {
    const seq = ++fetchSeqRef.current;
    isFetchingPlacesRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      const queryCoords = coords || DEFAULT_MAP_CENTER;

      // Ưu tiên đọc từ TanStack Query cache nếu có
      const cached = queryClient.getQueryData<Place[]>(
        placeQueryKeys.nearby({
          lat: queryCoords.latitude,
          lng: queryCoords.longitude,
        })
      );
      if (cached && cached.length > 0 && placesRef.current.length === 0) {
        setPlaces(cached);
        setSelectedPlace((prev) => prev || cached[0]);
      }

      const nearby = await fetchNearbyPlaces({
        lat: queryCoords.latitude,
        lng: queryCoords.longitude,
        radius: 20,
        limit: 30,
      });

      // Bỏ qua nếu có request mới hơn
      if (fetchSeqRef.current !== seq) return;

      // Nếu không có GPS thực tế, loại bỏ khoảng cách giả định từ trung tâm
      const sanitized = coords
        ? nearby
        : nearby.map((p) => ({ ...p, distance_km: null }));

      setPlaces(sanitized);

      // Lưu vào TanStack Query cache
      queryClient.setQueryData(
        placeQueryKeys.nearby({
          lat: queryCoords.latitude,
          lng: queryCoords.longitude,
        }),
        sanitized
      );

      setSelectedPlace((prev) => {
        if (prev) {
          const matched = sanitized.find((p) => p.id === prev.id);
          if (matched) return matched;
        }
        return sanitized.length > 0 ? sanitized[0] : null;
      });
    } catch (err) {
      console.log('[InlinePlaceMap] Fetch nearby places error:', err);
    } finally {
      if (fetchSeqRef.current === seq) {
        setLoading(false);
        isFetchingPlacesRef.current = false;
      }
    }
  }, [queryClient]);

  const fetchLocationAndCenter = useCallback(async (isManualPress: boolean) => {
    setIsLocating(true);
    try {
      const res = await safeGetUserLocation(true);
      setHasLocationPermission(res.permissionGranted);

      if (res.status === 'SUCCESS' && res.location) {
        setUserLocation(res.location);
        if (isManualPress || !hasCenteredOnce.current) {
          hasCenteredOnce.current = true;
          mapRef.current?.flyTo(
            {
              latitude: res.location.latitude,
              longitude: res.location.longitude,
            },
            14
          );
        }
        await loadNearbyPlaces(res.location);
      } else if (isManualPress) {
        if (res.status === 'SERVICES_DISABLED') {
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
            message: 'Tín hiệu GPS chưa phản hồi. Vui lòng thử lại hoặc di chuyển ra khu vực thông thoáng hơn.',
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
      }
    } catch (e) {
      console.log('[InlinePlaceMap] Locate error:', e);
    } finally {
      setIsLocating(false);
    }
  }, [loadNearbyPlaces]);

  const handleLocateAndCenter = useCallback(async (isManualPress = false) => {
    if (isLocating) return;

    if (isManualPress) {
      hasUserInteractedWithMap.current = false;
    }

    if (userLocation && isManualPress) {
      mapRef.current?.flyTo(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        14
      );
      return;
    }

    if (isManualPress) {
      const hasPerm = await checkLocationPermission();
      if (!hasPerm) {
        setDialogConfig({
          visible: true,
          variant: 'permission',
          iconName: 'navigate-circle-outline',
          title: 'Quyền truy cập vị trí',
          message: 'Ứng dụng cần quyền vị trí để định vị vị trí của bạn trên bản đồ và hiển thị các địa điểm thú cưng gần nhất.',
          confirmText: 'Cho phép',
          cancelText: 'Để sau',
          onConfirm: async () => {
            setDialogConfig(null);
            const req = await requestLocationPermission();
            if (req.granted) {
              fetchLocationAndCenter(true);
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
    }

    fetchLocationAndCenter(isManualPress);
  }, [isLocating, userLocation, fetchLocationAndCenter]);

  // Khởi tạo ban đầu với 2-stage location (Fast cache trước, fresh GPS sau)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Giai đoạn 1: Lấy ngay vị trí nhanh từ cache / last-known
        const fastRes = await safeGetFastLocation();
        if (!isMounted) return;

        setHasLocationPermission(fastRes.permissionGranted);
        if (fastRes.status === 'SUCCESS' && fastRes.location) {
          setUserLocation(fastRes.location);
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo(
              {
                latitude: fastRes.location.latitude,
                longitude: fastRes.location.longitude,
              },
              14
            );
          }
          await loadNearbyPlaces(fastRes.location);
        } else {
          await loadNearbyPlaces(null);
        }

        // Giai đoạn 2: Lấy fresh GPS ở background song song
        const freshRes = await safeGetUserLocation();
        if (!isMounted) return;

        setHasLocationPermission(freshRes.permissionGranted);
        if (freshRes.status === 'SUCCESS' && freshRes.location) {
          const freshLoc = freshRes.location;

          // QUY TẮC CAMERA AN TOÀN:
          // Không di chuyển camera nếu user đang xem vị trí khác hoặc tương tác với map
          if (!hasCenteredOnce.current && !hasUserInteractedWithMap.current && selectedPlaceRef.current === null) {
            hasCenteredOnce.current = true;
            mapRef.current?.flyTo(
              {
                latitude: freshLoc.latitude,
                longitude: freshLoc.longitude,
              },
              14
            );
          }

          const prevLoc = userLocation || fastRes.location;
          const hasSignificantMove = !prevLoc || calculateDistanceMeters(prevLoc, freshLoc) > 50;

          if (hasSignificantMove) {
            setUserLocation(freshLoc);
            await loadNearbyPlaces(freshLoc, true);
          }
        }
      } catch (e) {
        console.log('[InlinePlaceMap] Init error:', e);
        if (isMounted) {
          await loadNearbyPlaces(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadNearbyPlaces]);

  const handlePlacePress = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.flyTo(
      {
        latitude: place.latitude,
        longitude: place.longitude,
      },
      15
    );
  };

  const handleGoToDetail = (placeId: number) => {
    router.push(`/place/${placeId}` as any);
  };

  return (
    <View
      style={styles.container}
      onTouchStart={() => {
        hasUserInteractedWithMap.current = true;
        onTouchMap?.(true);
      }}
      onTouchEnd={() => onTouchMap?.(false)}
      onTouchCancel={() => onTouchMap?.(false)}
    >
      <View style={styles.mapWrap}>
        <SafeMapView
          ref={mapRef}
          places={places}
          userLocation={userLocation}
          selectedPlace={selectedPlace}
          onSelectPlace={handlePlacePress}
          onTouchMap={() => {
            hasUserInteractedWithMap.current = true;
            onTouchMap?.(true);
          }}
          height={260}
          onRetry={() => loadNearbyPlaces(userLocation)}
        />

        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color="#00220F" />
            <Text style={styles.loadingText}>Đang tải địa điểm...</Text>
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.controlsTopRight} pointerEvents="box-none">
          {onOpenFullscreen && (
            <Pressable
              onPress={onOpenFullscreen}
              hitSlop={8}
              style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.8 }]}
            >
              <MaterialIcons name="fullscreen" size={22} color="#00220F" />
            </Pressable>
          )}
          <Pressable
            onPress={() => handleLocateAndCenter(true)}
            hitSlop={8}
            disabled={isLocating}
            style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.8 }]}
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
        </View>

        {/* Single Unified Location status badge (Top-Left) */}
        {isLocating ? (
          <View style={styles.statusBadge} pointerEvents="none">
            <ActivityIndicator size="small" color="#00220F" />
            <Text style={styles.statusBadgeText}>Đang định vị...</Text>
          </View>
        ) : userLocation ? (
          <View style={styles.statusBadge} pointerEvents="none">
            <MaterialIcons name="my-location" size={12} color="#16A34A" />
            <Text style={[styles.statusBadgeText, { color: '#16A34A' }]}>📍 Vị trí của bạn</Text>
          </View>
        ) : !loading ? (
          <Pressable
            onPress={() => handleLocateAndCenter(true)}
            hitSlop={6}
            style={({ pressed }) => [styles.noLocationBadge, pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="location-off" size={13} color="#D97706" />
            <Text style={styles.noLocationText}>Chưa có vị trí · Chạm để tìm</Text>
          </Pressable>
        ) : null}

        {/* Selected Place Overlay Card */}
        {selectedPlace && (
          <Pressable
            onPress={() => handleGoToDetail(selectedPlace.id)}
            style={({ pressed }) => [styles.bottomPlaceCard, pressed && { opacity: 0.95 }]}
          >
            <View style={styles.bottomPlaceInfo}>
              <View style={styles.bottomPlaceHeader}>
                <View
                  style={[
                    styles.bottomCategoryDot,
                    {
                      backgroundColor:
                        (PLACE_CATEGORIES[selectedPlace.type] || PLACE_CATEGORIES.other).color,
                    },
                  ]}
                />
                <Text style={styles.bottomCategoryText}>
                  {(PLACE_CATEGORIES[selectedPlace.type] || PLACE_CATEGORIES.other).label}
                </Text>
                {selectedPlace.distance_km != null && (
                  <Text style={styles.bottomDistanceText}>• {selectedPlace.distance_km} km</Text>
                )}
              </View>

              <Text numberOfLines={1} style={styles.bottomPlaceTitle}>
                {selectedPlace.name}
              </Text>
              <Text numberOfLines={1} style={styles.bottomPlaceAddress}>
                {selectedPlace.address}
              </Text>
            </View>

            <View style={styles.bottomDetailIconWrap}>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
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
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  mapWrap: {
    height: 260,
    width: '100%',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 15,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00220F',
  },
  controlsTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
    zIndex: 20,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00220F',
  },
  noLocationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 20,
  },
  noLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  bottomPlaceCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 20,
  },
  bottomPlaceInfo: {
    flex: 1,
    marginRight: 10,
  },
  bottomPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bottomCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bottomDistanceText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
  },
  bottomPlaceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bottomPlaceAddress: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomDetailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00220F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
