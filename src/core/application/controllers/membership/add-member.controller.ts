import type { AddMemberRequest } from '@/core/communication/requests/membership';
import { AppError } from '@/core/errors';

import { AddMemberUseCase } from '../../use-cases/membership';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class AddMemberController {
  constructor(private readonly addMemberUseCase: AddMemberUseCase) {}

  async handle(request: AddMemberRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const membership = await this.addMemberUseCase.execute(request);

      return created(membership.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
