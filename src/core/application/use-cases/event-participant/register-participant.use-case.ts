import { CreateEventParticipantData, IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';

export class RegisterParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(data: CreateEventParticipantData): Promise<EventParticipantEntity> {
    const existing = await this.eventParticipantRepository.findByPersonAndEvent(data.personId, data.eventId);

    if (existing) {
      throw new RegisterParticipantError('Person is already registered for this event.');
    }

    return this.eventParticipantRepository.create(data);
  }
}

export class RegisterParticipantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegisterParticipantError';
  }
}
