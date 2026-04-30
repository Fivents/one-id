import { IEventRepository, UpdateEventData } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';
import { EventNotFoundError } from '@/core/errors';

export class UpdateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string, data: UpdateEventData): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    return this.eventRepository.update(id, data);
  }
}
