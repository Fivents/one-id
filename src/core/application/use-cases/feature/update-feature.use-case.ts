import { IFeatureRepository, UpdateFeatureData } from '@/core/domain/contracts';
import type { FeatureEntity } from '@/core/domain/entities/feature.entity';
import { FeatureNotFoundError } from '@/core/errors';

export class UpdateFeatureUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  async execute(id: string, data: UpdateFeatureData): Promise<FeatureEntity> {
    const feature = await this.featureRepository.findById(id);

    if (!feature) {
      throw new FeatureNotFoundError(id);
    }

    return this.featureRepository.update(id, data);
  }
}
