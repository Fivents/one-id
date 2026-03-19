import type { NextRequest } from 'next/server';

import type { Permission } from '@/core/domain/value-objects/permission';
import type { Role } from '@/core/domain/value-objects/role';
import { AppError, ErrorCode } from '@/core/errors';

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
  totemId: string;
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
  if (!ctx)
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'Auth context not available. Ensure withAuth middleware is applied.',
      httpStatus: 500,
      level: 'critical',
    });
  return ctx;
}

export function getUserAuth(req: NextRequest): UserAuthContext {
  const ctx = getAuthContext(req);
  if (ctx.type !== 'user')
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'Expected user auth context.',
      httpStatus: 500,
      level: 'critical',
    });
  return ctx;
}

export function getTotemAuth(req: NextRequest): TotemAuthContext {
  const ctx = getAuthContext(req);
  if (ctx.type !== 'totem')
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'Expected totem auth context.',
      httpStatus: 500,
      level: 'critical',
    });
  return ctx;
}
