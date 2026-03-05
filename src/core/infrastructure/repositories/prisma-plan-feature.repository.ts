import type { CreatePlanFeatureData, IPlanFeatureRepository } from '@/core/domain/contracts';
import { PlanFeatureEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPlanFeatureRepository implements IPlanFeatureRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPlan(planId: string): Promise<PlanFeatureEntity[]> {
    const features = await this.db.planFeature.findMany({
      where: { planId, deletedAt: null },
    });

    return features.map((f) =>
      PlanFeatureEntity.create({
        id: f.id,
        value: f.value,
        featureId: f.featureId,
        planId: f.planId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        deletedAt: f.deletedAt,
      }),
    );
  }

  async findByPlanAndFeature(planId: string, featureId: string): Promise<PlanFeatureEntity | null> {
    const feature = await this.db.planFeature.findFirst({
      where: { planId, featureId, deletedAt: null },
    });

    if (!feature) return null;

    return PlanFeatureEntity.create({
      id: feature.id,
      value: feature.value,
      featureId: feature.featureId,
      planId: feature.planId,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      deletedAt: feature.deletedAt,
    });
  }

  async create(data: CreatePlanFeatureData): Promise<PlanFeatureEntity> {
    const feature = await this.db.planFeature.create({
      data: {
        value: data.value,
        featureId: data.featureId,
        planId: data.planId,
      },
    });

    return PlanFeatureEntity.create({
      id: feature.id,
      value: feature.value,
      featureId: feature.featureId,
      planId: feature.planId,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      deletedAt: feature.deletedAt,
    });
  }

  async update(id: string, data: { value: string }): Promise<PlanFeatureEntity> {
    const feature = await this.db.planFeature.update({
      where: { id },
      data: { value: data.value },
    });

    return PlanFeatureEntity.create({
      id: feature.id,
      value: feature.value,
      featureId: feature.featureId,
      planId: feature.planId,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      deletedAt: feature.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.planFeature.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
