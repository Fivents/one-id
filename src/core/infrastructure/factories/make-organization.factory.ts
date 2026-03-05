import { containerService } from '@/core/application/services';
import { ActivateOrganizationUseCase } from '@/core/application/use-cases/organization/activate-organization.use-case';
import { CreateOrganizationUseCase } from '@/core/application/use-cases/organization/create-organization.use-case';
import { DeactivateOrganizationUseCase } from '@/core/application/use-cases/organization/deactivate-organization.use-case';
import { DeleteOrganizationUseCase } from '@/core/application/use-cases/organization/delete-organization.use-case';
import { GetOrganizationUseCase } from '@/core/application/use-cases/organization/get-organization.use-case';
import { ListOrganizationsUseCase } from '@/core/application/use-cases/organization/list-organizations.use-case';
import { UpdateOrganizationUseCase } from '@/core/application/use-cases/organization/update-organization.use-case';

export function makeCreateOrganizationUseCase(): CreateOrganizationUseCase {
  return new CreateOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeUpdateOrganizationUseCase(): UpdateOrganizationUseCase {
  return new UpdateOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeActivateOrganizationUseCase(): ActivateOrganizationUseCase {
  return new ActivateOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeDeactivateOrganizationUseCase(): DeactivateOrganizationUseCase {
  return new DeactivateOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeDeleteOrganizationUseCase(): DeleteOrganizationUseCase {
  return new DeleteOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeGetOrganizationUseCase(): GetOrganizationUseCase {
  return new GetOrganizationUseCase(containerService.getOrganizationRepository());
}

export function makeListOrganizationsUseCase(): ListOrganizationsUseCase {
  return new ListOrganizationsUseCase(containerService.getOrganizationRepository());
}
