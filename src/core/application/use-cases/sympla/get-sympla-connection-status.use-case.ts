import type { ISymplaConnectionRepository } from '@/core/domain/contracts';
import type { SymplaConnectionEntity } from '@/core/domain/entities';

export class GetSymplaConnectionStatusUseCase {
  constructor(private readonly connectionRepository: ISymplaConnectionRepository) {}

  async execute(organizationId: string): Promise<SymplaConnectionEntity | null> {
    return this.connectionRepository.findByOrganizationId(organizationId);
  }
}
