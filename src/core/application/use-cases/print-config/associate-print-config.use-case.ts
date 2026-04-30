import { IEventRepository, IPrintConfigRepository } from '@/core/domain/contracts';
import type { EventEntity } from '@/core/domain/entities';
import { EventNotFoundError, PrintConfigNotFoundError } from '@/core/errors';

export class AssociatePrintConfigUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly printConfigRepository: IPrintConfigRepository,
  ) {}

  async execute(eventId: string, printConfigId: string): Promise<EventEntity> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    const config = await this.printConfigRepository.findById(printConfigId);

    if (!config) {
      throw new PrintConfigNotFoundError(printConfigId);
    }

    return this.eventRepository.update(eventId, { printConfigId });
  }
}
