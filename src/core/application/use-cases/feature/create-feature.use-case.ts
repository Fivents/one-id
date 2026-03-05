import { CreateFeatureData, IFeatureRepository } from '@/core/domain/contracts';
import type { FeatureEntity } from '@/core/domain/entities/feature.entity';

export class CreateFeatureUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  async execute(data: CreateFeatureData): Promise<FeatureEntity> {
    const existing = await this.featureRepository.findByCode(data.code);

    if (existing) {
      throw new CreateFeatureError('A feature with this code already exists.');
    }

    return this.featureRepository.create(data);
  }
}

export class CreateFeatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateFeatureError';
  }
}
