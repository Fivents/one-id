import type { CheckEmailResponse } from '@/core/communication/responses/auth';

import { CheckEmailClientUseCase, CheckEmailError } from '../../use-cases/auth';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class CheckEmailController {
  constructor(private readonly checkEmailUseCase: CheckEmailClientUseCase) {}

  async handle(email: string): Promise<ControllerResponse<CheckEmailResponse>> {
    try {
      const result = await this.checkEmailUseCase.execute(email);

      return ok(result);
    } catch (error) {
      if (error instanceof CheckEmailError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
