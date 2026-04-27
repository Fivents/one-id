import type { EventParticipantEntity } from '../entities/event-participant.entity';

export interface CreateEventParticipantData {
  company?: string | null;
  jobTitle?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  useDocumentAsAccessCode?: boolean;
  personId: string;
  eventId: string;
}

export interface UpdateEventParticipantData {
  company?: string | null;
  jobTitle?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  useDocumentAsAccessCode?: boolean;
}

export interface IEventParticipantRepository {
  findById(id: string): Promise<EventParticipantEntity | null>;
  findByEvent(eventId: string): Promise<EventParticipantEntity[]>;
  findByPersonAndEvent(personId: string, eventId: string): Promise<EventParticipantEntity | null>;
  create(data: CreateEventParticipantData): Promise<EventParticipantEntity>;
  update(id: string, data: UpdateEventParticipantData): Promise<EventParticipantEntity>;
  softDelete(id: string): Promise<void>;
}
