import type { ImportPersonsRequest } from '@/core/communication/requests/person';

import type { ImportCodeSettings } from '../../use-cases/person';
import { ImportPersonsUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

interface ImportPersonsResponse {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  skipped: string[];
  errors: { row: number; message: string }[];
}

export class ImportPersonsController {
  constructor(private readonly importPersonsUseCase: ImportPersonsUseCase) {}

  async handle(
    request: ImportPersonsRequest,
    codeSettings?: ImportCodeSettings,
  ): Promise<ControllerResponse<ImportPersonsResponse>> {
    try {
      const result = await this.importPersonsUseCase.execute(
        request.organizationId,
        request.persons,
        request.overwrite,
        codeSettings,
      );

      return ok({
        created: result.created.map((person) => person.toJSON()),
        updated: result.updated.map((person) => person.toJSON()),
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch {
      return serverError();
    }
  }
}
