import { ICheckInRepository } from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';

export class ListEventCheckInsUseCase {
  constructor(private readonly checkInRepository: ICheckInRepository) {}

  async execute(eventId: string): Promise<CheckInEntity[]> {
    return this.checkInRepository.findByEvent(eventId);
  }
}
