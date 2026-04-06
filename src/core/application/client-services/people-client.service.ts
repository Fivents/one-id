import type { CreatePersonRequest, UpdatePersonRequest } from '@/core/communication/requests/person';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface PersonSummaryResponse {
  id: string;
  name: string;
  email: string;
  document: string | null;
  documentType: 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE' | 'OTHER' | null;
  phone: string | null;
  qrCodeValue: string | null;
  accessCode: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  eventsCount: number;
  facesCount: number;
  faceId: string | null;
  faceImageUrl: string | null;
}

export interface PaginatedPeopleResponse {
  items: PersonSummaryResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PersonEventLinkResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  linked: boolean;
}

class PeopleClientService extends BaseClient {
  async listPeople(params: {
    organizationId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    eventId?: string;
    excludeEventId?: string;
    deleted?: boolean;
  }): Promise<ApiResponse<PaginatedPeopleResponse>> {
    const searchParams = new URLSearchParams();
    searchParams.set('organizationId', params.organizationId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.search) searchParams.set('search', params.search);
    if (params.eventId) searchParams.set('eventId', params.eventId);
    if (params.excludeEventId) searchParams.set('excludeEventId', params.excludeEventId);
    if (params.deleted) searchParams.set('deleted', 'true');

    return this.get(`/people?${searchParams.toString()}`);
  }

  async getPerson(personId: string): Promise<ApiResponse<PersonSummaryResponse>> {
    return this.get(`/people/${encodeURIComponent(personId)}`);
  }

  async createPerson(data: CreatePersonRequest): Promise<ApiResponse<PersonSummaryResponse>> {
    return this.post('/people', data);
  }

  async updatePerson(personId: string, data: UpdatePersonRequest): Promise<ApiResponse<PersonSummaryResponse>> {
    return this.patch(`/people/${encodeURIComponent(personId)}`, data);
  }

  async softDeletePerson(personId: string): Promise<ApiResponse<void>> {
    return this.delete(`/people/${encodeURIComponent(personId)}`);
  }

  async hardDeletePerson(personId: string): Promise<ApiResponse<void>> {
    return this.delete(`/people/${encodeURIComponent(personId)}/hard-delete`);
  }

  async bulkSoftDelete(organizationId: string, personIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
    return this.post('/people/bulk-delete', { organizationId, personIds });
  }

  async bulkHardDelete(organizationId: string, personIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
    return this.post('/people/bulk-hard-delete', { organizationId, personIds });
  }

  async listPersonEvents(personId: string): Promise<ApiResponse<PersonEventLinkResponse[]>> {
    return this.get(`/people/${encodeURIComponent(personId)}/events`);
  }

  async linkPersonToEvent(personId: string, eventId: string): Promise<ApiResponse<unknown>> {
    return this.post(`/people/${encodeURIComponent(personId)}/events/${encodeURIComponent(eventId)}`, {});
  }

  async unlinkPersonFromEvent(personId: string, eventId: string): Promise<ApiResponse<void>> {
    return this.delete(`/people/${encodeURIComponent(personId)}/events/${encodeURIComponent(eventId)}`);
  }
}

export const peopleClient = new PeopleClientService();
