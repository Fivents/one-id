import {
  makeCreateFeatureUseCase,
  makeListFeaturesUseCase,
  makeUpdateFeatureUseCase,
} from '@/core/infrastructure/factories';

import { CreateFeatureController, ListFeaturesController, UpdateFeatureController } from '../controllers/feature';

export function makeCreateFeatureController(): CreateFeatureController {
  return new CreateFeatureController(makeCreateFeatureUseCase());
}

export function makeUpdateFeatureController(): UpdateFeatureController {
  return new UpdateFeatureController(makeUpdateFeatureUseCase());
}

export function makeListFeaturesController(): ListFeaturesController {
  return new ListFeaturesController(makeListFeaturesUseCase());
}
