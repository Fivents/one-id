import { AppError } from '@/core/errors';

import { RemoveMemberUseCase } from '../../use-cases/membership';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RemoveMemberController {
  constructor(private readonly removeMemberUseCase: RemoveMemberUseCase) {}

  async handle(membershipId: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeMemberUseCase.execute(membershipId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
