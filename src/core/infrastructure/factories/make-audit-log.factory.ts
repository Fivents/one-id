import { containerService } from '@/core/application/services';
import { CreateAuditLogUseCase } from '@/core/application/use-cases/audit-log/create-audit-log.use-case';
import { GetAuditLogUseCase } from '@/core/application/use-cases/audit-log/get-audit-log.use-case';
import { ListLogsByEntityUseCase } from '@/core/application/use-cases/audit-log/list-logs-by-entity.use-case';
import { ListLogsByOrganizationUseCase } from '@/core/application/use-cases/audit-log/list-logs-by-organization.use-case';
import { ListLogsByUserUseCase } from '@/core/application/use-cases/audit-log/list-logs-by-user.use-case';

export function makeCreateAuditLogUseCase(): CreateAuditLogUseCase {
  return new CreateAuditLogUseCase(containerService.getAuditLogRepository());
}

export function makeGetAuditLogUseCase(): GetAuditLogUseCase {
  return new GetAuditLogUseCase(containerService.getAuditLogRepository());
}

export function makeListLogsByOrganizationUseCase(): ListLogsByOrganizationUseCase {
  return new ListLogsByOrganizationUseCase(containerService.getAuditLogRepository());
}

export function makeListLogsByUserUseCase(): ListLogsByUserUseCase {
  return new ListLogsByUserUseCase(containerService.getAuditLogRepository());
}

export function makeListLogsByEntityUseCase(): ListLogsByEntityUseCase {
  return new ListLogsByEntityUseCase(containerService.getAuditLogRepository());
}
