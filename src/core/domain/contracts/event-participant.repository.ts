import type { EventParticipantEntity } from '../entities/event-participant.entity';
import type { CodeProvenance } from '../entities/organization-people-settings.entity';

export interface CreateEventParticipantData {
  company?: string | null;
  jobTitle?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  useDocumentAsAccessCode?: boolean;
  accessCodeProvenance?: CodeProvenance;
  qrCodeProvenance?: CodeProvenance;
  personId: string;
  eventId: string;
}

export interface UpdateEventParticipantData {
  company?: string | null;
  jobTitle?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  useDocumentAsAccessCode?: boolean;
  accessCodeProvenance?: CodeProvenance;
  qrCodeProvenance?: CodeProvenance;
}

export interface IEventParticipantRepository {
  findById(id: string): Promise<EventParticipantEntity | null>;
  findByEvent(eventId: string): Promise<EventParticipantEntity[]>;
  findByPersonAndEvent(personId: string, eventId: string): Promise<EventParticipantEntity | null>;
  create(data: CreateEventParticipantData): Promise<EventParticipantEntity>;
  update(id: string, data: UpdateEventParticipantData): Promise<EventParticipantEntity>;
  softDelete(id: string): Promise<void>;
}
