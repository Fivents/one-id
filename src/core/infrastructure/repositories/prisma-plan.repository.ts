import type { CreatePlanData, IPlanRepository, UpdatePlanData } from '@/core/domain/contracts';
import { PlanEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPlanRepository implements IPlanRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PlanEntity | null> {
    const plan = await this.db.plan.findUnique({
      where: { id, deletedAt: null },
    });

    if (!plan) return null;

    return PlanEntity.create({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      discount: plan.discount,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      deletedAt: plan.deletedAt,
    });
  }

  async findAllActive(): Promise<PlanEntity[]> {
    const plans = await this.db.plan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    return plans.map((plan) =>
      PlanEntity.create({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        discount: plan.discount,
        isCustom: plan.isCustom,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        deletedAt: plan.deletedAt,
      }),
    );
  }

  async create(data: CreatePlanData): Promise<PlanEntity> {
    const plan = await this.db.plan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        discount: data.discount,
        isCustom: data.isCustom,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return PlanEntity.create({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      discount: plan.discount,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      deletedAt: plan.deletedAt,
    });
  }

  async update(id: string, data: UpdatePlanData): Promise<PlanEntity> {
    const plan = await this.db.plan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        discount: data.discount,
        isCustom: data.isCustom,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return PlanEntity.create({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      discount: plan.discount,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      deletedAt: plan.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
