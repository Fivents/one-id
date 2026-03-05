import {
  makeChangePlanUseCase,
  makeCreateSubscriptionUseCase,
  makeGetSubscriptionUseCase,
  makeRenewSubscriptionUseCase,
  makeUpdateSubscriptionUseCase,
} from '@/core/infrastructure/factories';

import {
  ChangePlanController,
  CreateSubscriptionController,
  GetSubscriptionController,
  RenewSubscriptionController,
  UpdateSubscriptionController,
} from '../controllers/subscription';

export function makeCreateSubscriptionController(): CreateSubscriptionController {
  return new CreateSubscriptionController(makeCreateSubscriptionUseCase());
}

export function makeGetSubscriptionController(): GetSubscriptionController {
  return new GetSubscriptionController(makeGetSubscriptionUseCase());
}

export function makeUpdateSubscriptionController(): UpdateSubscriptionController {
  return new UpdateSubscriptionController(makeUpdateSubscriptionUseCase());
}

export function makeChangePlanController(): ChangePlanController {
  return new ChangePlanController(makeChangePlanUseCase());
}

export function makeRenewSubscriptionController(): RenewSubscriptionController {
  return new RenewSubscriptionController(makeRenewSubscriptionUseCase());
}
