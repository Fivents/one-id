import { ListMembersUseCase } from '../../use-cases/membership';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListMembersController {
  constructor(private readonly listMembersUseCase: ListMembersUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const members = await this.listMembersUseCase.execute(organizationId);

      return ok(members.map((member) => member.toJSON()));
    } catch {
      return serverError();
    }
  }
}
