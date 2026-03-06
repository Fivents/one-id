import {
  makeBulkCreateAdminTotemsUseCase,
  makeCreateAdminTotemUseCase,
  makeDeleteAdminTotemUseCase,
  makeGenerateTotemAccessTokenUseCase,
  makeHardDeleteAdminTotemUseCase,
  makeListAdminTotemsUseCase,
  makeListDeletedTotemsUseCase,
  makeRestoreAdminTotemUseCase,
  makeRevokeTotemAccessTokenUseCase,
  makeUpdateAdminTotemUseCase,
} from '@/core/infrastructure/factories';

import {
  BulkCreateAdminTotemsController,
  CreateAdminTotemController,
  DeleteAdminTotemController,
  GenerateTotemAccessTokenController,
  HardDeleteAdminTotemController,
  ListAdminTotemsController,
  ListDeletedTotemsController,
  RestoreAdminTotemController,
  RevokeTotemAccessTokenController,
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

export function makeGenerateTotemAccessTokenController(): GenerateTotemAccessTokenController {
  return new GenerateTotemAccessTokenController(makeGenerateTotemAccessTokenUseCase());
}

export function makeRevokeTotemAccessTokenController(): RevokeTotemAccessTokenController {
  return new RevokeTotemAccessTokenController(makeRevokeTotemAccessTokenUseCase());
}
