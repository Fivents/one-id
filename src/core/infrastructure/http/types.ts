import type { NextRequest } from 'next/server';

import type { Permission } from '@/core/domain/value-objects/permission';
import type { Role } from '@/core/domain/value-objects/role';

export interface UserAuthContext {
  type: 'user';
  userId: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  permissions: Permission[];
}

export interface TotemAuthContext {
  type: 'totem';
  totemSessionId: string;
  totemName: string;
}

export type AuthContext = UserAuthContext | TotemAuthContext;

export type RouteContext = { params: Promise<Record<string, string>> };

export type RouteHandler = (req: NextRequest, context: RouteContext) => Promise<Response>;

const authContextStore = new WeakMap<NextRequest, AuthContext>();

export function setAuthContext(req: NextRequest, ctx: AuthContext): void {
  authContextStore.set(req, ctx);
}

export function getAuthContext(req: NextRequest): AuthContext {
  const ctx = authContextStore.get(req);
  if (!ctx) throw new Error('Auth context not available. Ensure withAuth middleware is applied.');
  return ctx;
}

export function getUserAuth(req: NextRequest): UserAuthContext {
  const ctx = getAuthContext(req);
  if (ctx.type !== 'user') throw new Error('Expected user auth context.');
  return ctx;
}

export function getTotemAuth(req: NextRequest): TotemAuthContext {
  const ctx = getAuthContext(req);
  if (ctx.type !== 'totem') throw new Error('Expected totem auth context.');
  return ctx;
}
