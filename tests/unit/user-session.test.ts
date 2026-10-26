import { beforeEach, describe, expect, it } from 'vitest';

import { issueUserSession, verifyUserSession } from '@/core/application/services/user-session';
import { LoginWithTokenUseCase } from '@/core/application/use-cases/auth/login-with-token.use-case';
import { LogoutUseCase } from '@/core/application/use-cases/auth/logout.use-case';
import { RefreshSessionUseCase } from '@/core/application/use-cases/auth/refresh-session.use-case';
import type { IUserRepository } from '@/core/domain/contracts';
import type { CreateSessionData, ISessionRepository } from '@/core/domain/contracts/session.repository';
import { JoseTokenProvider } from '@/core/infrastructure/providers/jose-token-provider';

class InMemorySessionRepository implements ISessionRepository {
  sessions = new Map<string, { id: string; userId: string; expiresAt: Date }>();

  async createUserSession(data: CreateSessionData) {
    const id = data.id ?? `s-${this.sessions.size + 1}`;
    this.sessions.set(id, { id, userId: data.userId, expiresAt: data.expiresAt });
    return { id };
  }
  async createTotemSession() {
    return { id: 'totem-session' };
  }
  async findUserSessionById(id: string) {
    return this.sessions.get(id) ?? null;
  }
  async findUserSessionsByUserId() {
    return [];
  }
  async revokeUserSession(id: string) {
    this.sessions.delete(id);
  }
  async expireUserSessionAt(id: string, at: Date) {
    const session = this.sessions.get(id);
    if (session && session.expiresAt > at) session.expiresAt = at;
  }
  async revokeUserSessions(userId: string) {
    for (const [id, session] of this.sessions) if (session.userId === userId) this.sessions.delete(id);
  }
  async revokeTotemSessions() {}
  async findTotemSessionById() {
    return null;
  }
}

const USER = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  role: 'ORG_OWNER' as const,
  organizationId: 'org-1',
};
const users = { findByEmailWithMembership: async () => USER } as unknown as IUserRepository;
const META = { deviceId: 'd', ipAddress: '127.0.0.1', userAgent: 'test' };
const CLAIMS = { sub: USER.id, name: USER.name, email: USER.email, role: USER.role, type: 'client' as const };

describe('user sessions', () => {
  let tokenProvider: JoseTokenProvider;
  let sessionRepository: InMemorySessionRepository;
  let deps: { tokenProvider: JoseTokenProvider; sessionRepository: InMemorySessionRepository };

  beforeEach(() => {
    tokenProvider = new JoseTokenProvider('test-secret-that-is-long-enough-for-hs256');
    sessionRepository = new InMemorySessionRepository();
    deps = { tokenProvider, sessionRepository };
  });

  it('binds every issued token to a stored session', async () => {
    const token = await issueUserSession(deps, CLAIMS, META);
    const payload = await tokenProvider.verifyUserToken(token);
    expect(payload.sid).toBeDefined();
    expect(sessionRepository.sessions.has(payload.sid as string)).toBe(true);
    await expect(verifyUserSession(deps, token)).resolves.toMatchObject({ sub: USER.id });
  });

  it('rejects a token once its session is revoked (logout)', async () => {
    const token = await issueUserSession(deps, CLAIMS, META);
    const { sid } = await tokenProvider.verifyUserToken(token);
    await new LogoutUseCase(sessionRepository).execute(sid as string);
    await expect(verifyUserSession(deps, token)).rejects.toThrow('Session is no longer valid.');
  });

  it('logout ends only the current session', async () => {
    const first = await issueUserSession(deps, CLAIMS, META);
    const second = await issueUserSession(deps, CLAIMS, META);
    const { sid } = await tokenProvider.verifyUserToken(first);
    await new LogoutUseCase(sessionRepository).execute(sid as string);
    await expect(verifyUserSession(deps, second)).resolves.toBeDefined();
  });

  it('rejects legacy tokens without a session id, so they cannot be refreshed forever', async () => {
    const legacy = await tokenProvider.signUserToken(CLAIMS);
    await expect(verifyUserSession(deps, legacy)).rejects.toThrow();
    const refresh = new RefreshSessionUseCase(tokenProvider, users, sessionRepository);
    await expect(refresh.execute(legacy, META)).rejects.toThrow();
  });

  it('rejects expired sessions and sessions of another user', async () => {
    const token = await issueUserSession(deps, CLAIMS, META);
    const { sid } = await tokenProvider.verifyUserToken(token);
    const session = sessionRepository.sessions.get(sid as string);
    if (!session) throw new Error('missing session');

    session.expiresAt = new Date(Date.now() - 1000);
    await expect(verifyUserSession(deps, token)).rejects.toThrow();

    session.expiresAt = new Date(Date.now() + 60_000);
    session.userId = 'someone-else';
    await expect(verifyUserSession(deps, token)).rejects.toThrow();
  });

  it('refresh rotates: new token works, old one only during a short grace period', async () => {
    const oldToken = await issueUserSession(deps, CLAIMS, META);
    const { sid: oldSid } = await tokenProvider.verifyUserToken(oldToken);
    const refresh = new RefreshSessionUseCase(tokenProvider, users, sessionRepository);

    const { token: newToken } = await refresh.execute(oldToken, META);
    await expect(verifyUserSession(deps, newToken)).resolves.toBeDefined();

    const retired = sessionRepository.sessions.get(oldSid as string);
    expect(retired && retired.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30_000);
    await expect(verifyUserSession(deps, oldToken)).resolves.toBeDefined();

    if (retired) retired.expiresAt = new Date(Date.now() - 1);
    await expect(verifyUserSession(deps, oldToken)).rejects.toThrow();
  });

  it('a refreshed token cannot be used after logout', async () => {
    const token = await issueUserSession(deps, CLAIMS, META);
    const refresh = new RefreshSessionUseCase(tokenProvider, users, sessionRepository);
    const { token: refreshed } = await refresh.execute(token, META);
    const { sid } = await tokenProvider.verifyUserToken(refreshed);
    await new LogoutUseCase(sessionRepository).execute(sid as string);
    await expect(refresh.execute(refreshed, META)).rejects.toThrow();
  });

  it('token exchange (token-login) also requires a live session', async () => {
    const token = await issueUserSession(deps, CLAIMS, META);
    const { sid } = await tokenProvider.verifyUserToken(token);
    const exchange = new LoginWithTokenUseCase(tokenProvider, users, sessionRepository);
    await expect(exchange.execute(token, META)).resolves.toMatchObject({ user: { id: USER.id } });
    await sessionRepository.revokeUserSession(sid as string);
    await expect(exchange.execute(token, META)).rejects.toThrow();
  });
});
