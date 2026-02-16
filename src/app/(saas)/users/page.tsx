import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationMembers } from "@/domain/organizations";
import { db } from "@/lib/db";
import { UsersContent } from "./users-content";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const isSuperAdmin = membership.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const [users, orgs] = await Promise.all([
      db.user.findMany({
        where: { deletedAt: null },
        include: {
          memberships: {
            where: { isActive: true },
            include: { organization: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.organization.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const serializedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      mustSetPassword: u.mustSetPassword,
      createdAt: u.createdAt.toISOString(),
      memberships: u.memberships.map((m) => ({
        organizationId: m.organization.id,
        organizationName: m.organization.name,
        role: m.role,
      })),
    }));

    return (
      <UsersContent
        isSuperAdmin
        users={serializedUsers}
        organizations={orgs}
      />
    );
  }

  const members = await getOrganizationMembers(membership.organizationId);

  const serializedMembers = members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    userName: m.user.name,
    userEmail: m.user.email,
    userIsActive: m.user.isActive,
    role: m.role,
    createdAt: m.user.createdAt.toISOString(),
  }));

  return <UsersContent isSuperAdmin={false} members={serializedMembers} />;
}
