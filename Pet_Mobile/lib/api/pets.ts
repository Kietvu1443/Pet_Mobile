// API Client cho Thú cưng nhận nuôi (Pets Adoption Catalog & Detail).
import { apiRequest } from './client';

export type PetImage = {
  id: number;
  pet_id: number;
  image_path: string;
  display_order: number;
  cloudinary_id?: string | null;
};

export type PetItem = {
  id: number;
  name: string;
  pet_type: string;
  status: 'available' | 'adopted';
  breed?: string | null;
  age?: string | null;
  gender?: string | null;
  color?: string | null;
  weight?: string | null;
  pet_code?: string | null;
  vaccination?: string | null;
  image_url?: string | null;
  avatar_image?: string | null;
  contact_info?: string | null;
  source_url?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  images?: PetImage[];
  likesCount?: number;
  isLiked?: boolean;
};

export type PetsListResponse = {
  pets: PetItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PetDetailResponse = {
  pet: PetItem;
};

export type LikePetResponse = {
  petId: number;
  isLiked: boolean;
  totalLikes: number;
};

export type FetchPetsParams = {
  status?: 'available' | 'adopted';
  species?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

// GET /api/v1/pets
export async function fetchPets(params: FetchPetsParams = {}): Promise<PetsListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.species && params.species !== 'all') query.set('species', params.species);
  if (params.search && params.search.trim()) query.set('search', params.search.trim());
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  const path = qs ? `/pets?${qs}` : '/pets';
  return apiRequest<PetsListResponse>(path, {
    auth: false,
    signal: params.signal,
  });
}

// GET /api/v1/pets/:id
export async function fetchPetDetail(id: number, signal?: AbortSignal): Promise<PetItem> {
  const data = await apiRequest<PetDetailResponse>(`/pets/${id}`, {
    auth: true, // Gửi token nếu có để backend tính isLiked
    signal,
  });
  return data.pet;
}

// POST /api/v1/pets/:id/like
export async function likePet(id: number): Promise<LikePetResponse> {
  return apiRequest<LikePetResponse>(`/pets/${id}/like`, {
    method: 'POST',
    auth: true,
  });
}
