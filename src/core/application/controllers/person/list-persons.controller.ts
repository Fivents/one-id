import { ListPersonsUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListPersonsController {
  constructor(private readonly listPersonsUseCase: ListPersonsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const persons = await this.listPersonsUseCase.execute(organizationId);

      return ok(persons.map((person) => person.toJSON()));
    } catch {
      return serverError();
    }
  }
}
