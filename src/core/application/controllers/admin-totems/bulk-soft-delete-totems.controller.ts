import { BulkSoftDeleteTotemsUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class BulkSoftDeleteTotemsController {
  constructor(private readonly bulkSoftDeleteTotemsUseCase: BulkSoftDeleteTotemsUseCase) {}

  async handle(totemIds: string[]): Promise<ControllerResponse<null>> {
    try {
      await this.bulkSoftDeleteTotemsUseCase.execute(totemIds);
      return noContent();
    } catch {
      return serverError();
    }
  }
}
