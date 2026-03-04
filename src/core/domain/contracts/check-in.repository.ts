import type { CheckInEntity, CheckInMethod } from '../entities/check-in.entity';

export interface CreateCheckInData {
  method: CheckInMethod;
  confidence?: number | null;
  checkedInAt: Date;
  eventParticipantId: string;
  totemEventSubscriptionId: string;
}

export interface ICheckInRepository {
  findByParticipantAndLocation(
    eventParticipantId: string,
    totemEventSubscriptionId: string,
  ): Promise<CheckInEntity | null>;
  create(data: CreateCheckInData): Promise<CheckInEntity>;
}
