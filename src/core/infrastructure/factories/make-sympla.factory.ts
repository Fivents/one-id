import { containerService } from '@/core/application/services';
import {
  ConnectSymplaUseCase,
  DisconnectSymplaUseCase,
  GetSymplaConnectionStatusUseCase,
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
