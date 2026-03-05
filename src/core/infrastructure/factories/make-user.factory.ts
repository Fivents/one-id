import { containerService } from '@/core/application/services';
import { CreateUserUseCase } from '@/core/application/use-cases/user/create-user.use-case';
import { DeleteUserUseCase } from '@/core/application/use-cases/user/delete-user.use-case';
import { GetUserUseCase } from '@/core/application/use-cases/user/get-user.use-case';
import { ListUsersUseCase } from '@/core/application/use-cases/user/list-users.use-case';
import { UpdateUserUseCase } from '@/core/application/use-cases/user/update-user.use-case';

export function makeCreateUserUseCase(): CreateUserUseCase {
  return new CreateUserUseCase(containerService.getUserRepository());
}

export function makeUpdateUserUseCase(): UpdateUserUseCase {
  return new UpdateUserUseCase(containerService.getUserRepository());
}

export function makeDeleteUserUseCase(): DeleteUserUseCase {
  return new DeleteUserUseCase(containerService.getUserRepository());
}

export function makeGetUserUseCase(): GetUserUseCase {
  return new GetUserUseCase(containerService.getUserRepository());
}

export function makeListUsersUseCase(): ListUsersUseCase {
  return new ListUsersUseCase(containerService.getUserRepository());
}
