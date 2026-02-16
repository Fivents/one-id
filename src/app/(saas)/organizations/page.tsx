import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById, getAllOrganizations } from "@/domain/organizations";
import { getActivePlans } from "@/domain/billing";
import { OrganizationsContent } from "./organizations-content";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const isSuperAdmin = membership.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const [orgs, plans] = await Promise.all([
      getAllOrganizations(),
      getActivePlans(),
    ]);

    const serializedOrgs = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      document: org.document,
      phone: org.phone,
      isActive: org.isActive,
      planName: org.subscription?.plan?.name ?? null,
      planTier: org.subscription?.plan?.tier ?? null,
      eventCount: org._count.events,
      memberCount: org._count.memberships,
      createdAt: org.createdAt.toISOString(),
    }));

    const serializedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      tier: p.tier,
    }));

    return (
      <OrganizationsContent
        isSuperAdmin
        orgs={serializedOrgs}
        plans={serializedPlans}
      />
    );
  }

  const org = await getOrganizationById(membership.organizationId);
  if (!org) redirect("/login");

  return (
    <OrganizationsContent
      isSuperAdmin={false}
      org={{
        name: org.name,
        slug: org.slug,
        email: org.email,
        document: org.document,
        phone: org.phone,
        planName: org.subscription?.plan?.name ?? null,
        eventCount: org._count.events,
        memberCount: org._count.memberships,
      }}
    />
  );
}
