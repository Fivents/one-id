import { ITotemRepository } from '@/core/domain/contracts';
import { TotemEntity, TotemProps } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaTotemRepository implements ITotemRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByAccessCode(accessCode: string): Promise<TotemEntity | null> {
    const totem = await this.db.totem.findUnique({
      where: { accessCode, deletedAt: null },
    });

    if (!totem) return null;

    return TotemEntity.create({
      id: totem.id,
      name: totem.name,
      accessCode: totem.accessCode,
      status: totem.status as TotemProps['status'],
      price: totem.price,
      discount: totem.discount,
      lastHeartbeat: totem.lastHeartbeat,
      createdAt: totem.createdAt,
      updatedAt: totem.updatedAt,
      deletedAt: totem.deletedAt,
    });
  }

  async findById(id: string): Promise<TotemEntity | null> {
    const totem = await this.db.totem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!totem) return null;

    return TotemEntity.create({
      id: totem.id,
      name: totem.name,
      accessCode: totem.accessCode,
      status: totem.status as TotemProps['status'],
      price: totem.price,
      discount: totem.discount,
      lastHeartbeat: totem.lastHeartbeat,
      createdAt: totem.createdAt,
      updatedAt: totem.updatedAt,
      deletedAt: totem.deletedAt,
    });
  }
}
