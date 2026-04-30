import type { CreateAuditLogRequest } from '@/core/communication/requests/audit-log';

import { CreateAuditLogUseCase } from '../../use-cases/audit-log';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateAuditLogController {
  constructor(private readonly createAuditLogUseCase: CreateAuditLogUseCase) {}

  async handle(request: CreateAuditLogRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const log = await this.createAuditLogUseCase.execute(request);

      return created(log.toJSON());
    } catch {
      return serverError();
    }
  }
}
