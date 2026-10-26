import { createHash, randomUUID } from 'node:crypto';

import type { ISessionRepository } from '@/core/domain/contracts/session.repository';
import type { ITokenProvider, UserTokenPayload } from '@/core/domain/contracts/token-provider';
import { UnauthorizedError } from '@/core/errors';

/** Matches the JWT lifetime set by the token provider. */
export const USER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface UserSessionDeps {
  tokenProvider: ITokenProvider;
  sessionRepository: ISessionRepository;
}

export interface UserSessionMeta {
  deviceId: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Signs a user token bound to a new session row. The token carries the session id (`sid`) so
 * every request can check, with one primary-key lookup, that the session still exists — which
 * is what makes logout and session revocation actually end access.
 */
export async function issueUserSession(
  deps: UserSessionDeps,
  claims: Omit<UserTokenPayload, 'sid'>,
  meta: UserSessionMeta,
): Promise<string> {
  const sessionId = randomUUID();
  const token = await deps.tokenProvider.signUserToken({ ...claims, sid: sessionId });

  await deps.sessionRepository.createUserSession({
    id: sessionId,
    userId: claims.sub,
    // Never used for lookup; kept so a leaked table cannot be replayed as tokens.
    tokenHash: createHash('sha256').update(token).digest('hex'),
    deviceId: meta.deviceId,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    expiresAt: new Date(Date.now() + USER_SESSION_TTL_MS),
  });

  return token;
}

/**
 * A valid signature is not enough: the session must still exist (not logged out or revoked),
 * belong to the token's user and be unexpired. Tokens issued before `sid` existed are rejected,
 * so they cannot be refreshed forever.
 */
export async function verifyUserSession(deps: UserSessionDeps, token: string): Promise<UserTokenPayload> {
  const payload = await deps.tokenProvider.verifyUserToken(token);

  if (!payload.sid) {
    throw new UnauthorizedError('Session is no longer valid.');
  }

  const session = await deps.sessionRepository.findUserSessionById(payload.sid);

  if (!session || session.userId !== payload.sub || session.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError('Session is no longer valid.');
  }

  return payload;
}
