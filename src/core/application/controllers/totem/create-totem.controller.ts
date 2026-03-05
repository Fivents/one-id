import type { CreateTotemRequest } from '@/core/communication/requests/totem';

import { CreateTotemError, CreateTotemUseCase } from '../../use-cases/totem';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class CreateTotemController {
  constructor(private readonly createTotemUseCase: CreateTotemUseCase) {}

  async handle(request: CreateTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.createTotemUseCase.execute(request);

      return created(totem.toJSON());
    } catch (error) {
      if (error instanceof CreateTotemError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
