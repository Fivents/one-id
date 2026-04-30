import { CreateEventParticipantData, IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';
import { ParticipantAlreadyRegisteredError } from '@/core/errors';

export class RegisterParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(data: CreateEventParticipantData): Promise<EventParticipantEntity> {
    const existing = await this.eventParticipantRepository.findByPersonAndEvent(data.personId, data.eventId);

    if (existing) {
      throw new ParticipantAlreadyRegisteredError({ personId: data.personId, eventId: data.eventId });
    }

    return this.eventParticipantRepository.create(data);
  }
}
