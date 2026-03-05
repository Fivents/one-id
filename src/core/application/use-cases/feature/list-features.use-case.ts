import { IFeatureRepository } from '@/core/domain/contracts';
import type { FeatureEntity } from '@/core/domain/entities/feature.entity';

export class ListFeaturesUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  async execute(): Promise<FeatureEntity[]> {
    return this.featureRepository.findAll();
  }
}
