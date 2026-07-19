// Lớp adapter PetSnap — RANH GIỚI ÁNH XẠ DUY NHẤT giữa backend và UI.
//
// Mọi field snake_case của backend được dịch sang model mobile camelCase TẠI ĐÂY,
// và CHỈ tại đây. UI/hook không bao giờ chạm vào RawPet/RawPetImage. Nếu backend
// đổi tên field, chỉ cần sửa file này.
//
// Trách nhiệm:
//   - snake_case -> camelCase
//   - Phân giải URL ảnh (resolveImageUrl) cho avatar và toàn bộ gallery NGAY TẠI ĐÂY,
//     để component chỉ việc render (không gọi resolve rải rác).
//   - Dựng gallery sạch: ưu tiên images[] (đã sort display_order ở backend), khử trùng
//     URL, và đảm bảo avatar luôn có mặt kể cả khi images[] rỗng.
//   - Chuẩn hoá "" -> null cho các field mô tả.
import type { RawPet, RawPetImage } from '../api/petSnap';
import { resolveImageUrl } from '../images/resolveUrl';

// Một ảnh đã sẵn sàng để render (URL đã phân giải tuyệt đối).
export type PetPhoto = {
  id: number;
  uri: string; // luôn là URL tuyệt đối dùng được cho expo-image
  order: number;
};

// Model thú cưng dùng trong toàn bộ UI mobile.
export type Pet = {
  id: number;
  name: string;
  type: string | null; // pet_type
  breed: string | null;
  age: string | null; // chuỗi tự do, giữ nguyên ("Nhí", "Thanh niên")
  gender: string | null;
  color: string | null;
  weight: string | null; // chuỗi, giữ nguyên
  status: string | null;
  code: string | null; // pet_code
  description: string | null;
  avatarUri: string | null; // avatar đã phân giải, dùng cho mặt thẻ
  photos: PetPhoto[]; // gallery đã phân giải + khử trùng (>=1 nếu có bất kỳ ảnh nào)
};

// "" hoặc khoảng trắng -> null; còn lại trả chuỗi đã trim.
function emptyToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// Dựng gallery: phân giải từng image_path, bỏ ảnh không phân giải được, khử trùng theo URI.
// Nếu backend không trả images[] (rỗng) nhưng có avatar, dùng avatar làm 1 ảnh.
function buildPhotos(rawImages: RawPetImage[], avatarUri: string | null): PetPhoto[] {
  const photos: PetPhoto[] = [];
  const seen = new Set<string>();

  const list = Array.isArray(rawImages) ? rawImages : [];
  for (const img of list) {
    const uri = resolveImageUrl(img.image_path);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    photos.push({ id: img.id, uri, order: img.display_order ?? photos.length });
  }

  // Đảm bảo avatar luôn nằm trong gallery (kể cả khi images[] rỗng).
  if (avatarUri && !seen.has(avatarUri)) {
    photos.unshift({ id: -1, uri: avatarUri, order: -1 });
  }

  // Sắp theo order (backend đã sort, nhưng đảm bảo lại sau khi chèn avatar).
  return photos.sort((a, b) => a.order - b.order);
}

// Ánh xạ một RawPet -> Pet. Trả null nếu đầu vào null (backend trả pet: null khi hết).
export function adaptPet(raw: RawPet | null | undefined): Pet | null {
  if (!raw) return null;

  const avatarUri = resolveImageUrl(raw.image);

  return {
    id: raw.id,
    name: raw.name,
    type: emptyToNull(raw.pet_type),
    breed: emptyToNull(raw.breed),
    age: emptyToNull(raw.age),
    gender: emptyToNull(raw.gender),
    color: emptyToNull(raw.color),
    weight: emptyToNull(raw.weight),
    status: emptyToNull(raw.status),
    code: emptyToNull(raw.pet_code),
    description: emptyToNull(raw.description),
    avatarUri,
    photos: buildPhotos(raw.images, avatarUri),
  };
}
