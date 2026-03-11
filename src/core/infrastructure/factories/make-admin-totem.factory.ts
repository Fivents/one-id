import { containerService } from '@/core/application/services';
import { BulkCreateAdminTotemsUseCase } from '@/core/application/use-cases/admin-totems/bulk-create-admin-totems.use-case';
import { BulkHardDeleteTotemsUseCase } from '@/core/application/use-cases/admin-totems/bulk-hard-delete-totems.use-case';
import { BulkSoftDeleteTotemsUseCase } from '@/core/application/use-cases/admin-totems/bulk-soft-delete-totems.use-case';
import { ChangeTotemStatusUseCase } from '@/core/application/use-cases/admin-totems/change-totem-status.use-case';
import { CreateAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/create-admin-totem.use-case';
import { DeleteAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/delete-admin-totem.use-case';
import { GenerateTotemAccessCodeUseCase } from '@/core/application/use-cases/admin-totems/generate-totem-access-code.use-case';
import { HardDeleteAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/hard-delete-admin-totem.use-case';
import { ListAdminTotemsUseCase } from '@/core/application/use-cases/admin-totems/list-admin-totems.use-case';
import { ListDeletedTotemsUseCase } from '@/core/application/use-cases/admin-totems/list-deleted-totems.use-case';
import { RestoreAdminTotemUseCase } from '@/core/application/use-cases/admin-totems/restore-admin-totem.use-case';
import { RevokeTotemAccessCodeUseCase } from '@/core/application/use-cases/admin-totems/revoke-totem-access-code.use-case';
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

export function makeBulkSoftDeleteTotemsUseCase(): BulkSoftDeleteTotemsUseCase {
  return new BulkSoftDeleteTotemsUseCase(containerService.getTotemRepository());
}

export function makeBulkHardDeleteTotemsUseCase(): BulkHardDeleteTotemsUseCase {
  return new BulkHardDeleteTotemsUseCase(containerService.getTotemRepository());
}

export function makeGenerateTotemAccessCodeUseCase(): GenerateTotemAccessCodeUseCase {
  return new GenerateTotemAccessCodeUseCase(containerService.getTotemRepository());
}

export function makeRevokeTotemAccessCodeUseCase(): RevokeTotemAccessCodeUseCase {
  return new RevokeTotemAccessCodeUseCase(containerService.getTotemRepository());
}

export function makeChangeTotemStatusUseCase(): ChangeTotemStatusUseCase {
  return new ChangeTotemStatusUseCase(containerService.getTotemRepository());
}
