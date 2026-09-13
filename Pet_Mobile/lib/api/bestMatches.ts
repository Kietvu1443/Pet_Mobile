import { apiRequest } from './client';

export type BestMatchSummary = {
  id: number;
  user_id?: number;
  pet_id: number;
  adoption_request_id?: number;
  status: 'active' | 'cancelled' | string;
  started_at: string;
  cancelled_at?: string | null;
  story_count?: number;
  evidence_count?: number;
  last_story_at?: string | null;
  last_activity_at?: string | null;
  pet_name: string;
  pet_type?: string | null;
  pet_avatar?: string | null;
  show_ring_badge?: boolean;
};

export type BestMatchStoryMedia = {
  id: number;
  story_id: number;
  media_type: 'image' | 'video' | string;
  media_path: string;
  cloudinary_id?: string | null;
  caption?: string | null;
  display_order?: number;
};

export type BestMatchStory = {
  id: number;
  best_match_id: number;
  author_user_id: number;
  title?: string | null;
  content: string;
  story_date?: string | null;
  visibility: 'private' | 'connections' | 'public' | string;
  status?: 'active' | 'deleted' | string;
  created_at: string;
  updated_at?: string | null;
  media: BestMatchStoryMedia[];
};

export type BestMatchPrivacy = {
  profile_visibility: 'private' | 'connections' | 'public' | string;
  show_duration: boolean;
  show_stories: boolean;
  show_media: boolean;
  show_ring_badge: boolean;
};

export type BestMatchPet = {
  id: number;
  name: string;
  pet_type?: string | null;
  breed?: string | null;
  gender?: string | null;
  age?: number | string | null;
  avatar?: string | null;
};

export type BestMatchAssessment = {
  level: 'early' | 'growing' | 'established' | 'long_term' | string;
  explanation?: string | null;
  factors?: Record<string, unknown> | null;
  assessed_at?: string | null;
  model_version?: string | null;
};

export type BestMatchProfile = {
  id: number;
  status: 'active' | 'cancelled' | string;
  started_at: string;
  cancelled_at?: string | null;
  duration_days: number;
  story_count?: number;
  evidence_count?: number;
  pet: BestMatchPet;
  privacy?: BestMatchPrivacy;
};

export type BestMatchProfileResponse = {
  bestMatch: BestMatchProfile;
  stories: BestMatchStory[];
  evidence?: Array<Record<string, unknown>>;
  assessment?: BestMatchAssessment | null;
  is_owner: boolean;
};

export type BestMatchesListResponse = {
  bestMatches?: BestMatchSummary[];
};

export type CreateBestMatchStoryInput = {
  bestMatchId: number;
  title?: string;
  content: string;
  storyDate?: string | null;
  visibility?: 'private' | 'connections' | 'public';
  media?: Array<{
    uri: string;
    name?: string;
    type?: string;
  }>;
};

export type UpdateBestMatchStoryInput = {
  bestMatchId: number;
  storyId: number;
  title?: string | null;
  content?: string;
  storyDate?: string | null;
  visibility?: 'private' | 'connections' | 'public';
};

export type BestMatchPrivacyUpdate = Partial<BestMatchPrivacy>;

function normalizeId(value: number | string): number {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Best Match ID không hợp lệ');
  }
  return id;
}

/** Fetch all active Best Match journeys owned by the current user. */
export async function fetchMyBestMatches(): Promise<BestMatchSummary[]> {
  const data = await apiRequest<BestMatchesListResponse>('/best-matches');
  return Array.isArray(data?.bestMatches) ? data.bestMatches : [];
}

/** Fetch a complete Best Match journey profile. */
export async function fetchBestMatchProfile(
  bestMatchId: number | string,
): Promise<BestMatchProfileResponse> {
  return apiRequest<BestMatchProfileResponse>(`/best-matches/${normalizeId(bestMatchId)}`);
}

/** Fetch stories directly when a screen needs a story-only refresh. */
export async function fetchBestMatchStories(
  bestMatchId: number | string,
): Promise<BestMatchStory[]> {
  const data = await apiRequest<{ stories?: BestMatchStory[] }>(
    `/best-matches/${normalizeId(bestMatchId)}/stories`,
  );
  return Array.isArray(data?.stories) ? data.stories : [];
}

