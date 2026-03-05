import type { UpdateTotemRequest } from '@/core/communication/requests/totem';

import { UpdateTotemError, UpdateTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdateTotemController {
  constructor(private readonly updateTotemUseCase: UpdateTotemUseCase) {}

  async handle(id: string, request: UpdateTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.updateTotemUseCase.execute(id, request);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof UpdateTotemError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
