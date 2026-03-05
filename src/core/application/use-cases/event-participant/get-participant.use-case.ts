import { IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';
import { ParticipantNotFoundError } from '@/core/errors';

export class GetParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string): Promise<EventParticipantEntity> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new ParticipantNotFoundError(id);
    }

    return participant;
  }
}
