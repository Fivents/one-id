import type { EventResponse } from './event.response';

export interface EventSummaryResponse extends EventResponse {
  participantsCount: number;
  checkInsCount: number;
  totemsCount: number;
}
