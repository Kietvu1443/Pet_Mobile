// Mock Adapter — bộ giữ chỗ tập trung cho dữ liệu chưa có backend support.
//
// QUY TẮC:
// - Mọi giá trị mock PHẢI nằm ở đây, KHÔNG được hardcode trong UI component.
// - Mỗi hàm/giá trị phải có comment TODO chỉ rõ field/API backend sẽ thay thế sau.
// - UI chỉ import từ file này, không biết dữ liệu đến từ mock hay backend.

// ---------------------------------------------------------------------------
// Computed UI values (presentation-only, NOT business data)
// ---------------------------------------------------------------------------

/** Lấy danh sách traits hiển thị dựa trên loài/giống của pet.
 * TODO: Thay bằng trường `pets.traits` JSON nếu backend hỗ trợ trong tương lai.
 */
export function getMockTraits(petType: string | null, breed: string | null): string[] {
  const type = (petType ?? '').toLowerCase();
  const b = (breed ?? '').toLowerCase();

  if (type === 'dog' || b.includes('chó') || b.includes('dog')) {
    return ['Năng động', 'Thân thiện', 'Thông minh'];
  }
  if (type === 'cat' || b.includes('mèo') || b.includes('cat')) {
    return ['Hiền lành', 'Sạch sẽ', 'Quấn người'];
  }
  return ['Hiền lành', 'Thân thiện'];
}

/** Tính verified badge dựa trên pet_code (code HPA trại cứu hộ).
 * TODO: Thay bằng trường `pets.verified` boolean nếu backend hỗ trợ trong tương lai.
 */
export function computeVerified(petCode: string | null): boolean {
  return petCode !== null && petCode.trim().length > 0;
}

/** Trích xuất vị trí từ contact_info (text tự do).
 * TODO: Thay bằng trường `pets.location` nếu backend thêm sau.
 */
export function extractLocation(contactInfo: string | null | undefined): string {
  if (!contactInfo) return 'TP. Hồ Chí Minh';
  // Lấy dòng đầu tiên hoặc 40 ký tự đầu
  const line = contactInfo.split('\n')[0].trim();
  return line.length > 0 ? line.slice(0, 50) : 'TP. Hồ Chí Minh';
}

// ---------------------------------------------------------------------------
// Profile stats — computed/mock (không phải business data)
// ---------------------------------------------------------------------------

/** Trả về số lần quét QR.
 * TODO: Thay bằng endpoint đếm scan của backend nếu hỗ trợ.
 */
export function getMockScanCount(): number {
  return 1;
}

/** Trả về số match — luôn 0 vì backend chưa có logic matching.
 * TODO: Thay bằng endpoint /adoption-requests khi trại duyệt.
 */
export function getMockMatchCount(): number {
  return 0;
}

// ---------------------------------------------------------------------------
// My Pets — placeholder vì backend chưa có endpoint "thú cưng của tôi"
// ---------------------------------------------------------------------------

export type MockOwnPet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  image: string; // TODO: Thay bằng URL backend khi /api/v1/pets/my tồn tại
  gender: string;
  weight: string;
  color: string;
  vaccinated: boolean;
};

/** Danh sách thú cưng của user hiện tại — placeholder.
 * TODO: Thay bằng GET /api/v1/pets/my khi backend hỗ trợ "my pets".
 */
export function getMockOwnPets(): MockOwnPet[] {
  return [
    {
      id: 'p1',
      name: 'Kikiki',
      breed: 'Bichon Frisé',
      age: '3 tuổi',
      // TODO: Thay bằng ảnh upload từ backend
      image: 'https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?w=800',
      gender: 'Cái',
      weight: '4.2 kg',
      color: 'Trắng',
      vaccinated: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Nearby shelters — mock static (không có backend shelter listing)
// ---------------------------------------------------------------------------

export type MockShelter = {
  name: string;
  pets: number;
  image: string; // TODO: Thay bằng URL ảnh từ backend shelter API
  dist: string;  // TODO: Thay bằng distance tính từ GPS người dùng
};

/** Danh sách trại gần bạn — placeholder.
 * TODO: Thay bằng GET /api/v1/shelters?lat=&lng= khi backend hỗ trợ.
 */
export function getMockNearbyShelters(): MockShelter[] {
  return [
    {
      name: 'Trại Bình Thới',
      pets: 24,
      image: 'https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=400',
      dist: '1.2 km',
    },
    {
      name: 'Trại Q.9',
      pets: 18,
      image: 'https://images.unsplash.com/photo-1606391276068-d82696ac76bc?w=400',
      dist: '2.5 km',
    },
    {
      name: 'HCA Shelter',
      pets: 41,
      image: 'https://images.unsplash.com/photo-1610112645245-36020fc0e128?w=400',
      dist: '3.8 km',
    },
  ];
}

// ---------------------------------------------------------------------------
// Health data for PetDetailScreen — mock (backend không có bảng health)
// ---------------------------------------------------------------------------

export type MockHealthItem = {
  label: string;
  value: string;
  ok: boolean;
};

/** Thông tin sức khỏe thú cưng — placeholder.
 * TODO: Thay bằng GET /api/v1/pets/:id/health khi backend hỗ trợ.
 */
export function getMockHealthItems(): MockHealthItem[] {
  return [
    { label: 'Tiêm phòng', value: 'Đã tiêm đủ mũi', ok: true },
    { label: 'Triệt sản', value: 'Chưa triệt sản', ok: false },
    { label: 'Chip định vị', value: 'Đã gắn chip', ok: true },
    { label: 'Khám sức khỏe', value: '06/2026', ok: true },
  ];
}

/** Tên trại cứu hộ — suy ra từ pet_code (heuristic).
 * TODO: Thay bằng shelter join nếu backend thêm pets.shelter_id.
 */
export function getMockShelterName(petCode: string | null): string | null {
  if (!petCode) return null;
  return 'Trại cứu hộ';
}

// ---------------------------------------------------------------------------
// Personal info fields not supported by backend users table
// ---------------------------------------------------------------------------

/** Số điện thoại — backend users table chưa có cột phone.
 * TODO: Thay bằng GET /auth/me khi backend thêm phone field.
 */
export function getMockPhone(): string {
  return '';
}

/** Ngày sinh — backend users table chưa trả birthday đúng định dạng.
 * TODO: Thay bằng user.birthday từ GET /auth/me.
 */
export function getMockBirthday(): string {
  return '';
}
