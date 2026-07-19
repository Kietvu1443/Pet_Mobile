// Lệnh gọi API PetSnap (tính năng chủ lực).
//
// LỚP NÀY CHỈ NÓI CHUYỆN VỚI BACKEND — trả về DTO thô (snake_case) đúng như
// backend gửi. KHÔNG ánh xạ field ở đây. Mọi việc chuẩn hoá sang model mobile
// nằm trong lib/snap/adapter.ts (ranh giới ánh xạ duy nhất).
//
// Hợp đồng backend (controller/petSnapApiV1Controller.js):
//   GET  /pet-snap            -> { pet, hasMore }  (1 thú cưng/lần, ngẫu nhiên, chưa tương tác)
//   POST /pet-snap/:id/like   -> { pet, hasMore }  (lưu "liked"  rồi trả thú cưng KẾ TIẾP)
//   POST /pet-snap/:id/dislike-> { pet, hasMore }  (lưu "passed" rồi trả thú cưng KẾ TIẾP)
//
// Payload thực tế (đã chụp từ backend live, xem báo cáo Phase 2):
//   images[] mang thêm created_at, cloudinary_id, report_id ngoài 4 field tối thiểu;
//   weight/age là CHUỖI ("7", "Nhí"); description có thể là "".
import { apiRequest } from './client';

// Một dòng pet_images đúng như backend đính kèm qua attachImagesToPets (SELECT *).
export type RawPetImage = {
  id: number;
  pet_id: number;
  image_path: string;
  display_order: number;
  created_at?: string | null;
  cloudinary_id?: string | null;
  report_id?: number | null;
};

// Thú cưng thô từ normalizePet ở backend (snake_case, mọi field có thể null/chuỗi).
export type RawPet = {
  id: number;
  name: string;
  pet_type?: string | null;
  breed?: string | null;
  age?: string | null; // CHUỖI tự do ("Nhí", "Thanh niên") — không phải số
  gender?: string | null;
  color?: string | null;
  weight?: string | null; // CHUỖI ("7", "20")
  status?: string | null;
  pet_code?: string | null;
  description?: string | null; // có thể là ""
  image: string; // avatar (URL tuyệt đối Cloudinary ở prod, hoặc đường dẫn tương đối ở dev)
  images: RawPetImage[];
};

// Bao response của cả 3 endpoint PetSnap.
export type RawPetSnapBundle = {
  pet: RawPet | null;
  hasMore: boolean;
};

export function fetchNextPet(signal?: AbortSignal): Promise<RawPetSnapBundle> {
  return apiRequest<RawPetSnapBundle>('/pet-snap', { signal });
}

export function postLike(petId: number): Promise<RawPetSnapBundle> {
  return apiRequest<RawPetSnapBundle>(`/pet-snap/${petId}/like`, { method: 'POST' });
}

export function postDislike(petId: number): Promise<RawPetSnapBundle> {
  return apiRequest<RawPetSnapBundle>(`/pet-snap/${petId}/dislike`, { method: 'POST' });
}
