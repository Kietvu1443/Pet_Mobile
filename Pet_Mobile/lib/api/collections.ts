import { apiRequest } from './client';
import type { RawFavorite } from './favorites';

export type RawCollection = {
  id: number;
  name: string;
  emoji: string;
  created_at?: string;
  pet_count?: number;
  preview_image?: string | null;
};

export type MyCollectionsResponse = {
  collections: RawCollection[];
  total: number;
};

export function fetchMyCollections(signal?: AbortSignal): Promise<MyCollectionsResponse> {
  return apiRequest<MyCollectionsResponse>('/collections/my', { signal });
}

export function createCollection(
  name: string,
  emoji: string = '📁',
): Promise<{ collection: RawCollection }> {
  return apiRequest<{ collection: RawCollection }>('/collections', {
    method: 'POST',
    body: { name, emoji },
  });
}

export function deleteCollection(id: number): Promise<{ collectionId: number }> {
  return apiRequest<{ collectionId: number }>(`/collections/${id}`, {
    method: 'DELETE',
  });
}

export function addPetToCollection(
  collectionId: number,
  petId: number,
): Promise<{ collectionId: number; petId: number }> {
  return apiRequest<{ collectionId: number; petId: number }>(`/collections/${collectionId}/pets`, {
    method: 'POST',
    body: { petId },
  });
}

export function removePetFromCollection(
  collectionId: number,
  petId: number,
): Promise<{ collectionId: number; petId: number }> {
  return apiRequest<{ collectionId: number; petId: number }>(
    `/collections/${collectionId}/pets/${petId}`,
    {
      method: 'DELETE',
    },
  );
}

export function fetchCollectionPets(
  collectionId: number,
  signal?: AbortSignal,
): Promise<{ favorites: RawFavorite[]; total: number }> {
  return apiRequest<{ favorites: RawFavorite[]; total: number }>(
    `/collections/${collectionId}/pets`,
    { signal },
  );
}

export function fetchPetCollections(
  petId: number,
  signal?: AbortSignal,
): Promise<{ collectionIds: number[] }> {
  return apiRequest<{ collectionIds: number[] }>(`/collections/pet/${petId}`, { signal });
}
