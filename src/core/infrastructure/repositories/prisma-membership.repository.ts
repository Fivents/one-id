import type { CreateMembershipData, IMembershipRepository } from '@/core/domain/contracts';
import { MembershipEntity } from '@/core/domain/entities';
import type { Role } from '@/core/domain/value-objects';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaMembershipRepository implements IMembershipRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<MembershipEntity | null> {
    const membership = await this.db.membership.findUnique({
      where: { id, deletedAt: null },
    });

    if (!membership) return null;

    return MembershipEntity.create({
      id: membership.id,
      role: membership.role as Role,
      userId: membership.userId,
      organizationId: membership.organizationId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt,
    });
  }

  async findByUserAndOrganization(userId: string, organizationId: string): Promise<MembershipEntity | null> {
    const membership = await this.db.membership.findFirst({
      where: { userId, organizationId, deletedAt: null },
    });

    if (!membership) return null;

    return MembershipEntity.create({
      id: membership.id,
      role: membership.role as Role,
      userId: membership.userId,
      organizationId: membership.organizationId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt,
    });
  }

  async findByOrganization(organizationId: string): Promise<MembershipEntity[]> {
    const memberships = await this.db.membership.findMany({
      where: { organizationId, deletedAt: null },
    });

    return memberships.map((m) =>
      MembershipEntity.create({
        id: m.id,
        role: m.role as Role,
        userId: m.userId,
        organizationId: m.organizationId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        deletedAt: m.deletedAt,
      }),
    );
  }

  async findByUser(userId: string): Promise<MembershipEntity[]> {
    const memberships = await this.db.membership.findMany({
      where: { userId, deletedAt: null },
    });

    return memberships.map((m) =>
      MembershipEntity.create({
        id: m.id,
        role: m.role as Role,
        userId: m.userId,
        organizationId: m.organizationId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        deletedAt: m.deletedAt,
      }),
    );
  }

  async create(data: CreateMembershipData): Promise<MembershipEntity> {
    const membership = await this.db.membership.create({
      data: {
        role: data.role,
        userId: data.userId,
        organizationId: data.organizationId,
      },
    });

    return MembershipEntity.create({
      id: membership.id,
      role: membership.role as Role,
      userId: membership.userId,
      organizationId: membership.organizationId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt,
    });
  }

  async updateRole(id: string, role: Role): Promise<MembershipEntity> {
    const membership = await this.db.membership.update({
      where: { id },
      data: { role },
    });

    return MembershipEntity.create({
      id: membership.id,
      role: membership.role as Role,
      userId: membership.userId,
      organizationId: membership.organizationId,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.membership.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
