import type { CreateFeatureData, IFeatureRepository } from '@/core/domain/contracts';
import { FeatureEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaFeatureRepository implements IFeatureRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByCode(code: string): Promise<FeatureEntity | null> {
    const feature = await this.db.feature.findUnique({
      where: { code, deletedAt: null },
    });

    if (!feature) return null;

    return FeatureEntity.create({
      id: feature.id,
      code: feature.code,
      name: feature.name,
      type: feature.type,
      description: feature.description,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      deletedAt: feature.deletedAt,
    });
  }

  async findAll(): Promise<FeatureEntity[]> {
    const features = await this.db.feature.findMany({
      where: { deletedAt: null },
    });

    return features.map((feature) =>
      FeatureEntity.create({
        id: feature.id,
        code: feature.code,
        name: feature.name,
        type: feature.type,
        description: feature.description,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
        deletedAt: feature.deletedAt,
      }),
    );
  }

  async create(data: CreateFeatureData): Promise<FeatureEntity> {
    const feature = await this.db.feature.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
      },
    });

    return FeatureEntity.create({
      id: feature.id,
      code: feature.code,
      name: feature.name,
      type: feature.type,
      description: feature.description,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      deletedAt: feature.deletedAt,
    });
  }
}
