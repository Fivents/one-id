import type { ITotemRepository } from '@/domain/auth/contracts/totem.repository';
import { TotemEntity } from '@/domain/auth/entities/totem.entity';
import type { TotemProps } from '@/domain/auth/entities/totem.entity';
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
      lastHeartbeat: totem.lastHeartbeat,
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
      lastHeartbeat: totem.lastHeartbeat,
    });
  }
}
