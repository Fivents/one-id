import type { ICooldownService, PersonCooldownState } from '@/core/domain/contracts/cooldown.service';
import type { PrismaClient } from '@/generated/prisma/client';

export class CooldownService implements ICooldownService {
  private readonly baseInitialMs = 5_000; // 5 seconds
  private readonly maxCooldownMs = 60_000; // 60 seconds (1 minute)

  constructor(private readonly db: PrismaClient) {}

  async isPersonInCooldown(eventParticipantId: string, eventId: string): Promise<boolean> {
    const cooldown = await this.db.personCheckInCooldown.findUnique({
      where: {
        eventParticipantId_eventId: { eventParticipantId, eventId },
      },
    });

    if (!cooldown) {
      return false;
    }

    return cooldown.cooldownEndsAt > new Date();
  }

  async getRemainingCooldownMs(eventParticipantId: string, eventId: string): Promise<number> {
    const cooldown = await this.db.personCheckInCooldown.findUnique({
      where: {
        eventParticipantId_eventId: { eventParticipantId, eventId },
      },
    });

    if (!cooldown) {
      return 0;
    }

    const remaining = cooldown.cooldownEndsAt.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  async registerFailedAttempt(eventParticipantId: string, eventId: string): Promise<PersonCooldownState> {
    let cooldown = await this.db.personCheckInCooldown.findUnique({
      where: {
        eventParticipantId_eventId: { eventParticipantId, eventId },
      },
    });

    if (!cooldown) {
      // First failure attempt in this event
      cooldown = await this.db.personCheckInCooldown.create({
        data: {
          eventParticipantId,
          eventId,
          failedAttempts: 1,
          currentCooldownMs: this.baseInitialMs,
          cooldownEndsAt: new Date(Date.now() + this.baseInitialMs),
          lastAttemptAt: new Date(),
        },
      });
    } else {
      // Exponential backoff: 5s → 10s → 30s → 60s
      // Formula: min(baseMs * 2^failedAttempts, maxCooldownMs)
      const newCooldownMs = Math.min(this.baseInitialMs * Math.pow(2, cooldown.failedAttempts), this.maxCooldownMs);

      cooldown = await this.db.personCheckInCooldown.update({
        where: {
          eventParticipantId_eventId: { eventParticipantId, eventId },
        },
        data: {
          failedAttempts: cooldown.failedAttempts + 1,
          currentCooldownMs: newCooldownMs,
          cooldownEndsAt: new Date(Date.now() + newCooldownMs),
          lastAttemptAt: new Date(),
        },
      });
    }

    return this.mapToCooldownState(cooldown);
  }

  async registerSuccessfulCheckIn(eventParticipantId: string, eventId: string): Promise<PersonCooldownState> {
    let cooldown = await this.db.personCheckInCooldown.findUnique({
      where: {
        eventParticipantId_eventId: { eventParticipantId, eventId },
      },
    });

    if (!cooldown) {
      // First check-in ever in this event
      const now = new Date();
      cooldown = await this.db.personCheckInCooldown.create({
        data: {
          eventParticipantId,
          eventId,
          failedAttempts: 0,
          currentCooldownMs: this.baseInitialMs,
          cooldownEndsAt: now,
          lastAttemptAt: now,
          resetAt: now,
        },
      });
    } else {
      // Reset failed attempts on success (but only for this event)
      const now = new Date();
      cooldown = await this.db.personCheckInCooldown.update({
        where: {
          eventParticipantId_eventId: { eventParticipantId, eventId },
        },
        data: {
          failedAttempts: 0,
          currentCooldownMs: this.baseInitialMs, // Reset to base
          cooldownEndsAt: now, // No cooldown after success
          lastAttemptAt: now,
          resetAt: now,
        },
      });
    }

    return this.mapToCooldownState(cooldown);
  }

  async canAdminOverride(eventParticipantId: string, eventId: string): Promise<boolean> {
    const cooldown = await this.db.personCheckInCooldown.findUnique({
      where: {
        eventParticipantId_eventId: { eventParticipantId, eventId },
      },
    });

    // Admin can override if:
    // 1. No cooldown exists yet, OR
    // 2. Cooldown is expired, OR
    // 3. Less than 3 failed attempts
    return !cooldown || cooldown.cooldownEndsAt <= new Date() || cooldown.failedAttempts < 3;
  }

  private mapToCooldownState(cooldown: {
    eventParticipantId: string;
    failedAttempts: number;
    currentCooldownMs: number;
    cooldownEndsAt: Date;
    lastAttemptAt: Date;
    resetAt: Date | null;
  }): PersonCooldownState {
    return {
      eventParticipantId: cooldown.eventParticipantId,
      failedAttempts: cooldown.failedAttempts,
      currentCooldownMs: cooldown.currentCooldownMs,
      cooldownEndsAt: cooldown.cooldownEndsAt,
      lastAttemptAt: cooldown.lastAttemptAt,
      lastSuccessAt: cooldown.resetAt,
    };
  }
}
