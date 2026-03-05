import { IEventRepository } from '@/core/domain/contracts';

export class DeleteEventUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(id: string): Promise<void> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new DeleteEventError('Event not found.');
    }

    await this.eventRepository.softDelete(id);
  }
}

export class DeleteEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteEventError';
  }
}
