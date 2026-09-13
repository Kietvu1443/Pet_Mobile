import { apiRequest } from './client';

export type ReportType = 'lost' | 'found';
export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export type RawReportItem = {
  id: number;
  type: ReportType;
  status?: ReportStatus;
  description?: string | null;
  location?: string | null;
  reporter_name?: string | null;
  phone?: string | null;
  created_at?: string | null;
  image?: string | null;
};

export type ReportsListResponse = {
  data: RawReportItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MyReportsResponse = {
  view: string;
  data: RawReportItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters: {
    status: string | null;
    type: string | null;
  };
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

export type FetchPublicReportsParams = {
  type?: ReportType | null;
  page?: number;
  limit?: number;
};

export async function fetchPublicReports(
  params: FetchPublicReportsParams = {},
  signal?: AbortSignal,
): Promise<ReportsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.type) {
    searchParams.append('type', params.type);
  }
  if (params.page !== undefined) {
    searchParams.append('page', String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.append('limit', String(params.limit));
  }

  const queryString = searchParams.toString();
  const endpoint = `/reports${queryString ? `?${queryString}` : ''}`;

  return apiRequest<ReportsListResponse>(endpoint, {
    method: 'GET',
    auth: false,
    signal,
  });
}

export type FetchMyReportsParams = {
  status?: ReportStatus | null;
  type?: ReportType | null;
  page?: number;
  limit?: number;
};

export async function fetchMyReports(
  params: FetchMyReportsParams = {},
  signal?: AbortSignal,
): Promise<MyReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.append('status', params.status);
  }
  if (params.type) {
    searchParams.append('type', params.type);
  }
  if (params.page !== undefined) {
    searchParams.append('page', String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.append('limit', String(params.limit));
  }

  const queryString = searchParams.toString();
  const endpoint = `/reports/my${queryString ? `?${queryString}` : ''}`;

  return apiRequest<MyReportsResponse>(endpoint, {
    method: 'GET',
    auth: true,
    signal,
  });
}

export async function submitReport(
  formData: FormData,
): Promise<{ report: RawReportItem }> {
  return apiRequest<{ report: RawReportItem }>('/reports', {
    method: 'POST',
    body: formData,
    auth: true,
  });
}
