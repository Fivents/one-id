import { IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';

export class ListParticipantsUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(eventId: string): Promise<EventParticipantEntity[]> {
    return this.eventParticipantRepository.findByEvent(eventId);
  }
}
