import { apiRequest } from './client';

export type RawPetNote = {
  id: number;
  user_id: number;
  pet_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};

export function fetchPetNote(
  petId: number,
  signal?: AbortSignal,
): Promise<{ note: RawPetNote | null }> {
  return apiRequest<{ note: RawPetNote | null }>(`/notes/${petId}`, { signal });
}

export function savePetNote(
  petId: number,
  content: string,
): Promise<{ note: RawPetNote | null }> {
  return apiRequest<{ note: RawPetNote | null }>(`/notes/${petId}`, {
    method: 'PUT',
    body: { content },
  });
}

export function deletePetNote(petId: number): Promise<{ petId: number }> {
  return apiRequest<{ petId: number }>(`/notes/${petId}`, {
    method: 'DELETE',
  });
}
