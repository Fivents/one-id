import type { UserTokenPayload } from '@/core/domain/contracts';

import { ValidateSessionUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, unauthorized } from '../controller-response';

export class ValidateSessionController {
  constructor(private readonly validateSessionUseCase: ValidateSessionUseCase) {}

  async handle(token: string): Promise<ControllerResponse<UserTokenPayload>> {
    try {
      const payload = await this.validateSessionUseCase.execute(token);

      return ok(payload);
    } catch {
      return unauthorized('Invalid or expired session.');
    }
  }
}
