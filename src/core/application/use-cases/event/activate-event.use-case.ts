import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';
import { EventInvalidTransitionError, EventNotFoundError } from '@/core/errors';

export class ActivateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    if (!event.canTransitionTo('ACTIVE')) {
      throw new EventInvalidTransitionError(event.status, 'ACTIVE');
    }

    return this.eventRepository.update(id, { status: 'ACTIVE' });
  }
}
