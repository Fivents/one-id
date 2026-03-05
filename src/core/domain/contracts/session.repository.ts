export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

export interface CreateTotemSessionData {
  totemId: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

export interface ISessionRepository {
  createUserSession(data: CreateSessionData): Promise<{ id: string }>;
  createTotemSession(data: CreateTotemSessionData): Promise<{ id: string }>;
  findUserSessionById(id: string): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
  findUserSessionsByUserId(
    userId: string,
  ): Promise<
    { id: string; deviceId: string; ipAddress: string; userAgent: string; expiresAt: Date; createdAt: Date }[]
  >;
  revokeUserSession(id: string): Promise<void>;
  revokeUserSessions(userId: string): Promise<void>;
  revokeTotemSessions(totemId: string): Promise<void>;
  findTotemSessionById(id: string): Promise<{ id: string; totemId: string; expiresAt: Date } | null>;
}
