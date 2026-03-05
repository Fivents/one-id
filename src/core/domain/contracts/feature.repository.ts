import type { FeatureEntity } from '../entities/feature.entity';

export interface CreateFeatureData {
  code: string;
  name: string;
  type: string;
  description?: string | null;
}

export interface UpdateFeatureData {
  name?: string;
  type?: string;
  description?: string | null;
}

export interface IFeatureRepository {
  findById(id: string): Promise<FeatureEntity | null>;
  findByCode(code: string): Promise<FeatureEntity | null>;
  findAll(): Promise<FeatureEntity[]>;
  create(data: CreateFeatureData): Promise<FeatureEntity>;
  update(id: string, data: UpdateFeatureData): Promise<FeatureEntity>;
}
