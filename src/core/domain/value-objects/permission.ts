import type { Role } from './role';

export type Permission =
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_DELETE'
  | 'EVENT_VIEW'
  | 'PARTICIPANT_MANAGE'
  | 'PARTICIPANT_VIEW'
  | 'CHECKIN_VIEW'
  | 'CHECKIN_MANAGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_VIEW'
  | 'ORGANIZATION_CREATE'
  | 'ORGANIZATION_UPDATE'
  | 'ORGANIZATION_DELETE'
  | 'ORGANIZATION_VIEW'
  | 'TOTEM_CREATE'
  | 'TOTEM_MANAGE'
  | 'TOTEM_UPDATE'
  | 'TOTEM_DELETE'
  | 'TOTEM_VIEW';

const ORG_OWNER_PERMISSIONS: Permission[] = [
  'EVENT_CREATE',
  'EVENT_UPDATE',
  'EVENT_DELETE',
  'EVENT_VIEW',
  'PARTICIPANT_MANAGE',
  'PARTICIPANT_VIEW',
  'CHECKIN_VIEW',
  'CHECKIN_MANAGE',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'USER_VIEW',
  'ORGANIZATION_UPDATE',
  'ORGANIZATION_VIEW',
  'TOTEM_CREATE',
  'TOTEM_MANAGE',
  'TOTEM_UPDATE',
  'TOTEM_DELETE',
  'TOTEM_VIEW',
];

const EVENT_MANAGER_PERMISSIONS: Permission[] = [
  'EVENT_CREATE',
  'EVENT_UPDATE',
  'EVENT_VIEW',
  'PARTICIPANT_MANAGE',
  'PARTICIPANT_VIEW',
  'CHECKIN_VIEW',
  'CHECKIN_MANAGE',
  'TOTEM_MANAGE',
  'TOTEM_VIEW',
];

const ROLE_PERMISSIONS: Record<Exclude<Role, 'SUPER_ADMIN'>, Permission[]> = {
  ORG_OWNER: ORG_OWNER_PERMISSIONS,
  EVENT_MANAGER: EVENT_MANAGER_PERMISSIONS,
};

export function getPermissionsForRole(role: Role): Permission[] {
  if (role === 'SUPER_ADMIN') return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, required: Permission[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const rolePermissions = getPermissionsForRole(role);
  return required.every((p) => rolePermissions.includes(p));
}
