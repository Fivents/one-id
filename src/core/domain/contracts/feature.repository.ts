import type { FeatureEntity } from '../entities/feature.entity';

export interface CreateFeatureData {
  code: string;
  name: string;
  type: string;
  description?: string | null;
}

export interface IFeatureRepository {
  findByCode(code: string): Promise<FeatureEntity | null>;
  findAll(): Promise<FeatureEntity[]>;
  create(data: CreateFeatureData): Promise<FeatureEntity>;
}
