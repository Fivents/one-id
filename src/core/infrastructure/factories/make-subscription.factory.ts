import { containerService } from '@/core/application/services';
import { ChangePlanUseCase } from '@/core/application/use-cases/subscription/change-plan.use-case';
import { CreateSubscriptionUseCase } from '@/core/application/use-cases/subscription/create-subscription.use-case';
import { GetSubscriptionUseCase } from '@/core/application/use-cases/subscription/get-subscription.use-case';
import { RenewSubscriptionUseCase } from '@/core/application/use-cases/subscription/renew-subscription.use-case';
import { UpdateSubscriptionUseCase } from '@/core/application/use-cases/subscription/update-subscription.use-case';

export function makeCreateSubscriptionUseCase(): CreateSubscriptionUseCase {
  return new CreateSubscriptionUseCase(
    containerService.getSubscriptionRepository(),
    containerService.getOrganizationRepository(),
    containerService.getPlanRepository(),
  );
}

export function makeUpdateSubscriptionUseCase(): UpdateSubscriptionUseCase {
  return new UpdateSubscriptionUseCase(containerService.getSubscriptionRepository());
}

export function makeGetSubscriptionUseCase(): GetSubscriptionUseCase {
  return new GetSubscriptionUseCase(containerService.getSubscriptionRepository());
}

export function makeRenewSubscriptionUseCase(): RenewSubscriptionUseCase {
  return new RenewSubscriptionUseCase(containerService.getSubscriptionRepository());
}

export function makeChangePlanUseCase(): ChangePlanUseCase {
  return new ChangePlanUseCase(containerService.getSubscriptionRepository(), containerService.getPlanRepository());
}
