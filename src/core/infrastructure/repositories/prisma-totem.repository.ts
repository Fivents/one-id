import type { CreateTotemData, ITotemRepository, UpdateTotemData } from '@/core/domain/contracts';
import { TotemEntity, TotemProps } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaTotemRepository implements ITotemRepository {
  constructor(private readonly db: PrismaClient) {}

  private toEntity(totem: {
    id: string;
    name: string;
    accessCode: string;
    accessToken: string | null;
    status: string;
    price: number;
    discount: number;
    lastHeartbeat: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): TotemEntity {
    return TotemEntity.create({
      id: totem.id,
      name: totem.name,
      accessCode: totem.accessCode,
      accessToken: totem.accessToken,
      status: totem.status as TotemProps['status'],
      price: totem.price,
      discount: totem.discount,
      lastHeartbeat: totem.lastHeartbeat,
      createdAt: totem.createdAt,
      updatedAt: totem.updatedAt,
      deletedAt: totem.deletedAt,
    });
  }

  async findByAccessCode(accessCode: string): Promise<TotemEntity | null> {
    const totem = await this.db.totem.findUnique({
      where: { accessCode, deletedAt: null },
    });

    if (!totem) return null;

    return this.toEntity(totem);
  }

  async findById(id: string): Promise<TotemEntity | null> {
    const totem = await this.db.totem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!totem) return null;

    return this.toEntity(totem);
  }

  async findByIdIncludeDeleted(id: string): Promise<TotemEntity | null> {
    const totem = await this.db.totem.findUnique({
      where: { id },
    });

    if (!totem) return null;

    return this.toEntity(totem);
  }

  async findAll(): Promise<TotemEntity[]> {
    const totems = await this.db.totem.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return totems.map((t) => this.toEntity(t));
  }

  async findAllDeleted(): Promise<TotemEntity[]> {
    const totems = await this.db.totem.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });

    return totems.map((t) => this.toEntity(t));
  }

  async create(data: CreateTotemData): Promise<TotemEntity> {
    const totem = await this.db.totem.create({
      data: {
        name: data.name,
        accessCode: data.accessCode,
        status: data.status,
        price: data.price,
        discount: data.discount,
      },
    });

    return this.toEntity(totem);
  }

  async update(id: string, data: UpdateTotemData): Promise<TotemEntity> {
    const totem = await this.db.totem.update({
      where: { id },
      data: {
        name: data.name,
        accessCode: data.accessCode,
        status: data.status,
        price: data.price,
        discount: data.discount,
        lastHeartbeat: data.lastHeartbeat,
      },
    });

    return this.toEntity(totem);
  }

  async updateAccessToken(id: string, accessToken: string | null): Promise<TotemEntity> {
    const totem = await this.db.totem.update({
      where: { id },
      data: { accessToken },
    });

    return this.toEntity(totem);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.totem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<TotemEntity> {
    const totem = await this.db.totem.update({
      where: { id },
      data: { deletedAt: null },
    });

    return this.toEntity(totem);
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.totem.delete({
      where: { id },
    });
  }
}
