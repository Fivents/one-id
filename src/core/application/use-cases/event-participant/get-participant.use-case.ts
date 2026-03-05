import { IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';

export class GetParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string): Promise<EventParticipantEntity> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new GetParticipantError('Participant not found.');
    }

    return participant;
  }
}

export class GetParticipantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetParticipantError';
  }
}
