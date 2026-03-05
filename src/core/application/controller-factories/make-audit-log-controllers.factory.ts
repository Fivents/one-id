import {
  makeCreateAuditLogUseCase,
  makeGetAuditLogUseCase,
  makeListLogsByEntityUseCase,
  makeListLogsByOrganizationUseCase,
  makeListLogsByUserUseCase,
} from '@/core/infrastructure/factories';

import {
  CreateAuditLogController,
  GetAuditLogController,
  ListLogsByEntityController,
  ListLogsByOrganizationController,
  ListLogsByUserController,
} from '../controllers/audit-log';

export function makeCreateAuditLogController(): CreateAuditLogController {
  return new CreateAuditLogController(makeCreateAuditLogUseCase());
}

export function makeGetAuditLogController(): GetAuditLogController {
  return new GetAuditLogController(makeGetAuditLogUseCase());
}

export function makeListLogsByOrganizationController(): ListLogsByOrganizationController {
  return new ListLogsByOrganizationController(makeListLogsByOrganizationUseCase());
}

export function makeListLogsByUserController(): ListLogsByUserController {
  return new ListLogsByUserController(makeListLogsByUserUseCase());
}

export function makeListLogsByEntityController(): ListLogsByEntityController {
  return new ListLogsByEntityController(makeListLogsByEntityUseCase());
}
