import { AppError } from '@/core/errors';

import { GetAuditLogUseCase } from '../../use-cases/audit-log';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetAuditLogController {
  constructor(private readonly getAuditLogUseCase: GetAuditLogUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const log = await this.getAuditLogUseCase.execute(id);

      return ok(log.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