/** Create a story, optionally uploading image/video media. */
export async function createBestMatchStory(
  input: CreateBestMatchStoryInput,
): Promise<BestMatchStory> {
  const bestMatchId = normalizeId(input.bestMatchId);
  const form = new FormData();

  if (input.title !== undefined) form.append('title', input.title);
  form.append('content', input.content);
  if (input.storyDate) form.append('story_date', input.storyDate);
  if (input.visibility) form.append('visibility', input.visibility);

  for (let i = 0; i < (input.media ?? []).length; i += 1) {
    const asset = input.media![i];
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const filename = asset.name || `best-match-${Date.now()}-${i}`;
    const mimeType = asset.type || blob.type || 'application/octet-stream';
    form.append('media', blob, filename);
    // Keep the MIME decision explicit for browser/native fetch implementations.
    void mimeType;
  }

  const data = await apiRequest<{ story?: BestMatchStory }>(
    `/best-matches/${bestMatchId}/stories`,
    { method: 'POST', body: form },
  );

  if (!data?.story) {
    throw new Error('Backend không trả về câu chuyện vừa tạo');
  }
  return data.story;
}

/** Update text/date/privacy only. Media replacement is intentionally not implicit. */
export async function updateBestMatchStory(
  input: UpdateBestMatchStoryInput,
): Promise<BestMatchStory> {
  const bestMatchId = normalizeId(input.bestMatchId);
  const storyId = normalizeId(input.storyId);

  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.content !== undefined) body.content = input.content;
  if (input.storyDate !== undefined) body.story_date = input.storyDate;
  if (input.visibility !== undefined) body.visibility = input.visibility;

  const data = await apiRequest<{ story?: BestMatchStory }>(
    `/best-matches/${bestMatchId}/stories/${storyId}`,
    { method: 'PUT', body },
  );

  if (!data?.story) {
    throw new Error('Backend không trả về câu chuyện sau khi cập nhật');
  }
  return data.story;
}

/** Soft-delete a story. Backend removes derived evidence and decrements cached counts. */
export async function deleteBestMatchStory(
  bestMatchId: number | string,
  storyId: number | string,
): Promise<{ id: number; deleted: boolean }> {
  const data = await apiRequest<{ id: number; deleted: boolean }>(
    `/best-matches/${normalizeId(bestMatchId)}/stories/${normalizeId(storyId)}`,
    { method: 'DELETE' },
  );
  return data;
}

export async function fetchBestMatchPrivacy(
  bestMatchId: number | string,
): Promise<BestMatchPrivacy> {
  const data = await apiRequest<{ settings?: BestMatchPrivacy }>(
    `/best-matches/${normalizeId(bestMatchId)}/privacy`,
  );
  if (!data?.settings) throw new Error('Backend không trả về cài đặt riêng tư');
  return data.settings;
}

export async function updateBestMatchPrivacy(
  bestMatchId: number | string,
  fields: BestMatchPrivacyUpdate,
): Promise<BestMatchPrivacy> {
  const data = await apiRequest<{ settings?: BestMatchPrivacy }>(
    `/best-matches/${normalizeId(bestMatchId)}/privacy`,
    { method: 'PUT', body: fields },
  );
  if (!data?.settings) throw new Error('Backend không trả về cài đặt riêng tư');
  return data.settings;
}

export async function cancelBestMatch(
  bestMatchId: number | string,
  reason?: string,
): Promise<BestMatchSummary | Record<string, unknown>> {
  const data = await apiRequest<{ bestMatch?: BestMatchSummary | Record<string, unknown> }>(
    `/best-matches/${normalizeId(bestMatchId)}/cancel`,
    {
      method: 'POST',
      body: reason ? { reason } : {},
    },
  );
  return data?.bestMatch ?? {};
}

export function formatJourneyDuration(daysInput: number | string | null | undefined): string {
  const days = Math.max(0, Math.floor(Number(daysInput) || 0));
  if (days < 1) return 'hôm nay';
  if (days < 7) return `${days} ngày`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
    return remainder ? `${weeks} tuần ${remainder} ngày` : `${weeks} tuần`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainder = days % 30;
    return remainder ? `${months} tháng ${remainder} ngày` : `${months} tháng`;
  }
  const years = Math.floor(days / 365);
  const remainder = days % 365;
  const months = Math.floor(remainder / 30);
  if (months) return `${years} năm ${months} tháng`;
  return `${years} năm`;
}

export function formatJourneyStartDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatJourneyStageLabel(level: string | null | undefined): string {
  switch (level) {
    case 'early':
      return 'Hành trình mới bắt đầu';
    case 'growing':
      return 'Đang lớn dần theo thời gian';
    case 'established':
      return 'Đã trở thành một hành trình ổn định';
    case 'long_term':
      return 'Đã đi cùng nhau trong một chặng đường dài';
    default:
      return 'Hành trình của hai bạn';
  }
}
