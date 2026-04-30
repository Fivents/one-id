import { CreateEventData, IEventRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class CreateEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(data: CreateEventData): Promise<EventEntity> {
    return this.eventRepository.create(data);
  }
}
