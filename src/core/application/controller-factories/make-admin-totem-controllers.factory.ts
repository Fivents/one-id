import {
  makeBulkCreateAdminTotemsUseCase,
  makeBulkHardDeleteTotemsUseCase,
  makeBulkSoftDeleteTotemsUseCase,
  makeChangeTotemStatusUseCase,
  makeCreateAdminTotemUseCase,
  makeDeleteAdminTotemUseCase,
  makeGenerateTotemAccessCodeUseCase,
  makeHardDeleteAdminTotemUseCase,
  makeListAdminTotemsUseCase,
  makeListDeletedTotemsUseCase,
  makeRestoreAdminTotemUseCase,
  makeRevokeTotemAccessCodeUseCase,
  makeUpdateAdminTotemUseCase,
} from '@/core/infrastructure/factories';

import {
  BulkCreateAdminTotemsController,
  BulkHardDeleteTotemsController,
  BulkSoftDeleteTotemsController,
  ChangeTotemStatusController,
  CreateAdminTotemController,
  DeleteAdminTotemController,
  GenerateTotemAccessCodeController,
  HardDeleteAdminTotemController,
  ListAdminTotemsController,
  ListDeletedTotemsController,
  RestoreAdminTotemController,
  RevokeTotemAccessCodeController,
  UpdateAdminTotemController,
} from '../controllers/admin-totems';

export function makeListAdminTotemsController(): ListAdminTotemsController {
  return new ListAdminTotemsController(makeListAdminTotemsUseCase());
}

export function makeListDeletedTotemsController(): ListDeletedTotemsController {
  return new ListDeletedTotemsController(makeListDeletedTotemsUseCase());
}

export function makeCreateAdminTotemController(): CreateAdminTotemController {
  return new CreateAdminTotemController(makeCreateAdminTotemUseCase());
}

export function makeBulkCreateAdminTotemsController(): BulkCreateAdminTotemsController {
  return new BulkCreateAdminTotemsController(makeBulkCreateAdminTotemsUseCase());
}

export function makeUpdateAdminTotemController(): UpdateAdminTotemController {
  return new UpdateAdminTotemController(makeUpdateAdminTotemUseCase());
}

export function makeDeleteAdminTotemController(): DeleteAdminTotemController {
  return new DeleteAdminTotemController(makeDeleteAdminTotemUseCase());
}

export function makeHardDeleteAdminTotemController(): HardDeleteAdminTotemController {
  return new HardDeleteAdminTotemController(makeHardDeleteAdminTotemUseCase());
}

export function makeRestoreAdminTotemController(): RestoreAdminTotemController {
  return new RestoreAdminTotemController(makeRestoreAdminTotemUseCase());
}

export function makeBulkSoftDeleteTotemsController(): BulkSoftDeleteTotemsController {
  return new BulkSoftDeleteTotemsController(makeBulkSoftDeleteTotemsUseCase());
}

export function makeBulkHardDeleteTotemsController(): BulkHardDeleteTotemsController {
  return new BulkHardDeleteTotemsController(makeBulkHardDeleteTotemsUseCase());
}

export function makeGenerateTotemAccessCodeController(): GenerateTotemAccessCodeController {
  return new GenerateTotemAccessCodeController(makeGenerateTotemAccessCodeUseCase());
}

export function makeRevokeTotemAccessCodeController(): RevokeTotemAccessCodeController {
  return new RevokeTotemAccessCodeController(makeRevokeTotemAccessCodeUseCase());
}

export function makeChangeTotemStatusController(): ChangeTotemStatusController {
  return new ChangeTotemStatusController(makeChangeTotemStatusUseCase());
}
