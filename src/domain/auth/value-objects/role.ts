export type Role = 'SUPER_ADMIN' | 'ORG_OWNER' | 'EVENT_MANAGER';

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN'];
export const CLIENT_ROLES: Role[] = ['ORG_OWNER', 'EVENT_MANAGER'];

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isClientRole(role: Role): boolean {
  return CLIENT_ROLES.includes(role);
}
