import {
  makeAssociateFeatureToPlanUseCase,
  makeListPlanFeaturesUseCase,
  makeRemoveFeatureFromPlanUseCase,
  makeUpdatePlanFeatureValueUseCase,
} from '@/core/infrastructure/factories';

import {
  AssociateFeatureToPlanController,
  ListPlanFeaturesController,
  RemoveFeatureFromPlanController,
  UpdatePlanFeatureValueController,
} from '../controllers/plan-feature';

export function makeAssociateFeatureToPlanController(): AssociateFeatureToPlanController {
  return new AssociateFeatureToPlanController(makeAssociateFeatureToPlanUseCase());
}

export function makeRemoveFeatureFromPlanController(): RemoveFeatureFromPlanController {
  return new RemoveFeatureFromPlanController(makeRemoveFeatureFromPlanUseCase());
}

export function makeUpdatePlanFeatureValueController(): UpdatePlanFeatureValueController {
  return new UpdatePlanFeatureValueController(makeUpdatePlanFeatureValueUseCase());
}

export function makeListPlanFeaturesController(): ListPlanFeaturesController {
  return new ListPlanFeaturesController(makeListPlanFeaturesUseCase());
}
