import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventsByOrganization, getAllEvents } from "@/domain/event";
import { db } from "@/lib/db";
import { EventsContent } from "./events-content";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const isSuperAdmin = membership.role === "SUPER_ADMIN";

  const events = isSuperAdmin
    ? await getAllEvents()
    : await getEventsByOrganization(membership.organizationId);

  const orgs = isSuperAdmin
    ? await db.organization.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const serializedEvents = events.map((event) => ({
    id: event.id,
    name: event.name,
    description: event.description,
    status: event.status,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    location: event.location,
    maxParticipants: event.maxParticipants,
    organizationId: event.organizationId,
    ...("organization" in event && event.organization
      ? { organizationName: (event.organization as { name: string }).name }
      : {}),
    _count: {
      participants: event._count.participants,
      totems: event._count.totems,
      checkIns: event._count.checkIns,
    },
  }));

  return (
    <EventsContent
      events={serializedEvents}
      isSuperAdmin={isSuperAdmin}
      organizations={orgs}
    />
  );
}
