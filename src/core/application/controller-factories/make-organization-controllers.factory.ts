import {
  makeActivateOrganizationUseCase,
  makeCreateOrganizationUseCase,
  makeDeactivateOrganizationUseCase,
  makeDeleteOrganizationUseCase,
  makeGetOrganizationUseCase,
  makeListOrganizationsUseCase,
  makeUpdateOrganizationUseCase,
} from '@/core/infrastructure/factories';

import {
  ActivateOrganizationController,
  CreateOrganizationController,
  DeactivateOrganizationController,
  DeleteOrganizationController,
  GetOrganizationController,
  ListOrganizationsController,
  UpdateOrganizationController,
} from '../controllers/organization';

export function makeCreateOrganizationController(): CreateOrganizationController {
  return new CreateOrganizationController(makeCreateOrganizationUseCase());
}

export function makeGetOrganizationController(): GetOrganizationController {
  return new GetOrganizationController(makeGetOrganizationUseCase());
}

export function makeUpdateOrganizationController(): UpdateOrganizationController {
  return new UpdateOrganizationController(makeUpdateOrganizationUseCase());
}

export function makeDeleteOrganizationController(): DeleteOrganizationController {
  return new DeleteOrganizationController(makeDeleteOrganizationUseCase());
}

export function makeListOrganizationsController(): ListOrganizationsController {
  return new ListOrganizationsController(makeListOrganizationsUseCase());
}

export function makeActivateOrganizationController(): ActivateOrganizationController {
  return new ActivateOrganizationController(makeActivateOrganizationUseCase());
}

export function makeDeactivateOrganizationController(): DeactivateOrganizationController {
  return new DeactivateOrganizationController(makeDeactivateOrganizationUseCase());
}
