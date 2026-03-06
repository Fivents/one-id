import { containerService } from '@/core/application/services';
import { BulkCreateAdminTotemsUseCase } from '@/core/application/use-cases/admin-totems/bulk-create-admin-totems.use-case';
import { CreateAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/create-admin-totem.use-case';
import { DeleteAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/delete-admin-totem.use-case';
import { GenerateTotemAccessTokenUseCase } from '@/core/application/use-cases/admin-totems/generate-totem-access-token.use-case';
import { HardDeleteAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/hard-delete-admin-totem.use-case';
import { ListAdminTotemsUseCase } from '@/core/application/use-cases/admin-totems/list-admin-totems.use-case';
import { ListDeletedTotemsUseCase } from '@/core/application/use-cases/admin-totems/list-deleted-totems.use-case';
import { RestoreAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/restore-admin-totem.use-case';
import { RevokeTotemAccessTokenUseCase } from '@/core/application/use-cases/admin-totems/revoke-totem-access-token.use-case';
import { UpdateAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/update-admin-totem.use-case';

export function makeListAdminTotemsUseCase(): ListAdminTotemsUseCase {
  return new ListAdminTotemsUseCase(containerService.getTotemRepository());
}

export function makeListDeletedTotemsUseCase(): ListDeletedTotemsUseCase {
  return new ListDeletedTotemsUseCase(containerService.getTotemRepository());
}

export function makeCreateAdminTotemUseCase(): CreateAdminTotemUseCase {
  return new CreateAdminTotemUseCase(containerService.getTotemRepository());
}

export function makeBulkCreateAdminTotemsUseCase(): BulkCreateAdminTotemsUseCase {
  return new BulkCreateAdminTotemsUseCase(containerService.getTotemRepository());
}

export function makeUpdateAdminTotemUseCase(): UpdateAdminTotemUseCase {
  return new UpdateAdminTotemUseCase(containerService.getTotemRepository());
}

export function makeDeleteAdminTotemUseCase(): DeleteAdminTotemUseCase {
  return new DeleteAdminTotemUseCase(containerService.getTotemRepository());
}

export function makeHardDeleteAdminTotemUseCase(): HardDeleteAdminTotemUseCase {
  return new HardDeleteAdminTotemUseCase(containerService.getTotemRepository());
}

export function makeRestoreAdminTotemUseCase(): RestoreAdminTotemUseCase {
  return new RestoreAdminTotemUseCase(containerService.getTotemRepository());
}

export function makeGenerateTotemAccessTokenUseCase(): GenerateTotemAccessTokenUseCase {
  return new GenerateTotemAccessTokenUseCase(containerService.getTotemRepository());
}

export function makeRevokeTotemAccessTokenUseCase(): RevokeTotemAccessTokenUseCase {
  return new RevokeTotemAccessTokenUseCase(containerService.getTotemRepository());
}
