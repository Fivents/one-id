import { CreateFeatureData, IFeatureRepository } from '@/core/domain/contracts';
import type { FeatureEntity } from '@/core/domain/entities/feature.entity';
import { FeatureAlreadyExistsError } from '@/core/errors';

export class CreateFeatureUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  async execute(data: CreateFeatureData): Promise<FeatureEntity> {
    const existing = await this.featureRepository.findByCode(data.code);

    if (existing) {
      throw new FeatureAlreadyExistsError(data.code);
    }

    return this.featureRepository.create(data);
  }
}
