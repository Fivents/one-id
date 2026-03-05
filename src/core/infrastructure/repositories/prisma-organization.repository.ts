import type { CreateOrganizationData, IOrganizationRepository, UpdateOrganizationData } from '@/core/domain/contracts';
import { OrganizationEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<OrganizationEntity | null> {
    const org = await this.db.organization.findUnique({
      where: { id, deletedAt: null },
    });

    if (!org) return null;

    return OrganizationEntity.create({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      logoUrl: org.logoUrl,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      deletedAt: org.deletedAt,
    });
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const org = await this.db.organization.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!org) return null;

    return OrganizationEntity.create({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      logoUrl: org.logoUrl,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      deletedAt: org.deletedAt,
    });
  }

  async findAll(): Promise<OrganizationEntity[]> {
    const orgs = await this.db.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) =>
      OrganizationEntity.create({
        id: org.id,
        name: org.name,
        slug: org.slug,
        email: org.email,
        phone: org.phone,
        logoUrl: org.logoUrl,
        isActive: org.isActive,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        deletedAt: org.deletedAt,
      }),
    );
  }

  async create(data: CreateOrganizationData): Promise<OrganizationEntity> {
    const org = await this.db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        logoUrl: data.logoUrl,
      },
    });

    return OrganizationEntity.create({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      logoUrl: org.logoUrl,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      deletedAt: org.deletedAt,
    });
  }

  async update(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity> {
    const org = await this.db.organization.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        logoUrl: data.logoUrl,
        isActive: data.isActive,
      },
    });

    return OrganizationEntity.create({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      logoUrl: org.logoUrl,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      deletedAt: org.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
