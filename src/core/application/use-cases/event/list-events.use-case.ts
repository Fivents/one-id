import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class ListEventsUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(organizationId: string): Promise<EventEntity[]> {
    return this.eventRepository.findByOrganization(organizationId);
  }
}
