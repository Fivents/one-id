import { IEventRepository, IPrintConfigRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';

export class AssociatePrintConfigUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly printConfigRepository: IPrintConfigRepository,
  ) {}

  async execute(eventId: string, printConfigId: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new AssociatePrintConfigError('Event not found.');
    }

    const config = await this.printConfigRepository.findById(printConfigId);

    if (!config) {
      throw new AssociatePrintConfigError('Print config not found.');
    }

    return this.eventRepository.update(eventId, { printConfigId });
  }
}

export class AssociatePrintConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssociatePrintConfigError';
  }
}
