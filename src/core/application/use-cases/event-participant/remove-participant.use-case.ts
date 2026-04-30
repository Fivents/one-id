import { IEventParticipantRepository } from '@/core/domain/contracts';
import { ParticipantNotFoundError } from '@/core/errors';

export class RemoveParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string): Promise<void> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new ParticipantNotFoundError(id);
    }

    await this.eventParticipantRepository.softDelete(id);
  }
}
