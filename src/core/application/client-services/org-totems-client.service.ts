import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface OrganizationTotemListResponse {
  totemOrganizationSubscriptionId: string;
  totemId: string;
  totemName: string;
  totemStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  startsAt: Date;
  endsAt: Date;
  activeEvent: {
    id: string;
    eventId: string;
    eventName: string;
    locationName: string;
    startsAt: Date;
    endsAt: Date;
    /** Gate restriction. Empty arrays mean this gate accepts everything. */
    allowedSectors: string[];
    allowedTicketTypes: string[];
  } | null;
}

export interface EventGateCatalogResponse {
  sectors: string[];
  ticketTypes: string[];
}

class OrgTotemsClientService extends BaseClient {
  async getOrganizationTotems(organizationId: string): Promise<ApiResponse<OrganizationTotemListResponse[]>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}/totems`);
  }

  async assignTotemToEvent(
    totemId: string,
    data: { eventId: string; locationName: string; startsAt: Date; endsAt: Date },
  ): Promise<
    ApiResponse<{ id: string; eventId: string; eventName: string; locationName: string; startsAt: Date; endsAt: Date }>
  > {
    return this.post(`/totems/${encodeURIComponent(totemId)}/assign-event`, data);
  }

  /** Sectors and ticket types known for an event, for the gate-restriction pickers. */
  async getEventGateCatalog(eventId: string): Promise<ApiResponse<EventGateCatalogResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/sympla/catalog`);
  }

  async updateGatePolicy(
    eventId: string,
    subscriptionId: string,
    data: { allowedSectors: string[]; allowedTicketTypes: string[] },
  ): Promise<ApiResponse<{ id: string; locationName: string }>> {
    return this.patch(
      `/events/${encodeURIComponent(eventId)}/gates/${encodeURIComponent(subscriptionId)}`,
      data,
    );
  }

  async unassignTotemFromEvent(
    totemId: string,
  ): Promise<ApiResponse<{ success: true; endedEventAssignments: number }>> {
    return this.post(`/totems/${encodeURIComponent(totemId)}/unassign-event`, {});
  }
}

export const orgTotemsClient = new OrgTotemsClientService();
