// API Client cho Thú cưng cá nhân (User Pets).
// Tách biệt hoàn toàn với hệ thống Pet nhận nuôi.
import { apiRequest } from './client';

export type UserPetImage = {
  id: number;
  user_pet_id: number;
  image_path: string;
  display_order: number;
  cloudinary_id?: string | null;
  created_at?: string;
};

export type UserPet = {
  id: number;
  user_id: number;
  name: string;
  species: 'cat' | 'dog' | 'other' | string;
  breed?: string | null;
  gender?: 'male' | 'female' | string | null;
  birth_date?: string | null; // ISO YYYY-MM-DD
  color?: string | null;
  weight?: number | string | null;
  vaccinated: number | boolean;
  description?: string | null;
  traits?: string[] | null;
  image_url?: string | null;
  images?: UserPetImage[];
  created_at?: string;
  updated_at?: string;
};

type MyPetsResponse = {
  pets: UserPet[];
  total: number;
};

type SinglePetResponse = {
  pet: UserPet;
};

// Tính tuổi thân thiện từ birth_date chuẩn
export function formatAgeFromBirthDate(birthDate?: string | null): string {
  if (!birthDate) return 'Chưa rõ tuổi';
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Chưa rõ tuổi';
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 0 ? 'Mới sinh' : `${Math.max(1, days)} ngày`;
    }

    if (years === 0) {
      return `${months} tháng`;
    }

    if (months === 0) {
      return `${years} tuổi`;
    }

    return `${years} tuổi ${months} tháng`;
  } catch {
    return 'Chưa rõ tuổi';
  }
}

// GET /api/v1/user-pets/my
export async function fetchMyPets(signal?: AbortSignal): Promise<UserPet[]> {
  const data = await apiRequest<MyPetsResponse>('/user-pets/my', { signal });
  return data.pets || [];
}

// GET /api/v1/user-pets/:id
export async function fetchUserPetDetail(id: number, signal?: AbortSignal): Promise<UserPet> {
  const data = await apiRequest<SinglePetResponse>(`/user-pets/${id}`, { signal });
  return data.pet;
}

// POST /api/v1/user-pets (Gửi FormData gồm fields và files images)
export async function createUserPet(formData: FormData): Promise<UserPet> {
  const data = await apiRequest<SinglePetResponse>('/user-pets', {
    method: 'POST',
    body: formData,
  });
  return data.pet;
}

// PATCH /api/v1/user-pets/:id
export async function updateUserPet(id: number, data: FormData | Record<string, unknown>): Promise<UserPet> {
  const res = await apiRequest<SinglePetResponse>(`/user-pets/${id}`, {
    method: 'PATCH',
    body: data,
  });
  return res.pet;
}

// DELETE /api/v1/user-pets/:id
export async function deleteUserPet(id: number): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/user-pets/${id}`, {
    method: 'DELETE',
  });
}
