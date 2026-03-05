import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class CancelEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new CancelEventError('Event not found.');
    }

    if (!event.canTransitionTo('CANCELED')) {
      throw new CancelEventError(`Cannot cancel event with status "${event.status}".`);
    }

    return this.eventRepository.update(id, { status: 'CANCELED' });
  }
}

export class CancelEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CancelEventError';
  }
}
