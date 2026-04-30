import { containerService } from '@/core/application/services';
import { CreatePlanUseCase } from '@/core/application/use-cases/plan/create-plan.use-case';
import { DeactivatePlanUseCase } from '@/core/application/use-cases/plan/deactivate-plan.use-case';
import { GetPlanUseCase } from '@/core/application/use-cases/plan/get-plan.use-case';
import { ListPlansUseCase } from '@/core/application/use-cases/plan/list-plans.use-case';
import { UpdatePlanUseCase } from '@/core/application/use-cases/plan/update-plan.use-case';

export function makeCreatePlanUseCase(): CreatePlanUseCase {
  return new CreatePlanUseCase(containerService.getPlanRepository());
}

export function makeUpdatePlanUseCase(): UpdatePlanUseCase {
  return new UpdatePlanUseCase(containerService.getPlanRepository());
}

export function makeDeactivatePlanUseCase(): DeactivatePlanUseCase {
  return new DeactivatePlanUseCase(containerService.getPlanRepository());
}

export function makeListPlansUseCase(): ListPlansUseCase {
  return new ListPlansUseCase(containerService.getPlanRepository());
}

export function makeGetPlanUseCase(): GetPlanUseCase {
  return new GetPlanUseCase(containerService.getPlanRepository());
}
