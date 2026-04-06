import type { CreateEventData, IEventRepository, UpdateEventData } from '@/core/domain/contracts';
import { EventEntity, type EventStatus } from '@/core/domain/entities';
import { type EventAddress, normalizeEventAddress } from '@/core/domain/value-objects';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';

function mapAddressDetails(value: unknown): EventAddress | null {
  return normalizeEventAddress(value);
}

function toAddressJsonValue(
  value: EventAddress | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as unknown as Prisma.InputJsonValue;
}

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
      addressDetails: mapAddressDetails(event.addressDetails),
      status: event.status as EventStatus,
      faceEnabled: event.faceEnabled,
      qrEnabled: event.qrEnabled,
      codeEnabled: event.codeEnabled,
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
        addressDetails: mapAddressDetails(event.addressDetails),
        status: event.status as EventStatus,
        faceEnabled: event.faceEnabled,
        qrEnabled: event.qrEnabled,
        codeEnabled: event.codeEnabled,
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
        addressDetails: toAddressJsonValue(data.addressDetails),
        status: data.status,
        faceEnabled: data.faceEnabled,
        qrEnabled: data.qrEnabled,
        codeEnabled: data.codeEnabled,
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
      addressDetails: mapAddressDetails(event.addressDetails),
      status: event.status as EventStatus,
      faceEnabled: event.faceEnabled,
      qrEnabled: event.qrEnabled,
      codeEnabled: event.codeEnabled,
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
        addressDetails: toAddressJsonValue(data.addressDetails),
        status: data.status,
        faceEnabled: data.faceEnabled,
        qrEnabled: data.qrEnabled,
        codeEnabled: data.codeEnabled,
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
      addressDetails: mapAddressDetails(event.addressDetails),
      status: event.status as EventStatus,
      faceEnabled: event.faceEnabled,
      qrEnabled: event.qrEnabled,
      codeEnabled: event.codeEnabled,
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
