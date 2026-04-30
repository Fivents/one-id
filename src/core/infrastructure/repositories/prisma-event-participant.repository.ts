import type {
  CreateEventParticipantData,
  IEventParticipantRepository,
  UpdateEventParticipantData,
} from '@/core/domain/contracts';
import { EventParticipantEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaEventParticipantRepository implements IEventParticipantRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<EventParticipantEntity | null> {
    const participant = await this.db.eventParticipant.findUnique({
      where: { id, deletedAt: null },
    });

    if (!participant) return null;

    return EventParticipantEntity.create({
      id: participant.id,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      personId: participant.personId,
      eventId: participant.eventId,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      deletedAt: participant.deletedAt,
    });
  }

  async findByEvent(eventId: string): Promise<EventParticipantEntity[]> {
    const participants = await this.db.eventParticipant.findMany({
      where: { eventId, deletedAt: null },
    });

    return participants.map((p) =>
      EventParticipantEntity.create({
        id: p.id,
        company: p.company,
        jobTitle: p.jobTitle,
        qrCodeValue: p.qrCodeValue,
        accessCode: p.accessCode,
        useDocumentAsAccessCode: p.useDocumentAsAccessCode,
        personId: p.personId,
        eventId: p.eventId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
      }),
    );
  }

  async findByPersonAndEvent(personId: string, eventId: string): Promise<EventParticipantEntity | null> {
    const participant = await this.db.eventParticipant.findFirst({
      where: { personId, eventId, deletedAt: null },
    });

    if (!participant) return null;

    return EventParticipantEntity.create({
      id: participant.id,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      personId: participant.personId,
      eventId: participant.eventId,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      deletedAt: participant.deletedAt,
    });
  }

  async create(data: CreateEventParticipantData): Promise<EventParticipantEntity> {
    const participant = await this.db.eventParticipant.create({
      data: {
        company: data.company,
        jobTitle: data.jobTitle,
        qrCodeValue: data.qrCodeValue,
        accessCode: data.accessCode,
        useDocumentAsAccessCode: data.useDocumentAsAccessCode,
        personId: data.personId,
        eventId: data.eventId,
      },
    });

    return EventParticipantEntity.create({
      id: participant.id,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      personId: participant.personId,
      eventId: participant.eventId,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      deletedAt: participant.deletedAt,
    });
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
      },
    });

    return EventParticipantEntity.create({
      id: participant.id,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      personId: participant.personId,
      eventId: participant.eventId,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      deletedAt: participant.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.eventParticipant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
