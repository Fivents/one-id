import type {
  CreateSessionData,
  CreateTotemSessionData,
  ISessionRepository,
} from '@/domain/auth/contracts/session.repository';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async createUserSession(data: CreateSessionData): Promise<{ id: string }> {
    const session = await this.db.session.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });

    return { id: session.id };
  }

  async createTotemSession(data: CreateTotemSessionData): Promise<{ id: string }> {
    const session = await this.db.totemSession.create({
      data: {
        totemId: data.totemId,
        tokenHash: data.tokenHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });

    return { id: session.id };
  }

  async revokeTotemSessions(totemId: string): Promise<void> {
    await this.db.totemSession.deleteMany({
      where: { totemId },
    });
  }
}
