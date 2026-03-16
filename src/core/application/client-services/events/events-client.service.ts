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
  company: string | null;
  jobTitle: string | null;
  eventId: string;
  registeredAt: Date;
  hasCheckIn: boolean;
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

export interface EventCheckInDetailResponse {
  id: string;
  method: string;
  confidence: number | null;
  checkedInAt: Date;
  eventParticipantId: string;
  participantName: string;
  participantEmail: string;
  totemEventSubscriptionId: string;
  totemLocation: string;
}

export interface PrintConfigSummaryResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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

  async listEventCheckIns(eventId: string): Promise<ApiResponse<EventCheckInDetailResponse[]>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/checkins`);
  }

  async listPrintConfigs(): Promise<ApiResponse<PrintConfigSummaryResponse[]>> {
    return this.get('/print-configs');
  }

  async createDefaultPrintConfig(): Promise<ApiResponse<PrintConfigSummaryResponse>> {
    return this.post('/print-configs', {});
  }
}

export const eventsClient = new EventsClientService();
