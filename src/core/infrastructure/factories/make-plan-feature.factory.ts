import { containerService } from '@/core/application/services';
import { AssociateFeatureToPlanUseCase } from '@/core/application/use-cases/plan-feature/associate-feature-to-plan.use-case';
import { ListPlanFeaturesUseCase } from '@/core/application/use-cases/plan-feature/list-plan-features.use-case';
import { RemoveFeatureFromPlanUseCase } from '@/core/application/use-cases/plan-feature/remove-feature-from-plan.use-case';
import { UpdatePlanFeatureValueUseCase } from '@/core/application/use-cases/plan-feature/update-plan-feature-value.use-case';

export function makeAssociateFeatureToPlanUseCase(): AssociateFeatureToPlanUseCase {
  return new AssociateFeatureToPlanUseCase(
    containerService.getPlanFeatureRepository(),
    containerService.getPlanRepository(),
    containerService.getFeatureRepository(),
  );
}

export function makeRemoveFeatureFromPlanUseCase(): RemoveFeatureFromPlanUseCase {
  return new RemoveFeatureFromPlanUseCase(containerService.getPlanFeatureRepository());
}

export function makeListPlanFeaturesUseCase(): ListPlanFeaturesUseCase {
  return new ListPlanFeaturesUseCase(containerService.getPlanFeatureRepository());
}

export function makeUpdatePlanFeatureValueUseCase(): UpdatePlanFeatureValueUseCase {
  return new UpdatePlanFeatureValueUseCase(containerService.getPlanFeatureRepository());
}
