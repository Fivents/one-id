import type { CreateEventRequest, UpdateEventRequest } from '@/core/communication/requests/event';
import type {
  LinkTotemToEventRequest,
  SetTotemLocationRequest,
} from '@/core/communication/requests/totem-event-subscription';
import type { EventResponse, EventSummaryResponse } from '@/core/communication/responses/event';

import type { ApiResponse } from '../base/api-response';
import { BaseClient } from '../base/base-client';

export interface EventParticipantDetailResponse {
  id: string;
  personId: string;
  name: string;
  email: string;
  document: string | null;
  company: string | null;
  jobTitle: string | null;
  qrCodeValue: string | null;
  accessCode: string | null;
  useDocumentAsAccessCode: boolean;
  eventId: string;
  registeredAt: Date;
  hasCheckIn: boolean;
  lastCheckInId: string | null;
  faceId: string | null;
  faceImageUrl: string | null;
}

export interface PaginatedEventParticipantsResponse {
  items: EventParticipantDetailResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EventTotemSubscriptionResponse {
  id: string;
  totemOrganizationSubscriptionId: string;
  totemId: string;
  totemName: string;
  totemStatus: string;
  lastHeartbeat: Date | null;
  locationName: string;
  startsAt: Date;
  endsAt: Date;
}

export interface EventTotemAvailableResponse {
  totemOrganizationSubscriptionId: string;
  totemId: string;
  totemName: string;
  totemStatus: string;
  lastHeartbeat: Date | null;
  startsAt: Date;
  endsAt: Date;
}

export interface PrintConfigSummaryResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrintConfigFullResponse {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  printerDpi: number;
  copies: number;
  qrCodeContent: 'participant_id' | 'access_code' | 'qr_code_value';
  showQrCode: boolean;
  showAccessCode: boolean;
  fontSizeName: number;
  fontSizeMeta: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventAIConfigResponse {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
}

export interface UpdateEventAIConfigRequest {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
}

class EventsClientService extends BaseClient {
  async getEventsByOrganization(organizationId: string): Promise<ApiResponse<EventSummaryResponse[]>> {
    return this.get(`/events?organizationId=${encodeURIComponent(organizationId)}`);
  }

  async getEventById(eventId: string): Promise<ApiResponse<EventResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}`);
  }

  async createEvent(data: CreateEventRequest): Promise<ApiResponse<EventResponse>> {
    return this.post('/events', data);
  }

  async updateEvent(eventId: string, data: UpdateEventRequest): Promise<ApiResponse<EventResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}`, data);
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    return this.delete(`/events/${encodeURIComponent(eventId)}`);
  }

  async publishEvent(eventId: string): Promise<ApiResponse<EventResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/status`, { status: 'PUBLISHED' });
  }

  async activateEvent(eventId: string): Promise<ApiResponse<EventResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/status`, { status: 'ACTIVE' });
  }

  async completeEvent(eventId: string): Promise<ApiResponse<EventResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/status`, { status: 'COMPLETED' });
  }

  async cancelEvent(eventId: string): Promise<ApiResponse<EventResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/status`, { status: 'CANCELED' });
  }

  async listEventParticipants(
    eventId: string,
    params?: { search?: string; page?: number; pageSize?: number },
  ): Promise<ApiResponse<PaginatedEventParticipantsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const query = searchParams.toString();
    const suffix = query ? `?${query}` : '';
    return this.get(`/events/${encodeURIComponent(eventId)}/participants${suffix}`);
  }

  async listEventTotems(
    eventId: string,
  ): Promise<ApiResponse<{ assigned: EventTotemSubscriptionResponse[]; available: EventTotemAvailableResponse[] }>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/totems`);
  }

  async assignTotemToEvent(eventId: string, data: LinkTotemToEventRequest): Promise<ApiResponse<unknown>> {
    return this.post(`/events/${encodeURIComponent(eventId)}/totems`, data);
  }

  async updateTotemLocation(
    eventId: string,
    subscriptionId: string,
    data: SetTotemLocationRequest,
  ): Promise<ApiResponse<unknown>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/totems/${encodeURIComponent(subscriptionId)}`, data);
  }

  async removeTotemFromEvent(eventId: string, subscriptionId: string): Promise<ApiResponse<void>> {
    return this.delete(`/events/${encodeURIComponent(eventId)}/totems/${encodeURIComponent(subscriptionId)}`);
  }

  async listPrintConfigs(): Promise<ApiResponse<PrintConfigSummaryResponse[]>> {
    return this.get('/print-configs');
  }

  async createDefaultPrintConfig(): Promise<ApiResponse<PrintConfigSummaryResponse>> {
    return this.post('/print-configs', {});
  }

  async getEventAIConfig(eventId: string): Promise<ApiResponse<EventAIConfigResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/ai-config`);
  }

  async updateEventAIConfig(
    eventId: string,
    data: UpdateEventAIConfigRequest,
  ): Promise<ApiResponse<EventAIConfigResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/ai-config`, data);
  }

  async getPublicLink(eventId: string): Promise<ApiResponse<{ publicSlug: string | null; publicUrl: string | null }>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/public-link`);
  }

  async generatePublicLink(eventId: string): Promise<ApiResponse<{ publicSlug: string; publicUrl: string }>> {
    return this.post(`/events/${encodeURIComponent(eventId)}/public-link`, {});
  }

  async removePublicLink(eventId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete(`/events/${encodeURIComponent(eventId)}/public-link`);
  }

  async getEventPrintConfig(eventId: string): Promise<ApiResponse<PrintConfigFullResponse | null>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/print-config`);
  }

  async updateEventPrintConfig(
    eventId: string,
    data: Partial<PrintConfigFullResponse>,
  ): Promise<ApiResponse<PrintConfigFullResponse>> {
    return this.patch(`/events/${encodeURIComponent(eventId)}/print-config`, data);
  }

  async exportEventParticipants(
    eventId: string,
  ): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/participants/export`);
  }

  async importEventParticipants(data: {
    eventId: string;
    overwrite: boolean;
    participants: Array<{
      name: string;
      email?: string | null;
      document?: string | null;
      phone?: string | null;
      jobTitle?: string | null;
      birthDate?: string | null;
      notes?: string | null;
      company?: string | null;
      accessCode?: string | null;
      qrCodeValue?: string | null;
    }>;
  }): Promise<
    ApiResponse<{
      created: number;
      updated: number;
      skipped: string[];
      errors: { row: number; message: string }[];
    }>
  > {
    const { eventId, ...payload } = data;
    return this.post(`/events/${encodeURIComponent(eventId)}/participants/import`, payload);
  }
}

export const eventsClient = new EventsClientService();
