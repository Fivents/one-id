import {
  makeCreateUserUseCase,
  makeDeleteUserUseCase,
  makeGetUserUseCase,
  makeListUsersUseCase,
  makeUpdateUserUseCase,
} from '@/core/infrastructure/factories';

import {
  CreateUserController,
  DeleteUserController,
  GetUserController,
  ListUsersController,
  UpdateUserController,
} from '../controllers/user';

export function makeCreateUserController(): CreateUserController {
  return new CreateUserController(makeCreateUserUseCase());
}

export function makeGetUserController(): GetUserController {
  return new GetUserController(makeGetUserUseCase());
}

export function makeUpdateUserController(): UpdateUserController {
  return new UpdateUserController(makeUpdateUserUseCase());
}

export function makeDeleteUserController(): DeleteUserController {
  return new DeleteUserController(makeDeleteUserUseCase());
}

export function makeListUsersController(): ListUsersController {
  return new ListUsersController(makeListUsersUseCase());
}
