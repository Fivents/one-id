import { containerService } from '@/core/application/services';
import { CheckTotemAvailabilityUseCase } from '@/core/application/use-cases/totem-organization-subscription/check-totem-availability.use-case';
import { LinkTotemToOrgUseCase } from '@/core/application/use-cases/totem-organization-subscription/link-totem-to-org.use-case';
import { ListOrgTotemsUseCase } from '@/core/application/use-cases/totem-organization-subscription/list-org-totems.use-case';
import { UnlinkTotemFromOrgUseCase } from '@/core/application/use-cases/totem-organization-subscription/unlink-totem-from-org.use-case';

export function makeLinkTotemToOrgUseCase(): LinkTotemToOrgUseCase {
  return new LinkTotemToOrgUseCase(
    containerService.getTotemOrganizationSubscriptionRepository(),
    containerService.getTotemRepository(),
    containerService.getOrganizationRepository(),
  );
}

export function makeUnlinkTotemFromOrgUseCase(): UnlinkTotemFromOrgUseCase {
  return new UnlinkTotemFromOrgUseCase(containerService.getTotemOrganizationSubscriptionRepository());
}

export function makeListOrgTotemsUseCase(): ListOrgTotemsUseCase {
  return new ListOrgTotemsUseCase(containerService.getTotemOrganizationSubscriptionRepository());
}

export function makeCheckTotemAvailabilityUseCase(): CheckTotemAvailabilityUseCase {
  return new CheckTotemAvailabilityUseCase(containerService.getTotemOrganizationSubscriptionRepository());
}
