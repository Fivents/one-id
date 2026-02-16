import type { Role } from "@/generated/prisma/client";

// ============================================
// ROLE DISPLAY NAMES
// ============================================

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Administrador",
  ORG_OWNER: "Proprietário",
  ORG_ADMIN: "Administrador da Organização",
  EVENT_MANAGER: "Gerente de Eventos",
  STAFF: "Operador",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: "Acesso total ao sistema",
  ORG_OWNER: "Gerencia toda a organização, plano e membros",
  ORG_ADMIN: "Gerencia eventos e membros da organização",
  EVENT_MANAGER: "Gerencia eventos da organização",
  STAFF: "Apenas check-in nos totens",
};

// ============================================
// PERMISSIONS
// ============================================

export const Permission = {
  // Organizations
  ORG_CREATE: "org:create",
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  ORG_MANAGE_MEMBERS: "org:manage_members",
  ORG_LIST_ALL: "org:list_all",

  // Events
  EVENT_CREATE: "event:create",
  EVENT_READ: "event:read",
  EVENT_UPDATE: "event:update",
  EVENT_DELETE: "event:delete",
  EVENT_PUBLISH: "event:publish",
  EVENT_LIST_ALL: "event:list_all",

  // Participants
  PARTICIPANT_CREATE: "participant:create",
  PARTICIPANT_READ: "participant:read",
  PARTICIPANT_UPDATE: "participant:update",
  PARTICIPANT_DELETE: "participant:delete",
  PARTICIPANT_IMPORT: "participant:import",
  PARTICIPANT_EXPORT: "participant:export",

  // Check-In
  CHECKIN_PERFORM: "checkin:perform",
  CHECKIN_READ: "checkin:read",

  // Check-In Points
  CHECKIN_POINT_CREATE: "checkin_point:create",
  CHECKIN_POINT_UPDATE: "checkin_point:update",
  CHECKIN_POINT_DELETE: "checkin_point:delete",

  // Totems
  TOTEM_CREATE: "totem:create",
  TOTEM_READ: "totem:read",
  TOTEM_UPDATE: "totem:update",
  TOTEM_DELETE: "totem:delete",

  // Reports
  REPORT_VIEW: "report:view",
  REPORT_EXPORT: "report:export",

  // Audit
  AUDIT_READ: "audit:read",

  // Billing
  BILLING_READ: "billing:read",
  BILLING_MANAGE: "billing:manage",
  BILLING_REQUEST_CHANGE: "billing:request_change",

  // Plans (SUPER_ADMIN only)
  PLAN_CREATE: "plan:create",
  PLAN_READ: "plan:read",
  PLAN_UPDATE: "plan:update",
  PLAN_DELETE: "plan:delete",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Users (global)
  USER_READ_ALL: "user:read_all",
  USER_MANAGE_ALL: "user:manage_all",

  // Dashboard
  DASHBOARD_ADMIN: "dashboard:admin",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

// ============================================
// ROLE → PERMISSIONS MAPPING
// ============================================

const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(Permission),

  ORG_OWNER: [
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_MANAGE_MEMBERS,
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_PUBLISH,
    Permission.PARTICIPANT_CREATE,
    Permission.PARTICIPANT_READ,
    Permission.PARTICIPANT_UPDATE,
    Permission.PARTICIPANT_DELETE,
    Permission.PARTICIPANT_IMPORT,
    Permission.PARTICIPANT_EXPORT,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.CHECKIN_POINT_CREATE,
    Permission.CHECKIN_POINT_UPDATE,
    Permission.CHECKIN_POINT_DELETE,
    Permission.TOTEM_CREATE,
    Permission.TOTEM_READ,
    Permission.TOTEM_UPDATE,
    Permission.TOTEM_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.AUDIT_READ,
    Permission.BILLING_READ,
    Permission.BILLING_REQUEST_CHANGE,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
  ],

  ORG_ADMIN: [
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_MANAGE_MEMBERS,
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_PUBLISH,
    Permission.PARTICIPANT_CREATE,
    Permission.PARTICIPANT_READ,
    Permission.PARTICIPANT_UPDATE,
    Permission.PARTICIPANT_DELETE,
    Permission.PARTICIPANT_IMPORT,
    Permission.PARTICIPANT_EXPORT,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.CHECKIN_POINT_CREATE,
    Permission.CHECKIN_POINT_UPDATE,
    Permission.CHECKIN_POINT_DELETE,
    Permission.TOTEM_CREATE,
    Permission.TOTEM_READ,
    Permission.TOTEM_UPDATE,
    Permission.TOTEM_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.AUDIT_READ,
    Permission.SETTINGS_READ,
  ],

  EVENT_MANAGER: [
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.PARTICIPANT_CREATE,
    Permission.PARTICIPANT_READ,
    Permission.PARTICIPANT_UPDATE,
    Permission.PARTICIPANT_IMPORT,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.TOTEM_READ,
    Permission.REPORT_VIEW,
  ],

  STAFF: [
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
  ],
};

// ============================================
// PERMISSION CHECKS
// ============================================

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: Role): PermissionKey[] {
  return ROLE_PERMISSIONS[role];
}

// ============================================
// ROLE HIERARCHY (para UI e validação)
// ============================================

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ORG_OWNER: 80,
  ORG_ADMIN: 60,
  EVENT_MANAGER: 40,
  STAFF: 20,
};

export function isRoleHigherOrEqual(role: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole];
}

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}
