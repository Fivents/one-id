'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import type { Permission, Role } from '@/core/domain/value-objects';
import { getPermissionsForRole, hasPermission as checkPermission } from '@/core/domain/value-objects';
import { AppError, ErrorCode } from '@/core/errors';

import { useAuth } from './auth-context';

// ── Constants ─────────────────────────────────────────────────────

const SUPER_ADMIN_DOMAIN = 'fivents.com';

// ── Types ─────────────────────────────────────────────────────────

interface PermissionsContextValue {
  role: Role | null;
  permissions: Permission[];
  hasPermission: (...required: Permission[]) => boolean;
  isSuperAdmin: () => boolean;
  isOrgOwner: () => boolean;
  canManageEvent: () => boolean;
}

// ── Context ───────────────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const role = user?.role ?? null;

  const permissions = useMemo<Permission[]>(() => {
    if (!role) return [];
    if (role === 'SUPER_ADMIN') return [];
    return getPermissionsForRole(role);
  }, [role]);

  const hasPermission = useCallback(
    (...required: Permission[]): boolean => {
      if (!role) return false;
      return checkPermission(role, required);
    },
    [role],
  );

  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false;
    return user.role === 'SUPER_ADMIN' && user.email.endsWith(`@${SUPER_ADMIN_DOMAIN}`);
  }, [user]);

  const isOrgOwner = useCallback((): boolean => {
    return role === 'ORG_OWNER';
  }, [role]);

  const canManageEvent = useCallback((): boolean => {
    if (!role) return false;
    if (role === 'SUPER_ADMIN') return true;
    return checkPermission(role, ['EVENT_CREATE', 'EVENT_UPDATE']);
  }, [role]);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      role,
      permissions,
      hasPermission,
      isSuperAdmin,
      isOrgOwner,
      canManageEvent,
    }),
    [role, permissions, hasPermission, isSuperAdmin, isOrgOwner, canManageEvent],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new AppError({
      code: ErrorCode.AUTH_CONTEXT_MISSING,
      message: 'usePermissions must be used within a PermissionsProvider.',
      httpStatus: 500,
      level: 'critical',
    });
  }

  return context;
}
