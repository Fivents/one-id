import { containerService } from '@/core/application/services';
import { LinkTotemToEventUseCase } from '@/core/application/use-cases/totem-event-subscription/link-totem-to-event.use-case';
import { ListEventTotemsUseCase } from '@/core/application/use-cases/totem-event-subscription/list-event-totems.use-case';
import { SetTotemLocationUseCase } from '@/core/application/use-cases/totem-event-subscription/set-totem-location.use-case';
import { UnlinkTotemFromEventUseCase } from '@/core/application/use-cases/totem-event-subscription/unlink-totem-from-event.use-case';

export function makeLinkTotemToEventUseCase(): LinkTotemToEventUseCase {
  return new LinkTotemToEventUseCase(
    containerService.getTotemEventSubscriptionRepository(),
    containerService.getTotemOrganizationSubscriptionRepository(),
    containerService.getEventRepository(),
  );
}

export function makeUnlinkTotemFromEventUseCase(): UnlinkTotemFromEventUseCase {
  return new UnlinkTotemFromEventUseCase(containerService.getTotemEventSubscriptionRepository());
}

export function makeSetTotemLocationUseCase(): SetTotemLocationUseCase {
  return new SetTotemLocationUseCase(containerService.getTotemEventSubscriptionRepository());
}

export function makeListEventTotemsUseCase(): ListEventTotemsUseCase {
  return new ListEventTotemsUseCase(containerService.getTotemEventSubscriptionRepository());
}
