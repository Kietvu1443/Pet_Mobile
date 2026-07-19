// Phân giải URL ảnh (A4).
//
// Backend trả về ảnh ở hai dạng:
//   - URL tuyệt đối Cloudinary (production): https://res.cloudinary.com/...
//   - Đường dẫn tương đối (development): /images/pets/1/abc.jpg, /images/the_logo.webp
//
// expo-image cần URL tuyệt đối, nên đường dẫn tương đối phải được ghép với
// API_ORIGIN. Hàm này là điểm phân giải duy nhất, dùng lại ở mọi nơi hiển thị ảnh.
import { API_ORIGIN } from '../api/config';

export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // Đã là URL tuyệt đối (http/https) hoặc data URI -> giữ nguyên.
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Đường dẫn tương đối -> ghép với origin của API.
  const suffix = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${suffix}`;
}
