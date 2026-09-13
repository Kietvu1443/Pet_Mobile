// API Client cho Yêu cầu nhận nuôi (Adoption Requests).
import { apiRequest } from './client';

export type AdoptionRequestStatus = 'pending' | 'approved' | 'rejected';

export type AdoptionRequestItem = {
  id: number;
  pet_id: number;
  message: string;
  status: AdoptionRequestStatus;
  created_at: string;
  reviewed_at?: string | null;
  pet_name: string;
  pet_type: string;
  pet_status: string;
  pet_image?: string | null;
};

export type MyAdoptionRequestsResponse = {
  requests: AdoptionRequestItem[];
};

export type CreateAdoptionRequestPayload = {
  petId: number;
  message: string;
};

export type CreateAdoptionRequestResponse = {
  request: {
    id: number;
    status: AdoptionRequestStatus;
  };
};

// POST /api/v1/adoption-requests
export async function submitAdoptionRequest(
  payload: CreateAdoptionRequestPayload,
): Promise<CreateAdoptionRequestResponse> {
  return apiRequest<CreateAdoptionRequestResponse>('/adoption-requests', {
    method: 'POST',
    body: {
      petId: payload.petId,
      message: payload.message.trim(),
    },
    auth: true,
  });
}

// GET /api/v1/adoption-requests/my
export async function fetchMyAdoptionRequests(
  signal?: AbortSignal,
): Promise<AdoptionRequestItem[]> {
  const data = await apiRequest<MyAdoptionRequestsResponse>('/adoption-requests/my', {
    auth: true,
    signal,
  });
  return data.requests || [];
}
