import { IEventParticipantRepository } from '@/core/domain/contracts';

export class RemoveParticipantUseCase {
  constructor(private readonly eventParticipantRepository: IEventParticipantRepository) {}

  async execute(id: string): Promise<void> {
    const participant = await this.eventParticipantRepository.findById(id);

    if (!participant) {
      throw new RemoveParticipantError('Participant not found.');
    }

    await this.eventParticipantRepository.softDelete(id);
  }
}

export class RemoveParticipantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoveParticipantError';
  }
}
