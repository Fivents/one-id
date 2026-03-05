import { CreateSessionData, CreateTotemSessionData, ISessionRepository } from '@/core/domain/contracts';
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

  async findUserSessionById(id: string): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    const session = await this.db.session.findUnique({
      where: { id },
      select: { id: true, userId: true, expiresAt: true },
    });

    return session;
  }

  async findUserSessionsByUserId(
    userId: string,
  ): Promise<
    { id: string; deviceId: string; ipAddress: string; userAgent: string; expiresAt: Date; createdAt: Date }[]
  > {
    return this.db.session.findMany({
      where: { userId },
      select: { id: true, deviceId: true, ipAddress: true, userAgent: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeUserSession(id: string): Promise<void> {
    await this.db.session.delete({ where: { id } });
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.db.session.deleteMany({ where: { userId } });
  }

  async revokeTotemSessions(totemId: string): Promise<void> {
    await this.db.totemSession.deleteMany({
      where: { totemId },
    });
  }

  async findTotemSessionById(id: string): Promise<{ id: string; totemId: string; expiresAt: Date } | null> {
    const session = await this.db.totemSession.findUnique({
      where: { id },
      select: { id: true, totemId: true, expiresAt: true },
    });

    return session;
  }
}
