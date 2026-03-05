import { IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class GetEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new GetEventError('Event not found.');
    }

    return event;
  }
}

export class GetEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetEventError';
  }
}
