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
  revokeTotemSessions(totemId: string): Promise<void>;
}
