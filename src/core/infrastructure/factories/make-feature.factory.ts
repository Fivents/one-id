import { containerService } from '@/core/application/services';
import { CreateFeatureUseCase } from '@/core/application/use-cases/feature/create-feature.use-case';
import { ListFeaturesUseCase } from '@/core/application/use-cases/feature/list-features.use-case';
import { UpdateFeatureUseCase } from '@/core/application/use-cases/feature/update-feature.use-case';

export function makeCreateFeatureUseCase(): CreateFeatureUseCase {
  return new CreateFeatureUseCase(containerService.getFeatureRepository());
}

export function makeUpdateFeatureUseCase(): UpdateFeatureUseCase {
  return new UpdateFeatureUseCase(containerService.getFeatureRepository());
}

export function makeListFeaturesUseCase(): ListFeaturesUseCase {
  return new ListFeaturesUseCase(containerService.getFeatureRepository());
}
