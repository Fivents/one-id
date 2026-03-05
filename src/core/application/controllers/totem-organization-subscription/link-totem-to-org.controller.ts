import type { LinkTotemToOrgRequest } from '@/core/communication/requests/totem-organization-subscription';

import { LinkTotemToOrgError, LinkTotemToOrgUseCase } from '../../use-cases/totem-organization-subscription';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class LinkTotemToOrgController {
  constructor(private readonly linkTotemToOrgUseCase: LinkTotemToOrgUseCase) {}

  async handle(request: LinkTotemToOrgRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const subscription = await this.linkTotemToOrgUseCase.execute(request);

      return created(subscription.toJSON());
    } catch (error) {
      if (error instanceof LinkTotemToOrgError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
