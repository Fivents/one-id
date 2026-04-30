import type { EventEntity, EventStatus } from '../entities/event.entity';
import type { EventAddress } from '../value-objects';

export interface CreateEventData {
  name: string;
  slug: string;
  description?: string | null;
  timezone: string;
  address?: string | null;
  addressDetails?: EventAddress | null;
  status: EventStatus;
  faceEnabled?: boolean;
  qrEnabled?: boolean;
  codeEnabled?: boolean;
  labelPrintPromptEnabled?: boolean;
  labelPrintPromptTimeoutSeconds?: number;
  startsAt: Date;
  endsAt: Date;
  organizationId: string;
  printConfigId?: string | null;
}

export interface UpdateEventData {
  name?: string;
  slug?: string;
  description?: string | null;
  timezone?: string;
  address?: string | null;
  addressDetails?: EventAddress | null;
  status?: EventStatus;
  faceEnabled?: boolean;
  qrEnabled?: boolean;
  codeEnabled?: boolean;
  labelPrintPromptEnabled?: boolean;
  labelPrintPromptTimeoutSeconds?: number;
  startsAt?: Date;
  endsAt?: Date;
  printConfigId?: string | null;
}

export interface IEventRepository {
  findById(id: string): Promise<EventEntity | null>;
  findByOrganization(organizationId: string): Promise<EventEntity[]>;
  create(data: CreateEventData): Promise<EventEntity>;
  update(id: string, data: UpdateEventData): Promise<EventEntity>;
  softDelete(id: string): Promise<void>;
}
