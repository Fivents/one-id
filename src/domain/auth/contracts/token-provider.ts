import type { Role } from '../value-objects/role';

export interface UserTokenPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  type: 'admin' | 'client';
  organizationId?: string;
}

export interface TotemTokenPayload {
  sub: string;
  name: string;
  type: 'totem';
}

export interface SetupTokenPayload {
  sub: string;
  purpose: 'password-setup';
}

export interface ITokenProvider {
  signUserToken(payload: UserTokenPayload): Promise<string>;
  signTotemToken(payload: TotemTokenPayload): Promise<string>;
  signSetupToken(payload: SetupTokenPayload): Promise<string>;
  verifyUserToken(token: string): Promise<UserTokenPayload>;
  verifyTotemToken(token: string): Promise<TotemTokenPayload>;
  verifySetupToken(token: string): Promise<SetupTokenPayload>;
}
