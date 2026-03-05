import type { CreateEventData, IEventRepository, UpdateEventData } from '@/core/domain/contracts';
import { EventEntity, type EventStatus } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<EventEntity | null> {
    const event = await this.db.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) return null;

    return EventEntity.create({
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      timezone: event.timezone,
      address: event.address,
      status: event.status as EventStatus,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      organizationId: event.organizationId,
      printConfigId: event.printConfigId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt,
    });
  }

  async findByOrganization(organizationId: string): Promise<EventEntity[]> {
    const events = await this.db.event.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { startsAt: 'desc' },
    });

    return events.map((event) =>
      EventEntity.create({
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        timezone: event.timezone,
        address: event.address,
        status: event.status as EventStatus,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        organizationId: event.organizationId,
        printConfigId: event.printConfigId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        deletedAt: event.deletedAt,
      }),
    );
  }

  async create(data: CreateEventData): Promise<EventEntity> {
    const event = await this.db.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        timezone: data.timezone,
        address: data.address,
        status: data.status,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        organizationId: data.organizationId,
        printConfigId: data.printConfigId,
      },
    });

    return EventEntity.create({
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      timezone: event.timezone,
      address: event.address,
      status: event.status as EventStatus,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      organizationId: event.organizationId,
      printConfigId: event.printConfigId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt,
    });
  }

  async update(id: string, data: UpdateEventData): Promise<EventEntity> {
    const event = await this.db.event.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        timezone: data.timezone,
        address: data.address,
        status: data.status,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        printConfigId: data.printConfigId,
      },
    });

    return EventEntity.create({
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      timezone: event.timezone,
      address: event.address,
      status: event.status as EventStatus,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      organizationId: event.organizationId,
      printConfigId: event.printConfigId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
