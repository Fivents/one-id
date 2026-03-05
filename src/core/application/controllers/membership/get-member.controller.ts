import { GetMemberError, GetMemberUseCase } from '../../use-cases/membership';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetMemberController {
  constructor(private readonly getMemberUseCase: GetMemberUseCase) {}

  async handle(userId: string, organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const membership = await this.getMemberUseCase.execute(userId, organizationId);

      return ok(membership.toJSON());
    } catch (error) {
      if (error instanceof GetMemberError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
