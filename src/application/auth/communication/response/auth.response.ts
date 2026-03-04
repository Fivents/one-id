import type { Role } from '@/domain/auth';

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  type: 'admin' | 'client';
  organizationId?: string;
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUserResponse;
}

export interface CheckEmailResponse {
  status: 'ready' | 'needs_setup';
  setupToken?: string;
}

export interface TotemAuthResponse {
  token: string;
  totem: {
    id: string;
    name: string;
  };
}
