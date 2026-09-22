import { containerService } from '@/core/application/services';
import {
  ConnectSymplaUseCase,
  DisconnectSymplaUseCase,
  GetSymplaConnectionStatusUseCase,
  LinkEventToSymplaUseCase,
  ListSymplaEventsUseCase,
  UnlinkEventFromSymplaUseCase,
} from '@/core/application/use-cases/sympla';

export function makeConnectSymplaUseCase(): ConnectSymplaUseCase {
  return new ConnectSymplaUseCase(
    containerService.getSymplaConnectionRepository(),
    containerService.getSecretCipher(),
    containerService.getSymplaClientProvider(),
    containerService.getAuditLogRepository(),
  );
}

export function makeDisconnectSymplaUseCase(): DisconnectSymplaUseCase {
  return new DisconnectSymplaUseCase(
    containerService.getSymplaConnectionRepository(),
    containerService.getAuditLogRepository(),
  );
}

export function makeGetSymplaConnectionStatusUseCase(): GetSymplaConnectionStatusUseCase {
  return new GetSymplaConnectionStatusUseCase(containerService.getSymplaConnectionRepository());
}

export function makeLinkEventToSymplaUseCase(): LinkEventToSymplaUseCase {
  return new LinkEventToSymplaUseCase(
    containerService.getSymplaEventLinkRepository(),
    containerService.getSymplaClientProvider(),
    containerService.getAuditLogRepository(),
    containerService.getJobQueue(),
  );
}

export function makeUnlinkEventFromSymplaUseCase(): UnlinkEventFromSymplaUseCase {
  return new UnlinkEventFromSymplaUseCase(
    containerService.getSymplaEventLinkRepository(),
    containerService.getAuditLogRepository(),
  );
}

export function makeListSymplaEventsUseCase(): ListSymplaEventsUseCase {
  return new ListSymplaEventsUseCase(
    containerService.getSymplaClientProvider(),
    containerService.getSymplaEventLinkRepository(),
  );
}
