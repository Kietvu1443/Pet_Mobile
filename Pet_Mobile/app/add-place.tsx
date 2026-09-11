import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPlace, PlaceType, PLACE_CATEGORIES } from '../lib/api/places';
import { SafeMapView, Marker } from '../components/map/SafeMapView';
import {
  safeRequestLocationPermission,
  safeGetCurrentPosition,
  safeReverseGeocode,
  DEFAULT_HCMC_COORDS,
} from '../lib/location/safeLocation';

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

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<PlaceType>('other');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(DEFAULT_HCMC_COORDS.latitude);
  const [longitude, setLongitude] = useState<number>(DEFAULT_HCMC_COORDS.longitude);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentGps();
  }, []);

  const fetchCurrentGps = async () => {
    try {
      setLoadingGps(true);
      const perm = await safeRequestLocationPermission();
      if (perm.granted) {
        const coords = await safeGetCurrentPosition();
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);

          // Reverse geocoding để gợi ý địa chỉ tự động nếu chưa có
          try {
            const geoAddress = await safeReverseGeocode(coords);
            if (geoAddress && !address) {
              setAddress(geoAddress);
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.log('[AddPlace] Location error:', e);
    } finally {
      setLoadingGps(false);
    }
  };

  const handlePickImage = async () => {
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

  const handleMapPress = (coordsOrEvent: any) => {
    if (coordsOrEvent?.latitude && coordsOrEvent?.longitude) {
      setLatitude(coordsOrEvent.latitude);
      setLongitude(coordsOrEvent.longitude);
      return;
    }
    const coords = coordsOrEvent?.nativeEvent?.coordinate;
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    }
  };

  const handleSubmit = async () => {
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

      Alert.alert(
        'Đã gửi địa điểm! ⏳',
        'Địa điểm của bạn đã được gửi thành công và đang chờ ban quản trị kiểm duyệt trước khi hiển thị trên bản đồ công khai.',
        [
          {
            text: 'Đồng ý',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi khi tạo địa điểm. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Tên địa điểm <Text style={styles.requiredMark}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
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
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Địa chỉ cụ thể <Text style={styles.requiredMark}>*</Text>
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
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
              onPress={fetchCurrentGps}
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
              height={180}
              initialCenter={{ latitude, longitude }}
              initialZoom={14}
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
        <View style={styles.rowTwoFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Số hotline</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
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
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Mô tả */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mô tả / Dịch vụ cung cấp</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
