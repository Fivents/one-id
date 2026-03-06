import { IUserRepository, UserWithOrganization } from '@/core/domain/contracts';
import { UserEntity, UserWithMembership } from '@/core/domain/entities';
import { Role } from '@/core/domain/value-objects';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) return null;

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findByIdIncludingDeleted(id: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) return null;

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findByEmailIncludingDeleted(email: string): Promise<UserEntity | null> {
    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findByEmailWithMembership(email: string): Promise<UserWithMembership | null> {
    const user = await this.db.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        memberships: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });

    if (!user || user.memberships.length === 0) return null;

    const membership = user.memberships[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      role: membership.role as Role,
      organizationId: membership.organizationId,
    };
  }

  async create(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity> {
    const user = await this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
      },
    });

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) =>
      UserEntity.create({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      }),
    );
  }

  async findAllWithOrganization(): Promise<UserWithOrganization[]> {
    const users = await this.db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { deletedAt: null },
          take: 1,
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return users.map((user) => {
      const membership = user.memberships[0] ?? null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        organizationId: membership?.organizationId ?? null,
        organizationName: membership?.organization?.name ?? null,
        role: (membership?.role as Role) ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      };
    });
  }

  async findAllDeletedWithOrganization(): Promise<UserWithOrganization[]> {
    const users = await this.db.user.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        memberships: {
          take: 1,
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return users.map((user) => {
      const membership = user.memberships[0] ?? null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        organizationId: membership?.organizationId ?? null,
        organizationName: membership?.organization?.name ?? null,
        role: (membership?.role as Role) ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      };
    });
  }

  async update(id: string, data: { name?: string; email?: string; avatarUrl?: string }): Promise<UserEntity> {
    const user = await this.db.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
      },
    });

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]): Promise<void> {
    await this.db.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }

  async hardDeleteMany(ids: string[]): Promise<void> {
    await this.db.user.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restore(id: string, data: { name: string }): Promise<UserEntity> {
    const user = await this.db.user.update({
      where: { id },
      data: { name: data.name, deletedAt: null },
    });

    return UserEntity.create({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    });
  }

  async findOrCreateFiventsOrganization(): Promise<{ id: string }> {
    let org = await this.db.organization.findUnique({
      where: { slug: 'fivents' },
      select: { id: true },
    });

    if (!org) {
      org = await this.db.organization.create({
        data: {
          name: 'Fivents',
          slug: 'fivents',
          isActive: true,
        },
        select: { id: true },
      });
    }

    return org;
  }

  async createMembership(data: { userId: string; organizationId: string; role: Role }): Promise<void> {
    await this.db.membership.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
      },
    });
  }
}
