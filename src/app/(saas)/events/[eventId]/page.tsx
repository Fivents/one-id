import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/domain/event";
import { getParticipantsByEvent } from "@/domain/participant";
import { getTotemsByOrganization } from "@/domain/totem";
import { db } from "@/lib/db";
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
  const orgId = isSuperAdmin ? undefined : membership.organizationId;
  const event = await getEventById(eventId, orgId);
  if (!event) notFound();

  const [participants, allTotems, labelConfig, subscription] = await Promise.all([
    getParticipantsByEvent(event.id, event.organizationId),
    getTotemsByOrganization(event.organizationId),
    db.labelConfig.findUnique({ where: { eventId } }),
    db.subscription.findUnique({
      where: { organizationId: event.organizationId },
      include: { plan: true },
    }),
  ]);

  const eventTotems = allTotems.filter((t) => t.eventId === eventId);
  const checkedInCount = participants.filter((p) => p.checkIns.length > 0).length;

  return (
    <EventDetailContent
      event={{
        id: event.id,
        name: event.name,
        description: event.description,
        status: event.status,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        location: event.location,
        maxParticipants: event.maxParticipants,
        organizationId: event.organizationId,
        organizationName: event.organization.name,
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
        phone: p.phone,
        company: p.company,
        jobTitle: p.jobTitle,
        faceImageUrl: p.faceImageUrl,
        hasFaceEmbedding: !!p.faceEmbedding,
        checkIns: p.checkIns.map((c) => ({
          checkInPoint: { name: c.checkInPoint.name },
        })),
      }))}
      totems={eventTotems.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        lastHeartbeat: t.lastHeartbeat?.toISOString() ?? null,
        checkInPoint: t.checkInPoint,
        _count: t._count,
      }))}
      labelConfig={labelConfig ? {
        ...labelConfig,
        itemsOrder: typeof labelConfig.itemsOrder === "string"
          ? JSON.parse(labelConfig.itemsOrder)
          : labelConfig.itemsOrder,
      } : null}
      checkedInCount={checkedInCount}
      isSuperAdmin={isSuperAdmin}
      userRole={membership.role}
      planLimits={{
        maxCheckInPoints: subscription?.plan?.maxCheckInPointsPerEvent ?? 1,
        maxTotems: subscription?.plan?.maxTotems ?? 1,
        maxParticipants: subscription?.plan?.maxParticipantsPerEvent ?? 100,
        allowQrCode: subscription?.plan?.allowQrCode ?? false,
      }}
    />
  );
}
