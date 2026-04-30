import { IEventParticipantRepository, UpdateEventParticipantData } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';
import { ParticipantNotFoundError } from '@/core/errors';

export class UpdateParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string, data: UpdateEventParticipantData): Promise<EventParticipantEntity> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new ParticipantNotFoundError(id);
    }

    return this.eventParticipantRepository.update(id, data);
  }
}
