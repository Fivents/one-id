import { IOrganizationRepository } from '@/core/domain/contracts';

export class DeleteOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<void> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new DeleteOrganizationError('Organization not found.');
    }

    await this.organizationRepository.softDelete(id);
  }
}

export class DeleteOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteOrganizationError';
  }
}
