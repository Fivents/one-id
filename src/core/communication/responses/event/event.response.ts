import type { EventStatus } from '@/core/domain/entities/event.entity';
import type { CodeSourceField } from '@/core/domain/entities/organization-people-settings.entity';
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
  allowSelfRegistration: boolean;
  autoLinkNewPeople: boolean;
  // Null means "inherit the organization's default people-settings code source".
  accessCodeSource: CodeSourceField | null;
  qrCodeSource: CodeSourceField | null;
  labelPrintPromptEnabled: boolean;
  labelPrintPromptTimeoutSeconds: number;
  startsAt: Date;
  endsAt: Date;
  organizationId: string;
  printConfigId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
