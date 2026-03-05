import type { AddMemberRequest } from '@/core/communication/requests/membership';

import { AddMemberError, AddMemberUseCase } from '../../use-cases/membership';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class AddMemberController {
  constructor(private readonly addMemberUseCase: AddMemberUseCase) {}

  async handle(request: AddMemberRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const membership = await this.addMemberUseCase.execute(request);

      return created(membership.toJSON());
    } catch (error) {
      if (error instanceof AddMemberError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
