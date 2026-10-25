import { CreateEventParticipantData, IEventParticipantRepository } from '@/core/domain/contracts';
import type { EventParticipantEntity } from '@/core/domain/entities';
import { ParticipantAlreadyRegisteredError } from '@/core/errors';

export class RegisterParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(data: CreateEventParticipantData): Promise<EventParticipantEntity> {
    // Since EventParticipant became the ticket slot, "one participation per person per event"
    // is no longer a database constraint — a Sympla bulk order legitimately puts several
    // tickets in one event under one identity. It stays a rule for *manual* registration,
    // which is the only path that goes through this use-case, and it can only be checked when
    // an identity was actually supplied.
    if (data.personId) {
      const existing = await this.eventParticipantRepository.findByPersonAndEvent(data.personId, data.eventId);

      if (existing) {
        throw new ParticipantAlreadyRegisteredError({ personId: data.personId, eventId: data.eventId });
      }
    }

    return this.eventParticipantRepository.create(data);
  }
}
