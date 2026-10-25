import type { CreateSymplaEventLinkData, ISymplaEventLinkRepository } from '@/core/domain/contracts';
import { SymplaEventLinkEntity } from '@/core/domain/entities';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';

type SymplaEventLinkRow = Prisma.SymplaEventLinkGetPayload<object>;

export class PrismaSymplaEventLinkRepository implements ISymplaEventLinkRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEventId(eventId: string): Promise<SymplaEventLinkEntity | null> {
    const row = await this.db.symplaEventLink.findUnique({ where: { eventId } });

    return row ? this.convert(row) : null;
  }

  async findBySymplaEventIdHash(symplaEventIdHash: string): Promise<SymplaEventLinkEntity | null> {
    const row = await this.db.symplaEventLink.findUnique({ where: { symplaEventIdHash } });

    return row ? this.convert(row) : null;
  }

  async listByOrganization(organizationId: string): Promise<SymplaEventLinkEntity[]> {
    const rows = await this.db.symplaEventLink.findMany({
      where: { event: { organizationId, deletedAt: null } },
    });

    return rows.map((row) => this.convert(row));
  }

  async link(data: CreateSymplaEventLinkData): Promise<SymplaEventLinkEntity> {
    const row = await this.db.$transaction(async (tx) => {
      const created = await tx.symplaEventLink.upsert({
        where: { eventId: data.eventId },
        create: {
          eventId: data.eventId,
          symplaEventIdHash: data.symplaEventIdHash,
          symplaUrl: data.symplaUrl ?? null,
          imageUrl: data.imageUrl ?? null,
          referenceId: data.referenceId ?? null,
          categoryPrimary: data.categoryPrimary ?? null,
          categorySecondary: data.categorySecondary ?? null,
          hostName: data.hostName ?? null,
          publishedOnSympla: data.publishedOnSympla ?? false,
          cancelledOnSympla: data.cancelledOnSympla ?? false,
        },
        update: {
          symplaEventIdHash: data.symplaEventIdHash,
          symplaUrl: data.symplaUrl ?? null,
          imageUrl: data.imageUrl ?? null,
          referenceId: data.referenceId ?? null,
          categoryPrimary: data.categoryPrimary ?? null,
          categorySecondary: data.categorySecondary ?? null,
          hostName: data.hostName ?? null,
          publishedOnSympla: data.publishedOnSympla ?? false,
          cancelledOnSympla: data.cancelledOnSympla ?? false,
        },
      });

      await tx.event.update({ where: { id: data.eventId }, data: { symplaLinked: true } });

      return created;
    });

    return this.convert(row);
  }

  async unlink(eventId: string): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.symplaEventLink.findUnique({ where: { eventId }, select: { id: true } });
      if (!existing) return false;

      await tx.symplaEventLink.delete({ where: { eventId } });
      await tx.event.update({ where: { id: eventId }, data: { symplaLinked: false } });

      // Participants are intentionally left in place: they are real people who bought real
      // tickets, and unlinking is an integration decision, not a guest-list decision.
      return true;
    });
  }

  private convert(row: SymplaEventLinkRow): SymplaEventLinkEntity {
    return SymplaEventLinkEntity.create({
      id: row.id,
      eventId: row.eventId,
      symplaEventIdHash: row.symplaEventIdHash,
      symplaUrl: row.symplaUrl,
      imageUrl: row.imageUrl,
      referenceId: row.referenceId,
      categoryPrimary: row.categoryPrimary,
      categorySecondary: row.categorySecondary,
      hostName: row.hostName,
      publishedOnSympla: row.publishedOnSympla,
      cancelledOnSympla: row.cancelledOnSympla,
      lastSeedAt: row.lastSeedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
