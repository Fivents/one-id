import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';
import { EventInvalidTransitionError, EventNotFoundError } from '@/core/errors';

export class CompleteEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    if (!event.canTransitionTo('COMPLETED')) {
      throw new EventInvalidTransitionError(event.status, 'COMPLETED');
    }

    return this.eventRepository.update(id, { status: 'COMPLETED' });
  }
}
