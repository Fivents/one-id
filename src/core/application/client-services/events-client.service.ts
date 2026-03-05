import type { CreateEventRequest, UpdateEventRequest } from '@/core/communication/requests/event';
import type { EventResponse } from '@/core/communication/responses/event';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class EventsClientService extends BaseClient {
  async listEvents(organizationId: string): Promise<ApiResponse<EventResponse[]>> {
    return this.get(`/events?organizationId=${encodeURIComponent(organizationId)}`);
  }

  async getEvent(eventId: string): Promise<ApiResponse<EventResponse>> {
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
}

export const eventsClient = new EventsClientService();
