import type { ApiResponse } from '../base/api-response';
import { BaseClient } from '../base/base-client';

export type CheckInMethod = 'FACE_RECOGNITION' | 'QR_CODE' | 'MANUAL';
export type CheckInSource = 'TOTEM' | 'APP';

export interface EventCheckInItemResponse {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
  };
  method: CheckInMethod;
  confidence: number | null;
  source: CheckInSource;
  totemName: string | null;
  locationName: string | null;
  checkedInAt: Date;
  handledBy: string;
  sessionId: string | null;
  rawMetadata: Record<string, unknown>;
}

export interface EventCheckInListResponse {
  items: EventCheckInItemResponse[];
  total: number;
  pageSize: number;
  nextCursor: string | null;
  hasMore: boolean;
  totemOptions: Array<{ id: string; name: string }>;
}

export interface EventCheckInStatsResponse {
  total: number;
  faceCount: number;
  qrCount: number;
  manualCount: number;
  facePercentage: number;
  qrPercentage: number;
  manualPercentage: number;
  averageConfidence: number | null;
  totemUsage: Array<{
    totemId: string | null;
    totemName: string;
    locationName: string;
    count: number;
  }>;
}

export interface EventCheckInRealtimeResponse {
  liveCheckIns: number;
  checkInsPerMinute: number;
  lastCheckIn: {
    participantName: string;
    method: CheckInMethod;
    checkedInAt: Date;
  } | null;
  activeTotemsNow: number;
  alerts: Array<{ type: 'LOW_CONFIDENCE' | 'PEAK' | 'TOTEM_OFFLINE'; message: string }>;
}

export interface CheckInListParams {
  search?: string;
  method?: CheckInMethod;
  totemId?: string;
  from?: string;
  to?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  source?: CheckInSource;
  pageSize?: number;
  cursor?: string;
}

class EventCheckinsClientService extends BaseClient {
  async registerAppCheckIn(
    eventId: string,
    data: { eventParticipantId: string; method?: CheckInMethod; confidence?: number | null },
  ): Promise<
    ApiResponse<{ id: string; method: CheckInMethod; confidence: number | null; checkedInAt: Date; source: 'APP' }>
  > {
    return this.post(`/events/${encodeURIComponent(eventId)}/checkins`, data);
  }

  async getCheckInsByEvent(eventId: string, params: CheckInListParams): Promise<ApiResponse<EventCheckInListResponse>> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set('search', params.search);
    if (params.method) searchParams.set('method', params.method);
    if (params.totemId) searchParams.set('totemId', params.totemId);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.confidenceMin !== undefined) searchParams.set('confidenceMin', String(params.confidenceMin));
    if (params.confidenceMax !== undefined) searchParams.set('confidenceMax', String(params.confidenceMax));
    if (params.source) searchParams.set('source', params.source);
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    return this.get(`/events/${encodeURIComponent(eventId)}/checkins${query ? `?${query}` : ''}`);
  }

  async invalidateCheckIn(eventId: string, checkInId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete(`/events/${encodeURIComponent(eventId)}/checkins/${encodeURIComponent(checkInId)}`);
  }

  async getCheckInStats(eventId: string, params: CheckInListParams): Promise<ApiResponse<EventCheckInStatsResponse>> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set('search', params.search);
    if (params.method) searchParams.set('method', params.method);
    if (params.totemId) searchParams.set('totemId', params.totemId);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.confidenceMin !== undefined) searchParams.set('confidenceMin', String(params.confidenceMin));
    if (params.confidenceMax !== undefined) searchParams.set('confidenceMax', String(params.confidenceMax));
    if (params.source) searchParams.set('source', params.source);

    const query = searchParams.toString();
    return this.get(`/events/${encodeURIComponent(eventId)}/checkins/stats${query ? `?${query}` : ''}`);
  }

  async subscribeToCheckIns(eventId: string): Promise<ApiResponse<EventCheckInRealtimeResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/checkins/realtime`);
  }
}

export const eventCheckinsClient = new EventCheckinsClientService();
