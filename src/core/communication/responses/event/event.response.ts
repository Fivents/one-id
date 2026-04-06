import type { EventStatus } from '@/core/domain/entities/event.entity';
import type { EventAddress } from '@/core/domain/value-objects';

export interface EventResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  address: string | null;
  addressDetails: EventAddress | null;
  status: EventStatus;
  faceEnabled: boolean;
  qrEnabled: boolean;
  codeEnabled: boolean;
  startsAt: Date;
  endsAt: Date;
  organizationId: string;
  printConfigId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
