import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class ActivateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new ActivateEventError('Event not found.');
    }

    if (!event.canTransitionTo('ACTIVE')) {
      throw new ActivateEventError(`Cannot activate event with status "${event.status}".`);
    }

    return this.eventRepository.update(id, { status: 'ACTIVE' });
  }
}

export class ActivateEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivateEventError';
  }
}
