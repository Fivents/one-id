import type { Role, Membership, Organization, User } from "@/generated/prisma/client";

export type SessionUser = User & {
  memberships: (Membership & {
    organization: Organization;
  })[];
};

export type ActiveMembership = Membership & {
  organization: Organization;
};

export type UserWithRole = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
};

export type UserRole = Role;
