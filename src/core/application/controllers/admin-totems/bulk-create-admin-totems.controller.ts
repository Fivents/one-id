import { BulkCreateAdminTotemsUseCase } from '../../use-cases/admin-totems';
import type { BulkCreateAdminTotemsRequest } from '../../use-cases/admin-totems/bulk-create-admin-totems.use-case';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class BulkCreateAdminTotemsController {
  constructor(private readonly bulkCreateAdminTotemsUseCase: BulkCreateAdminTotemsUseCase) {}

  async handle(request: BulkCreateAdminTotemsRequest): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const totems = await this.bulkCreateAdminTotemsUseCase.execute(request);

      return created(totems.map((t) => t.toJSON()));
    } catch {
      return serverError();
    }
  }
}
