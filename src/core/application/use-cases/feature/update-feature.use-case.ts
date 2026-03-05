import { IFeatureRepository, UpdateFeatureData } from '@/core/domain/contracts';
import type { FeatureEntity } from '@/core/domain/entities/feature.entity';

export class UpdateFeatureUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  async execute(id: string, data: UpdateFeatureData): Promise<FeatureEntity> {
    const feature = await this.featureRepository.findById(id);

    if (!feature) {
      throw new UpdateFeatureError('Feature not found.');
    }

    return this.featureRepository.update(id, data);
  }
}

export class UpdateFeatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateFeatureError';
  }
}
