import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Place, fetchNearbyPlaces, PLACE_CATEGORIES } from '../../lib/api/places';
import {
  safeGetUserLocation,
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
  const mapRef = useRef<SafeMapViewRef>(null);
  const hasCenteredOnce = useRef<boolean>(false);
  const isFetchingPlacesRef = useRef<boolean>(false);
  const fetchSeqRef = useRef<number>(0);

  const [userLocation, setUserLocation] = useState<SafeCoords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  // Tải danh sách địa điểm xung quanh tọa độ (ngăn chặn duplicate / race conditions)
  const loadNearbyPlaces = useCallback(async (coords: SafeCoords | null) => {
    const seq = ++fetchSeqRef.current;
    isFetchingPlacesRef.current = true;
    try {
      setLoading(true);
      const queryCoords = coords || DEFAULT_MAP_CENTER;
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
      setSelectedPlace((prev) => {
        if (prev && sanitized.some((p) => p.id === prev.id)) return prev;
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
  }, []);

  // Hàm định vị và recenter dùng chung cho nút [⌖] và status badge
  const handleLocateAndCenter = useCallback(async (isManualPress = false) => {
    if (isLocating) return;

    // Nếu đã có tọa độ và người dùng bấm nút: chỉ recenter camera tới vị trí đó
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

    setIsLocating(true);
    try {
      const res = await safeGetUserLocation();
      setHasLocationPermission(res.permissionGranted);

      if (res.status === 'SUCCESS' && res.location) {
        setUserLocation(res.location);

        // Recenter: chỉ chạy camera khi người dùng chủ động bấm HOẶC lần khóa vị trí đầu tiên
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

        // Cập nhật lại danh sách địa điểm theo tọa độ thực tế
        await loadNearbyPlaces(res.location);
      } else if (isManualPress) {
        // Chỉ thông báo khi người dùng chủ động nhấn nút hoặc badge
        if (res.status === 'PERMISSION_DENIED') {
          Alert.alert(
            'Quyền truy cập vị trí',
            'Ứng dụng cần quyền vị trí để hiển thị các địa điểm thú cưng gần bạn. Vui lòng cấp quyền trong Cài đặt thiết bị.'
          );
        } else if (res.status === 'SERVICES_DISABLED') {
          Alert.alert(
            'Dịch vụ vị trí đang tắt',
            'Dịch vụ vị trí của thiết bị đang tắt. Vui lòng bật định vị (GPS) trong cài đặt điện thoại.'
          );
        } else if (res.status === 'TIMEOUT') {
          Alert.alert(
            'Chưa nhận được GPS',
            'Tín hiệu GPS chưa phản hồi. Vui lòng thử lại hoặc di chuyển ra khu vực thông thoáng hơn.'
          );
        } else {
          Alert.alert(
            'Chưa hỗ trợ GPS trên bản build này',
            'Ứng dụng trên điện thoại hiện đang chạy bản build chưa có native module ExpoLocation. Cần build lại app (npx expo run:android hoặc EAS Build) để sử dụng GPS.'
          );
        }
      }
    } catch (e) {
      console.log('[InlinePlaceMap] Locate error:', e);
    } finally {
      setIsLocating(false);
    }
  }, [isLocating, userLocation, loadNearbyPlaces]);

  // Khởi tạo ban đầu
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await safeGetUserLocation();
        if (!isMounted) return;

        setHasLocationPermission(res.permissionGranted);
        if (res.status === 'SUCCESS' && res.location) {
          setUserLocation(res.location);
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo(
              {
                latitude: res.location.latitude,
                longitude: res.location.longitude,
              },
              14
            );
          }
          await loadNearbyPlaces(res.location);
        } else {
          await loadNearbyPlaces(null);
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
      onTouchStart={() => onTouchMap?.(true)}
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
