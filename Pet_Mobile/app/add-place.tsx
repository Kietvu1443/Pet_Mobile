import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPlace, PlaceType, PLACE_CATEGORIES, invalidatePlacesQueries } from '../lib/api/places';
import { SafeMapView, Marker, type SafeMapViewRef } from '../components/map/SafeMapView';
import {
  safeGetCurrentPosition,
  safeGetFastLocation,
  calculateDistanceMeters,
  safeReverseGeocode,
  DEFAULT_HCMC_COORDS,
} from '../lib/location/safeLocation';
import { AppDialog, AppDialogProps } from '../components/ui/AppDialog';
import {
  checkLocationPermission,
  requestLocationPermission,
  openAppSettings,
} from '../lib/permissions/permissionService';

const CATEGORY_KEYS: PlaceType[] = [
  'shelter',
  'veterinary',
  'grooming',
  'pet_shop',
  'pet_cafe',
  'park',
  'meetup',
  'other',
];

export default function AddPlaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<SafeMapViewRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const lastGeocodedCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const initialLat = params.lat ? parseFloat(params.lat) : null;
  const initialLng = params.lng ? parseFloat(params.lng) : null;

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<PlaceType>('other');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(initialLat ?? DEFAULT_HCMC_COORDS.latitude);
  const [longitude, setLongitude] = useState<number>(initialLng ?? DEFAULT_HCMC_COORDS.longitude);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLatitude(initialLat);
      setLongitude(initialLng);
      mapRef.current?.flyTo({ latitude: initialLat, longitude: initialLng }, 15);
      safeReverseGeocode({ latitude: initialLat, longitude: initialLng })
        .then((geoAddress) => {
          if (geoAddress && !address) {
            setAddress(geoAddress);
          }
        })
        .catch(() => {});
    } else {
      // Khởi tạo im lặng không bật popup native
      safeGetFastLocation(false).then((fastRes) => {
        if (fastRes.status === 'SUCCESS' && fastRes.location) {
          const coords = fastRes.location;
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          mapRef.current?.flyTo(coords, 15);
          safeReverseGeocode(coords)
            .then((geoAddress) => {
              if (geoAddress) {
                setAddress(geoAddress);
                lastGeocodedCoords.current = coords;
              }
            })
            .catch(() => {});
        }
      });
    }
  }, [initialLat, initialLng]);

  const executeFetchGps = async () => {
    try {
      setLoadingGps(true);

      const fastRes = await safeGetFastLocation(true);
      if (fastRes.status === 'SUCCESS' && fastRes.location) {
        const coords = fastRes.location;
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        mapRef.current?.flyTo(coords, 15);
        safeReverseGeocode(coords)
          .then((geoAddress) => {
            if (geoAddress && !address) {
              setAddress(geoAddress);
              lastGeocodedCoords.current = coords;
            }
          })
          .catch(() => {});
      }

      const coords = await safeGetCurrentPosition(true);
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        mapRef.current?.flyTo(coords, 15);

        try {
          const shouldGeocode =
            !lastGeocodedCoords.current ||
            calculateDistanceMeters(lastGeocodedCoords.current, coords) > 30;

          if (shouldGeocode) {
            const geoAddress = await safeReverseGeocode(coords);
            if (geoAddress) {
              setAddress(geoAddress);
              lastGeocodedCoords.current = coords;
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.log('[AddPlace] Location error:', e);
    } finally {
      setLoadingGps(false);
    }
  };

  const handleUseCurrentGps = async () => {
    const hasPerm = await checkLocationPermission();
    if (!hasPerm) {
      setDialogConfig({
        visible: true,
        variant: 'permission',
        iconName: 'navigate-circle-outline',
        title: 'Quyền truy cập vị trí',
        message: 'Ứng dụng cần quyền vị trí để tự động lấy tọa độ GPS chính xác cho địa điểm thú cưng.',
        confirmText: 'Cho phép',
        cancelText: 'Để sau',
        onConfirm: async () => {
          setDialogConfig(null);
          const req = await requestLocationPermission();
          if (req.granted) {
            executeFetchGps();
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
    executeFetchGps();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('[AddPlace] Image picker error:', e);
    }
  };

  const handlePickImage = () => {
    pickImage();
  };

  const handleMapPress = (coordsOrEvent: any) => {
    let lat: number | null = null;
    let lng: number | null = null;
    if (coordsOrEvent?.latitude && coordsOrEvent?.longitude) {
      lat = coordsOrEvent.latitude;
      lng = coordsOrEvent.longitude;
    } else if (coordsOrEvent?.nativeEvent?.coordinate) {
      lat = coordsOrEvent.nativeEvent.coordinate.latitude;
      lng = coordsOrEvent.nativeEvent.coordinate.longitude;
    }
    if (lat !== null && lng !== null) {
      const newCoords = { latitude: lat, longitude: lng };
      setLatitude(lat);
      setLongitude(lng);
      mapRef.current?.easeTo(newCoords, 15);

      // Chỉ reverse geocode nếu vị trí ghim mới cách vị trí cũ > 30m
      const shouldGeocode =
        !lastGeocodedCoords.current ||
        calculateDistanceMeters(lastGeocodedCoords.current, newCoords) > 30;

      if (shouldGeocode) {
        safeReverseGeocode(newCoords)
          .then((geoAddress) => {
            if (geoAddress) {
              setAddress(geoAddress);
              lastGeocodedCoords.current = newCoords;
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleFieldLayout = (key: string) => (event: LayoutChangeEvent) => {
    fieldPositions.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToField = (key: string, extraOffset = 0) => {
    setTimeout(() => {
      const y = fieldPositions.current[key];
      if (typeof y === 'number') {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, y - 20 + extraOffset),
          animated: true,
        });
      } else if (key === 'description') {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, Platform.OS === 'ios' ? 120 : 180);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!name.trim()) {
      setError('Vui lòng nhập tên địa điểm');
      return;
    }
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ địa điểm');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('type', selectedType);
      formData.append('address', address.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));

      if (phone.trim()) formData.append('phone', phone.trim());
      if (website.trim()) formData.append('website', website.trim());
      if (description.trim()) formData.append('description', description.trim());

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'place.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      await createPlace(formData);

      // Invalidate TanStack Query để các màn hình map/list tự động nạp lại danh sách mới
      invalidatePlacesQueries();

      setDialogConfig({
        visible: true,
        variant: 'success',
        iconName: 'checkmark-circle-outline',
        title: 'Đã gửi địa điểm! ⏳',
        message: 'Địa điểm của bạn đã được gửi thành công và đang chờ ban quản trị kiểm duyệt trước khi hiển thị trên bản đồ công khai.',
        confirmText: 'Đồng ý',
        singleButton: true,
        onConfirm: () => {
          setDialogConfig(null);
          router.back();
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi khi tạo địa điểm. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm địa điểm cộng đồng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Chọn Ảnh */}
        <Pressable onPress={handlePickImage} style={styles.imagePickerWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.pickedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-a-photo" size={32} color="#64748B" />
              <Text style={styles.imagePlaceholderText}>Chọn ảnh bìa địa điểm (Tùy chọn)</Text>
            </View>
          )}
        </Pressable>

        {/* Tên địa điểm */}
        <View style={styles.fieldGroup} onLayout={handleFieldLayout('name')}>
          <Text style={styles.fieldLabel}>
            Tên địa điểm <Text style={styles.requiredMark}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onFocus={() => scrollToField('name')}
            placeholder="Ví dụ: Bệnh viện Thú y PetCare, Cà phê Mèo..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>

        {/* Danh mục */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Danh mục địa điểm <Text style={styles.requiredMark}>*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORY_KEYS.map((catKey) => {
              const meta = PLACE_CATEGORIES[catKey];
              const isSelected = selectedType === catKey;
              return (
                <Pressable
                  key={catKey}
                  onPress={() => setSelectedType(catKey)}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: meta.bgColor, borderColor: meta.color },
                  ]}
                >
                  <MaterialIcons
                    name={(meta.icon as any) || 'pets'}
                    size={16}
                    color={isSelected ? meta.color : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && { color: meta.color, fontWeight: '800' },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Địa chỉ */}
        <View style={styles.fieldGroup} onLayout={handleFieldLayout('address')}>
          <Text style={styles.fieldLabel}>
            Địa chỉ cụ thể <Text style={styles.requiredMark}>*</Text>
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            onFocus={() => scrollToField('address')}
            placeholder="Số nhà, tên đường, phường, quận, thành phố..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
        </View>

        {/* Vị trí trên bản đồ */}
        <View style={styles.fieldGroup}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.fieldLabel}>
              Vị trí tọa độ GPS <Text style={styles.requiredMark}>*</Text>
            </Text>
            <Pressable
              onPress={handleUseCurrentGps}
              disabled={loadingGps}
              style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.8 }]}
            >
              {loadingGps ? (
                <ActivityIndicator size="small" color="#00220F" />
              ) : (
                <>
                  <MaterialIcons name="my-location" size={14} color="#00220F" />
                  <Text style={styles.gpsBtnText}>Lấy GPS hiện tại</Text>
                </>
              )}
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            Chạm trên bản đồ bên dưới để điều chỉnh vị trí chính xác:
          </Text>

          <View style={styles.miniMapWrap}>
            <SafeMapView
              ref={mapRef}
              height={180}
              initialCenter={{ latitude, longitude }}
              initialZoom={15}
              onMapPress={handleMapPress}
            >
              <Marker
                id="selected-position"
                lngLat={[longitude, latitude]}
                anchor="bottom"
              >
                <MaterialIcons name="location-pin" size={36} color="#E11D48" />
              </Marker>
            </SafeMapView>
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsText}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        </View>

        {/* Số điện thoại & Website */}
        <View style={styles.rowTwoFields} onLayout={handleFieldLayout('phoneWeb')}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Số hotline</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              onFocus={() => scrollToField('phoneWeb')}
              placeholder="0901234567"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Website</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              onFocus={() => scrollToField('phoneWeb')}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="url"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Mô tả */}
        <View style={styles.fieldGroup} onLayout={handleFieldLayout('description')}>
          <Text style={styles.fieldLabel}>Mô tả / Dịch vụ cung cấp</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onFocus={() => scrollToField('description', 30)}
            placeholder="Thông tin thêm về dịch vụ, tiện ích cho thú cưng..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
          />
        </View>

        {/* Error Notice */}
        {error && <Text style={styles.errorBanner}>{error}</Text>}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.88 },
            submitting && { opacity: 0.6 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi địa điểm kiểm duyệt 🚀</Text>
          )}
        </Pressable>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  imagePickerWrap: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  requiredMark: {
    color: '#EF4444',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -2,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00220F',
  },
  miniMapWrap: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    position: 'relative',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackMiniMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackMiniMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00220F',
  },
  coordsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 34, 15, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coordsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  rowTwoFields: {
    flexDirection: 'row',
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    padding: 12,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#00220F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#00220F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
