import { RenewTotemSessionError, RenewTotemSessionUseCase } from '../../use-cases/totem-session';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export interface RenewTotemSessionMeta {
  ipAddress: string;
  userAgent: string;
}

export class RenewTotemSessionController {
  constructor(private readonly renewTotemSessionUseCase: RenewTotemSessionUseCase) {}

  async handle(totemId: string, meta: RenewTotemSessionMeta): Promise<ControllerResponse<{ token: string }>> {
    try {
      const result = await this.renewTotemSessionUseCase.execute(totemId, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof RenewTotemSessionError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
