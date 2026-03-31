/**
 * CooldownService
 *
 * Implements intelligent anti-fraud cooldown with exponential backoff.
 * Failed attempts trigger progressively longer cooldowns:
 * 1st attempt: 5s
 * 2nd attempt: 10s
 * 3rd attempt: 30s
 * 4th+ attempt: 60s (max)
 *
 * Scoped per event: cooldown resets when moving between events
 */

export interface PersonCooldownState {
  eventParticipantId: string;
  failedAttempts: number;
  currentCooldownMs: number;
  cooldownEndsAt: Date;
  lastAttemptAt: Date;
  lastSuccessAt: Date | null;
}

export interface ICooldownService {
  /**
   * Check if person is currently in cooldown period (per-event scoped)
   */
  isPersonInCooldown(eventParticipantId: string, eventId: string): Promise<boolean>;

  /**
   * Get remaining cooldown time in milliseconds
   */
  getRemainingCooldownMs(eventParticipantId: string, eventId: string): Promise<number>;

  /**
   * Register a failed check-in attempt (increases cooldown exponentially)
   */
  registerFailedAttempt(eventParticipantId: string, eventId: string): Promise<PersonCooldownState>;

  /**
   * Register a successful check-in (resets cooldown for this event)
   */
  registerSuccessfulCheckIn(eventParticipantId: string, eventId: string): Promise<PersonCooldownState>;

  /**
   * Check if admin override is allowed (less than 3 failed attempts or expired cooldown)
   */
  canAdminOverride(eventParticipantId: string, eventId: string): Promise<boolean>;
}
