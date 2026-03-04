import type { IUserRepository } from '@/domain/auth/contracts/user.repository';
import type { UserWithMembership } from '@/domain/auth/entities/user.entity';
import { UserEntity } from '@/domain/auth/entities/user.entity';
import type { Role } from '@/domain/auth/value-objects/role';
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
