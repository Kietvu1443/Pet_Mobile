// API Client & Helper cho Địa điểm cộng đồng (Community Places / Khám phá gần bạn)
import { Linking, Platform } from 'react-native';
import { apiRequest } from './client';

export type PlaceType =
  | 'shelter'
  | 'veterinary'
  | 'grooming'
  | 'pet_shop'
  | 'pet_cafe'
  | 'park'
  | 'meetup'
  | 'other';

export type Place = {
  id: number;
  name: string;
  type: PlaceType;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  image_url?: string | null;
  rating_avg: number;
  review_count: number;
  shelter_id?: number | null;
  created_by?: number;
  creator_name?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  distance_km?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PlaceReview = {
  id: number;
  place_id: number;
  user_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at?: string;
  display_name?: string;
  username?: string;
  avatar?: string | null;
};

export type NearbyPlacesParams = {
  lat: number;
  lng: number;
  radius?: number; // km (mặc định 10)
  type?: PlaceType | string;
  limit?: number;
};

export type PlaceCategoryMeta = {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
};

export const PLACE_CATEGORIES: Record<PlaceType, PlaceCategoryMeta> = {
  shelter: { label: 'Trại cứu hộ', icon: 'home', color: '#FF4FA3', bgColor: '#FFF0F7' },
  veterinary: { label: 'Thú y 24/7', icon: 'medical-services', color: '#007AFF', bgColor: '#EFF6FF' },
  grooming: { label: 'Spa Grooming', icon: 'content-cut', color: '#8B5CF6', bgColor: '#F5F3FF' },
  pet_shop: { label: 'Pet Shop', icon: 'shopping-bag', color: '#F59E0B', bgColor: '#FFFBEB' },
  pet_cafe: { label: 'Cafe thú cưng', icon: 'local-cafe', color: '#8D6E63', bgColor: '#EFEBE9' },
  park: { label: 'Công viên', icon: 'park', color: '#10B981', bgColor: '#ECFDF5' },
  meetup: { label: 'Điểm hẹn offline', icon: 'groups', color: '#EC4899', bgColor: '#FDF2F8' },
  other: { label: 'Địa điểm khác', icon: 'pets', color: '#6B7280', bgColor: '#F3F4F6' },
};

/**
 * Lấy danh sách địa điểm gần tọa độ GPS
 */
export async function fetchNearbyPlaces(params: NearbyPlacesParams): Promise<Place[]> {
  const query = new URLSearchParams();
  query.append('lat', String(params.lat));
  query.append('lng', String(params.lng));
  if (params.radius) query.append('radius', String(params.radius));
  if (params.type && params.type !== 'all') query.append('type', params.type);
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiRequest<{ places: Place[] }>(`/places/nearby?${query.toString()}`);
  return res.places || [];
}

/**
 * Lấy chi tiết 1 địa điểm
 */
export async function fetchPlaceDetail(id: number | string): Promise<{ place: Place; my_review: PlaceReview | null }> {
  return apiRequest<{ place: Place; my_review: PlaceReview | null }>(`/places/${id}`);
}

/**
 * Tạo địa điểm cộng đồng mới (Multipart FormData)
 */
export async function createPlace(formData: FormData): Promise<{ place: Place }> {
  return apiRequest<{ place: Place }>('/places', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Cập nhật địa điểm
 */
export async function updatePlace(id: number | string, formData: FormData): Promise<{ place: Place }> {
  return apiRequest<{ place: Place }>(`/places/${id}`, {
    method: 'PATCH',
    body: formData,
  });
}

/**
 * Xóa địa điểm
 */
export async function deletePlace(id: number | string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/places/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Lấy danh sách đánh giá của địa điểm
 */
export async function fetchPlaceReviews(
  placeId: number | string,
  page = 1,
  limit = 20
): Promise<{ reviews: PlaceReview[]; total: number; totalPages: number }> {
  return apiRequest<{ reviews: PlaceReview[]; total: number; totalPages: number }>(
    `/places/${placeId}/reviews?page=${page}&limit=${limit}`
  );
}

/**
 * Gửi đánh giá cho địa điểm (1-5 sao + comment)
 */
export async function submitPlaceReview(
  placeId: number | string,
  payload: { rating: number; comment?: string }
): Promise<{ review: PlaceReview; rating_avg: number; review_count: number }> {
  return apiRequest<{ review: PlaceReview; rating_avg: number; review_count: number }>(
    `/places/${placeId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Xóa đánh giá của chính mình
 */
export async function deletePlaceReview(placeId: number | string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/places/${placeId}/reviews/my`, {
    method: 'DELETE',
  });
}

/**
 * Báo cáo vi phạm địa điểm hoặc đánh giá
 */
export async function reportPlace(
  placeId: number | string,
  payload: {
    target_type?: 'place' | 'review';
    reason: 'spam' | 'incorrect_info' | 'place_not_exist' | 'wrong_location' | 'inappropriate' | 'other';
    description?: string;
  }
): Promise<{ report: any }> {
  return apiRequest<{ report: any }>(`/places/${placeId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Helper mở ứng dụng bản đồ bên ngoài để chỉ đường (Apple Maps trên iOS, Google Maps trên Android)
 * Chi phí: 0 đồng (Không tốn API key hay billing)
 */
export function openDirectionsInMaps(latitude: number, longitude: number, label?: string) {
  const cleanLabel = encodeURIComponent(label || 'Địa điểm thú cưng');
  const latLng = `${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    // Apple Maps URL scheme
    const url = `http://maps.apple.com/?daddr=${latLng}&q=${cleanLabel}&dirflg=d`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback sang Google Maps trên trình duyệt
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
      }
    });
  } else {
    // Google Maps Intent / Universal link trên Android
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${cleanLabel}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`geo:${latLng}?q=${latLng}(${cleanLabel})`);
    });
  }
}
