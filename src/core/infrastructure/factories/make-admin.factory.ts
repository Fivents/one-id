import { containerService } from '@/core/application/services';
import { BulkHardDeleteUsersUseCase } from '@/core/application/use-cases/admin/bulk-hard-delete-users.use-case';
import { BulkSoftDeleteUsersUseCase } from '@/core/application/use-cases/admin/bulk-soft-delete-users.use-case';
import { CreateClientUserUseCase } from '@/core/application/use-cases/admin/create-client-user.use-case';
import { DeleteClientUserUseCase } from '@/core/application/use-cases/admin/delete-client-user.use-case';
import { HardDeleteClientUserUseCase } from '@/core/application/use-cases/admin/hard-delete-client-user.use-case';
import { ListAdminUsersUseCase } from '@/core/application/use-cases/admin/list-admin-users.use-case';
import { ListDeletedUsersUseCase } from '@/core/application/use-cases/admin/list-deleted-users.use-case';
import { ResetUserPasswordUseCase } from '@/core/application/use-cases/admin/reset-user-password.use-case';
import { RestoreClientUserUseCase } from '@/core/application/use-cases/admin/restore-client-user.use-case';
import { UpdateClientUserUseCase } from '@/core/application/use-cases/admin/update-client-user.use-case';

export function makeListAdminUsersUseCase(): ListAdminUsersUseCase {
  return new ListAdminUsersUseCase(containerService.getUserRepository());
}

export function makeListDeletedUsersUseCase(): ListDeletedUsersUseCase {
  return new ListDeletedUsersUseCase(containerService.getUserRepository());
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
  return new DeleteClientUserUseCase(containerService.getUserRepository(), containerService.getMembershipRepository());
}

export function makeHardDeleteClientUserUseCase(): HardDeleteClientUserUseCase {
  return new HardDeleteClientUserUseCase(
    containerService.getUserRepository(),
    containerService.getMembershipRepository(),
  );
}

export function makeRestoreClientUserUseCase(): RestoreClientUserUseCase {
  return new RestoreClientUserUseCase(
    containerService.getUserRepository(),
    containerService.getOrganizationRepository(),
    containerService.getMembershipRepository(),
  );
}

export function makeResetUserPasswordUseCase(): ResetUserPasswordUseCase {
  return new ResetUserPasswordUseCase(
    containerService.getUserRepository(),
    containerService.getAuthIdentityRepository(),
  );
}

export function makeBulkSoftDeleteUsersUseCase(): BulkSoftDeleteUsersUseCase {
  return new BulkSoftDeleteUsersUseCase(
    containerService.getUserRepository(),
    containerService.getMembershipRepository(),
  );
}

export function makeBulkHardDeleteUsersUseCase(): BulkHardDeleteUsersUseCase {
  return new BulkHardDeleteUsersUseCase(
    containerService.getUserRepository(),
    containerService.getMembershipRepository(),
  );
}
