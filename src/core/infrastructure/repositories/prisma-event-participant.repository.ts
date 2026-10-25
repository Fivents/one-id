import type {
  CreateEventParticipantData,
  IEventParticipantRepository,
  UpdateEventParticipantData,
} from '@/core/domain/contracts';
import { type CodeProvenance, type DocumentType, EventParticipantEntity } from '@/core/domain/entities';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';

type EventParticipantRow = Prisma.EventParticipantGetPayload<object>;

export class PrismaEventParticipantRepository implements IEventParticipantRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<EventParticipantEntity | null> {
    const participant = await this.db.eventParticipant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!participant) return null;

    return this.convert(participant);
  }

  async findByEvent(eventId: string): Promise<EventParticipantEntity[]> {
    const participants = await this.db.eventParticipant.findMany({
      where: { eventId, deletedAt: null },
    });

    return participants.map((p) =>
      this.convert(p),
    );
  }

  async findByPersonAndEvent(personId: string, eventId: string): Promise<EventParticipantEntity | null> {
    const participant = await this.db.eventParticipant.findFirst({
      where: { personId, eventId, deletedAt: null },
    });

    if (!participant) return null;

    return this.convert(participant);
  }

  async create(data: CreateEventParticipantData): Promise<EventParticipantEntity> {
    const participant = await this.db.eventParticipant.create({
      data: {
        company: data.company,
        jobTitle: data.jobTitle,
        qrCodeValue: data.qrCodeValue,
        accessCode: data.accessCode,
        useDocumentAsAccessCode: data.useDocumentAsAccessCode,
        accessCodeProvenance: data.accessCodeProvenance,
        qrCodeProvenance: data.qrCodeProvenance,
        attendeeFullName: data.attendeeFullName ?? null,
        attendeeEmail: data.attendeeEmail ?? null,
        attendeeDocument: data.attendeeDocument ?? null,
        attendeeDocumentType: data.attendeeDocumentType ?? null,
        personId: data.personId ?? null,
        eventId: data.eventId,
      },
    });

    return this.convert(participant);
  }

  async update(id: string, data: UpdateEventParticipantData): Promise<EventParticipantEntity> {
    const participant = await this.db.eventParticipant.update({
      where: { id },
      data: {
        company: data.company,
        jobTitle: data.jobTitle,
        qrCodeValue: data.qrCodeValue,
        accessCode: data.accessCode,
        useDocumentAsAccessCode: data.useDocumentAsAccessCode,
        accessCodeProvenance: data.accessCodeProvenance,
        qrCodeProvenance: data.qrCodeProvenance,
        attendeeFullName: data.attendeeFullName,
        attendeeEmail: data.attendeeEmail,
        attendeeDocument: data.attendeeDocument,
        attendeeDocumentType: data.attendeeDocumentType,
      },
    });

    return this.convert(participant);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.eventParticipant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private convert(participant: EventParticipantRow): EventParticipantEntity {
    return EventParticipantEntity.create({
      id: participant.id,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      accessCodeProvenance: participant.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: participant.qrCodeProvenance as CodeProvenance,
      attendeeFullName: participant.attendeeFullName,
      attendeeEmail: participant.attendeeEmail,
      attendeeDocument: participant.attendeeDocument,
      attendeeDocumentType: participant.attendeeDocumentType as DocumentType | null,
      personId: participant.personId,
      eventId: participant.eventId,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      deletedAt: participant.deletedAt,
    });
  }
}
