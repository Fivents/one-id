import {
  makeCreatePlanUseCase,
  makeDeactivatePlanUseCase,
  makeGetPlanUseCase,
  makeListPlansUseCase,
  makeUpdatePlanUseCase,
} from '@/core/infrastructure/factories';

import {
  CreatePlanController,
  DeactivatePlanController,
  GetPlanController,
  ListPlansController,
  UpdatePlanController,
} from '../controllers/plan';

export function makeCreatePlanController(): CreatePlanController {
  return new CreatePlanController(makeCreatePlanUseCase());
}

export function makeGetPlanController(): GetPlanController {
  return new GetPlanController(makeGetPlanUseCase());
}

export function makeUpdatePlanController(): UpdatePlanController {
  return new UpdatePlanController(makeUpdatePlanUseCase());
}

export function makeListPlansController(): ListPlansController {
  return new ListPlansController(makeListPlansUseCase());
}

export function makeDeactivatePlanController(): DeactivatePlanController {
  return new DeactivatePlanController(makeDeactivatePlanUseCase());
}
