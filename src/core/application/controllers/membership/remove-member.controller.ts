import { RemoveMemberError, RemoveMemberUseCase } from '../../use-cases/membership';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class RemoveMemberController {
  constructor(private readonly removeMemberUseCase: RemoveMemberUseCase) {}

  async handle(membershipId: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeMemberUseCase.execute(membershipId);

      return noContent();
    } catch (error) {
      if (error instanceof RemoveMemberError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
