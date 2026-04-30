import type { CheckInEntity, CheckInMethod } from '../entities/check-in.entity';

export interface CreateCheckInData {
  method: CheckInMethod;
  confidence?: number | null;
  checkedInAt: Date;
  eventParticipantId: string;
  totemEventSubscriptionId?: string | null;
}

export interface ICheckInRepository {
  findByParticipantAndLocation(
    eventParticipantId: string,
    totemEventSubscriptionId: string,
  ): Promise<CheckInEntity | null>;
  findByEvent(eventId: string): Promise<CheckInEntity[]>;
  findByParticipant(eventParticipantId: string): Promise<CheckInEntity[]>;
  create(data: CreateCheckInData): Promise<CheckInEntity>;
}
