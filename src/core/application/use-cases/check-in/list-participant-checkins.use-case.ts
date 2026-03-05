import { ICheckInRepository } from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';

export class ListParticipantCheckInsUseCase {
  constructor(private readonly checkInRepository: ICheckInRepository) {}

  async execute(eventParticipantId: string): Promise<CheckInEntity[]> {
    return this.checkInRepository.findByParticipant(eventParticipantId);
  }
}
