import { containerService } from '@/core/application/services';
import { ActivateTotemUseCase } from '@/core/application/use-cases/totem/activate-totem.use-case';
import { CreateTotemUseCase } from '@/core/application/use-cases/totem/create-totem.use-case';
import { DeactivateTotemUseCase } from '@/core/application/use-cases/totem/deactivate-totem.use-case';
import { DeleteTotemUseCase } from '@/core/application/use-cases/totem/delete-totem.use-case';
import { GetTotemUseCase } from '@/core/application/use-cases/totem/get-totem.use-case';
import { ListTotemsUseCase } from '@/core/application/use-cases/totem/list-totems.use-case';
import { SetMaintenanceTotemUseCase } from '@/core/application/use-cases/totem/set-maintenance-totem.use-case';
import { UpdateTotemUseCase } from '@/core/application/use-cases/totem/update-totem.use-case';

export function makeCreateTotemUseCase(): CreateTotemUseCase {
  return new CreateTotemUseCase(containerService.getTotemRepository());
}

export function makeUpdateTotemUseCase(): UpdateTotemUseCase {
  return new UpdateTotemUseCase(containerService.getTotemRepository());
}

export function makeDeleteTotemUseCase(): DeleteTotemUseCase {
  return new DeleteTotemUseCase(containerService.getTotemRepository());
}

export function makeActivateTotemUseCase(): ActivateTotemUseCase {
  return new ActivateTotemUseCase(containerService.getTotemRepository());
}

export function makeDeactivateTotemUseCase(): DeactivateTotemUseCase {
  return new DeactivateTotemUseCase(containerService.getTotemRepository());
}

export function makeSetMaintenanceTotemUseCase(): SetMaintenanceTotemUseCase {
  return new SetMaintenanceTotemUseCase(containerService.getTotemRepository());
}

export function makeListTotemsUseCase(): ListTotemsUseCase {
  return new ListTotemsUseCase(containerService.getTotemRepository());
}

export function makeGetTotemUseCase(): GetTotemUseCase {
  return new GetTotemUseCase(containerService.getTotemRepository());
}
