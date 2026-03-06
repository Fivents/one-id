import { containerService } from '@/core/application/services';
import { CreateClientUserUseCase } from '@/core/application/use-cases/admin/create-client-user.use-case';
import { DeleteClientUserUseCase } from '@/core/application/use-cases/admin/delete-client-user.use-case';
import { ListAdminUsersUseCase } from '@/core/application/use-cases/admin/list-admin-users.use-case';
import { ResetUserPasswordUseCase } from '@/core/application/use-cases/admin/reset-user-password.use-case';
import { UpdateClientUserUseCase } from '@/core/application/use-cases/admin/update-client-user.use-case';

export function makeListAdminUsersUseCase(): ListAdminUsersUseCase {
  return new ListAdminUsersUseCase(containerService.getUserRepository());
}

export function makeCreateClientUserUseCase(): CreateClientUserUseCase {
  return new CreateClientUserUseCase(
    containerService.getUserRepository(),
    containerService.getOrganizationRepository(),
    containerService.getMembershipRepository(),
  );
}

export function makeUpdateClientUserUseCase(): UpdateClientUserUseCase {
  return new UpdateClientUserUseCase(containerService.getUserRepository());
}

export function makeDeleteClientUserUseCase(): DeleteClientUserUseCase {
  return new DeleteClientUserUseCase(containerService.getUserRepository());
}

export function makeResetUserPasswordUseCase(): ResetUserPasswordUseCase {
  return new ResetUserPasswordUseCase(
    containerService.getUserRepository(),
    containerService.getAuthIdentityRepository(),
  );
}
