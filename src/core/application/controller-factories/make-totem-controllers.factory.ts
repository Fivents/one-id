import {
  makeActivateTotemUseCase,
  makeCreateTotemUseCase,
  makeDeactivateTotemUseCase,
  makeDeleteTotemUseCase,
  makeGetTotemUseCase,
  makeListTotemsUseCase,
  makeSetMaintenanceTotemUseCase,
  makeUpdateTotemUseCase,
} from '@/core/infrastructure/factories';

import {
  ActivateTotemController,
  CreateTotemController,
  DeactivateTotemController,
  DeleteTotemController,
  GetTotemController,
  ListTotemsController,
  SetMaintenanceTotemController,
  UpdateTotemController,
} from '../controllers/totem';

export function makeCreateTotemController(): CreateTotemController {
  return new CreateTotemController(makeCreateTotemUseCase());
}

export function makeGetTotemController(): GetTotemController {
  return new GetTotemController(makeGetTotemUseCase());
}

export function makeUpdateTotemController(): UpdateTotemController {
  return new UpdateTotemController(makeUpdateTotemUseCase());
}

export function makeDeleteTotemController(): DeleteTotemController {
  return new DeleteTotemController(makeDeleteTotemUseCase());
}

export function makeListTotemsController(): ListTotemsController {
  return new ListTotemsController(makeListTotemsUseCase());
}

export function makeActivateTotemController(): ActivateTotemController {
  return new ActivateTotemController(makeActivateTotemUseCase());
}

export function makeDeactivateTotemController(): DeactivateTotemController {
  return new DeactivateTotemController(makeDeactivateTotemUseCase());
}

export function makeSetMaintenanceTotemController(): SetMaintenanceTotemController {
  return new SetMaintenanceTotemController(makeSetMaintenanceTotemUseCase());
}
