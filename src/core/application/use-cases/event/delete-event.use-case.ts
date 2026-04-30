import { IEventRepository } from '@/core/domain/contracts';
import { EventNotFoundError } from '@/core/errors';

export class DeleteEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<void> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    await this.eventRepository.softDelete(id);
  }
}
