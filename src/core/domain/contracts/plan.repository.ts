import type { PlanEntity } from '../entities/plan.entity';

export interface CreatePlanData {
  name: string;
  description: string;
  price: number;
  discount: number;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  price?: number;
  discount?: number;
  isCustom?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface IPlanRepository {
  findById(id: string): Promise<PlanEntity | null>;
  findAllActive(): Promise<PlanEntity[]>;
  create(data: CreatePlanData): Promise<PlanEntity>;
  update(id: string, data: UpdatePlanData): Promise<PlanEntity>;
  softDelete(id: string): Promise<void>;
}
