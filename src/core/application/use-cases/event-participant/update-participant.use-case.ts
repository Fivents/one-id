import { IEventParticipantRepository, UpdateEventParticipantData } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';

export class UpdateParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string, data: UpdateEventParticipantData): Promise<EventParticipantEntity> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new UpdateParticipantError('Participant not found.');
    }

    return this.eventParticipantRepository.update(id, data);
  }
}

export class UpdateParticipantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateParticipantError';
  }
}
