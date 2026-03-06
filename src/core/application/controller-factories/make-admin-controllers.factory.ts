import {
  makeBulkHardDeleteUsersUseCase,
  makeBulkSoftDeleteUsersUseCase,
  makeCreateClientUserUseCase,
  makeDeleteClientUserUseCase,
  makeHardDeleteClientUserUseCase,
  makeListAdminUsersUseCase,
  makeListDeletedUsersUseCase,
  makeResetUserPasswordUseCase,
  makeRestoreClientUserUseCase,
  makeUpdateClientUserUseCase,
} from '@/core/infrastructure/factories';

import {
  BulkHardDeleteUsersController,
  BulkSoftDeleteUsersController,
  CreateClientUserController,
  DeleteClientUserController,
  HardDeleteClientUserController,
  ListAdminUsersController,
  ListDeletedUsersController,
  ResetUserPasswordController,
  RestoreClientUserController,
  UpdateClientUserController,
} from '../controllers/admin';

export function makeListAdminUsersController(): ListAdminUsersController {
  return new ListAdminUsersController(makeListAdminUsersUseCase());
}

export function makeListDeletedUsersController(): ListDeletedUsersController {
  return new ListDeletedUsersController(makeListDeletedUsersUseCase());
}

export function makeCreateClientUserController(): CreateClientUserController {
  return new CreateClientUserController(makeCreateClientUserUseCase());
}

export function makeUpdateClientUserController(): UpdateClientUserController {
  return new UpdateClientUserController(makeUpdateClientUserUseCase());
}

export function makeDeleteClientUserController(): DeleteClientUserController {
  return new DeleteClientUserController(makeDeleteClientUserUseCase());
}

export function makeHardDeleteClientUserController(): HardDeleteClientUserController {
  return new HardDeleteClientUserController(makeHardDeleteClientUserUseCase());
}

export function makeRestoreClientUserController(): RestoreClientUserController {
  return new RestoreClientUserController(makeRestoreClientUserUseCase());
}

export function makeResetUserPasswordController(): ResetUserPasswordController {
  return new ResetUserPasswordController(makeResetUserPasswordUseCase());
}

export function makeBulkSoftDeleteUsersController(): BulkSoftDeleteUsersController {
  return new BulkSoftDeleteUsersController(makeBulkSoftDeleteUsersUseCase());
}

export function makeBulkHardDeleteUsersController(): BulkHardDeleteUsersController {
  return new BulkHardDeleteUsersController(makeBulkHardDeleteUsersUseCase());
}
