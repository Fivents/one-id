import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/domain/event";
import { getParticipantsByEvent } from "@/domain/participant";
import { EventDetailContent } from "./event-detail-content";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const { eventId } = await params;
  const isSuperAdmin = membership.role === "SUPER_ADMIN";
  const event = await getEventById(eventId, isSuperAdmin ? undefined : membership.organizationId);
  if (!event) notFound();

  const participants = await getParticipantsByEvent(
    event.id,
    event.organizationId
  );

  const checkedInCount = participants.filter((p) => p.checkIns.length > 0).length;

  return (
    <EventDetailContent
      event={{
        id: event.id,
        name: event.name,
        description: event.description,
        status: event.status,
        startsAt: event.startsAt.toISOString(),
        location: event.location,
        maxParticipants: event.maxParticipants,
        organizationId: event.organizationId,
        checkInPoints: event.checkInPoints.map((cp) => ({
          id: cp.id,
          name: cp.name,
          isActive: cp.isActive,
        })),
        _count: event._count,
      }}
      participants={participants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        document: p.document,
        hasFaceEmbedding: !!p.faceEmbedding,
        checkIns: p.checkIns.map((c) => ({
          checkInPoint: { name: c.checkInPoint.name },
        })),
      }))}
      checkedInCount={checkedInCount}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
