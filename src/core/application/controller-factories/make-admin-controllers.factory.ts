import {
  makeCreateClientUserUseCase,
  makeDeleteClientUserUseCase,
  makeListAdminUsersUseCase,
  makeResetUserPasswordUseCase,
  makeUpdateClientUserUseCase,
} from '@/core/infrastructure/factories';

import {
  CreateClientUserController,
  DeleteClientUserController,
  ListAdminUsersController,
  ResetUserPasswordController,
  UpdateClientUserController,
} from '../controllers/admin';

export function makeListAdminUsersController(): ListAdminUsersController {
  return new ListAdminUsersController(makeListAdminUsersUseCase());
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

export function makeResetUserPasswordController(): ResetUserPasswordController {
  return new ResetUserPasswordController(makeResetUserPasswordUseCase());
}
