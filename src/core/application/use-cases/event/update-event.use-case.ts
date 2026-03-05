import { IEventRepository, UpdateEventData } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class UpdateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string, data: UpdateEventData): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new UpdateEventError('Event not found.');
    }

    return this.eventRepository.update(id, data);
  }
}

export class UpdateEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateEventError';
  }
}
