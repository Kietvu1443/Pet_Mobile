// API Client cho Public Pet Share & QR Resolution
import { apiRequest } from './client';

export type PublicPet = {
  token: string;
  canonicalUrl: string;
  category: 'user_pet' | 'shelter_pet';
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string | null;
  age?: string;
  color?: string;
  weight?: number | string | null;
  vaccinated?: boolean;
  description?: string;
  traits?: string[];
  pet_code?: string;
  status?: string;
  image_url?: string | null;
  images?: Array<{ id: number; image_path: string }>;
};

export type QrShareData = {
  token: string;
  canonicalUrl: string;
  pet: {
    id: number;
    name: string;
    species?: string;
    breed?: string;
    pet_code?: string;
    image_url?: string | null;
  };
};

type PublicPetResponse = {
  pet: PublicPet;
};

// GET /api/v1/pets/public/:token
export async function resolvePublicPet(token: string, signal?: AbortSignal): Promise<PublicPet> {
  const data = await apiRequest<PublicPetResponse>(`/pets/public/${encodeURIComponent(token)}`, { signal });
  return data.pet;
}

// GET /api/v1/user-pets/:id/share-qr
export async function fetchUserPetQrShare(id: number, signal?: AbortSignal): Promise<QrShareData> {
  return apiRequest<QrShareData>(`/user-pets/${id}/share-qr`, { signal });
}

// GET /api/v1/pets/:id/share-qr
export async function fetchShelterPetQrShare(id: number, signal?: AbortSignal): Promise<QrShareData> {
  return apiRequest<QrShareData>(`/pets/${id}/share-qr`, { signal });
}
