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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Place, PlaceType, fetchNearbyPlaces, PLACE_CATEGORIES } from '../lib/api/places';
import { CustomPlaceMarker } from '../components/map/CustomPlaceMarker';
import { resolveImageUrl } from '../lib/images/resolveUrl';
import { SafeMapView, type SafeMapViewRef } from '../components/map/SafeMapView';
import {
  safeGetUserLocation,
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
  const mapRef = useRef<SafeMapViewRef>(null);
  const flatListRef = useRef<FlatList>(null);
  const hasCenteredOnce = useRef<boolean>(false);

  const [userLocation, setUserLocation] = useState<SafeCoords | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | PlaceType>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  const loadPlaces = useCallback(async (typeFilter: 'all' | PlaceType, loc: SafeCoords | null) => {
    try {
      setLoading(true);
      const queryCoords = loc || DEFAULT_MAP_CENTER;
      const res = await fetchNearbyPlaces({
        lat: queryCoords.latitude,
        lng: queryCoords.longitude,
        radius: 30,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        limit: 50,
      });

      // Nếu không có GPS thực tế, loại bỏ distance_km để tránh tính sai khoảng cách từ trung tâm
      const sanitized = loc ? res : res.map((p) => ({ ...p, distance_km: null }));
      setPlaces(sanitized);

      if (sanitized.length > 0) {
        setSelectedPlace((prev) => {
          if (prev && sanitized.some((p) => p.id === prev.id)) return prev;
          return sanitized[0];
        });
      } else {
        setSelectedPlace(null);
      }
    } catch (e) {
      console.log('[PlacesMap] Load places error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await safeGetUserLocation();
        if (!isMounted) return;

        setHasLocationPermission(res.permissionGranted);
        if (res.status === 'SUCCESS' && res.location) {
          setUserLocation(res.location);

          // Chỉ di chuyển camera tới vị trí người dùng MỘT LẦN DUY NHẤT khi khởi tạo
          if (!hasCenteredOnce.current && mapRef.current) {
            hasCenteredOnce.current = true;
            mapRef.current.flyTo(res.location, 14);
          }
        }
      } catch (e) {
        console.log('[PlacesMap] Init location error:', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadPlaces(selectedType, userLocation);
  }, [selectedType, userLocation, loadPlaces]);

  const handleSelectPlace = (place: Place, index?: number) => {
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

  const handleCenterUser = async () => {
    if (isLocating) return;

    if (userLocation) {
      mapRef.current?.flyTo(userLocation, 14);
      return;
    }

    setIsLocating(true);
    try {
      // Nếu chưa có vị trí, thử xin quyền và lấy lại GPS
      const res = await safeGetUserLocation();
      setHasLocationPermission(res.permissionGranted);

      if (res.status === 'SUCCESS' && res.location) {
        setUserLocation(res.location);
        mapRef.current?.flyTo(res.location, 14);
      } else {
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
      console.log('[PlacesMap] Center user error:', e);
    } finally {
      setIsLocating(false);
    }
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
        attributionStyle={{ bottom: 180 }}
        onRetry={() => loadPlaces(selectedType, userLocation)}
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

          <Pressable
            onPress={handleCenterUser}
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
                onPress={() => setSelectedType(item.id)}
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
        onPress={() => router.push('/add-place' as any)}
        style={({ pressed }) => [
          styles.addPlaceFab,
          { bottom: insets.bottom + 170 },
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
        {places.length === 0 && !loading ? (
          <View style={styles.emptyCarouselCard}>
            <MaterialIcons name="location-off" size={24} color="#94A3B8" />
            <Text style={styles.emptyCarouselText}>
              Không tìm thấy địa điểm thú cưng quanh đây (bán kính 30km).
            </Text>
            <Pressable
              onPress={() => {
                loadPlaces(selectedType, DEFAULT_MAP_CENTER);
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
    elevation: 6,
    zIndex: 10,
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
