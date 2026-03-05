import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class PublishEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new PublishEventError('Event not found.');
    }

    if (!event.canTransitionTo('PUBLISHED')) {
      throw new PublishEventError(`Cannot publish event with status "${event.status}".`);
    }

    return this.eventRepository.update(id, { status: 'PUBLISHED' });
  }
}

export class PublishEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishEventError';
  }
}
