// Lệnh gọi API Yêu thích (favorites) — nguồn dữ liệu BỀN cho "Đã thích" của PetSnap.
//
// Backend (routes/api/v1/favorites.js, requireApiAuth):
//   GET    /favorites/my          -> { favorites: [...], total }
//   POST   /favorites/:petId      -> thêm
//   DELETE /favorites/:petId      -> xoá
//
// Ở pass này (Phase B) chỉ dùng GET để lấy SỐ LƯỢNG cho badge ở header. Việc ghi
// (like trong PetSnap -> favorites) và danh sách sidebar thuộc Phase E.
import { apiRequest } from './client';

// Một dòng favorite đã chuẩn hoá ở backend (normalizeFavorite). Chỉ khai báo field
// chắc chắn cần ở mobile; phần còn lại bỏ qua cho tới khi dựng sidebar (Phase E).
export type RawFavorite = {
  id: number;
  name?: string | null;
  image?: string | null;
  breed?: string | null;
  age?: string | null;
  gender?: string | null;
  pet_type?: string | null;
  vaccination?: string | null;
  liked_at?: string | null;
  location?: string | null;
};

export type MyFavoritesResponse = {
  favorites: RawFavorite[];
  total: number;
};

export function fetchMyFavorites(signal?: AbortSignal): Promise<MyFavoritesResponse> {
  return apiRequest<MyFavoritesResponse>('/favorites/my', { signal });
}

export function fetchMyPassed(signal?: AbortSignal): Promise<MyFavoritesResponse> {
  return apiRequest<MyFavoritesResponse>('/favorites/passed', { signal });
}

export function fetchMySuperliked(signal?: AbortSignal): Promise<MyFavoritesResponse> {
  return apiRequest<MyFavoritesResponse>('/favorites/superliked', { signal });
}

export function removeFavorite(petId: number): Promise<{ petId: number; isLiked: boolean }> {
  return apiRequest<{ petId: number; isLiked: boolean }>(`/favorites/${petId}`, {
    method: 'DELETE',
  });
}

export function restoreFavorite(petId: number): Promise<{ petId: number; isLiked: boolean }> {
  return apiRequest<{ petId: number; isLiked: boolean }>(`/favorites/${petId}/restore`, {
    method: 'PUT',
  });
}

export function superLikeFavorite(petId: number): Promise<{ petId: number; isLiked: boolean; isSuperliked: boolean }> {
  return apiRequest<{ petId: number; isLiked: boolean; isSuperliked: boolean }>(`/favorites/${petId}/superlike`, {
    method: 'PUT',
  });
}
