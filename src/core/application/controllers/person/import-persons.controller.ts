import type { ImportPersonsRequest } from '@/core/communication/requests/person';

import { ImportPersonsUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

interface ImportPersonsResponse {
  created: Record<string, unknown>[];
  skipped: string[];
}

export class ImportPersonsController {
  constructor(private readonly importPersonsUseCase: ImportPersonsUseCase) {}

  async handle(request: ImportPersonsRequest): Promise<ControllerResponse<ImportPersonsResponse>> {
    try {
      const result = await this.importPersonsUseCase.execute(request.organizationId, request.persons);

      return ok({
        created: result.created.map((person) => person.toJSON()),
        skipped: result.skipped,
      });
    } catch {
      return serverError();
    }
  }
}
