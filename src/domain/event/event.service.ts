import { db } from "@/lib/db";
import type { CreateEventInput, UpdateEventInput } from "./event.schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createEvent(
  organizationId: string,
  input: CreateEventInput,
  userId: string
) {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription?.plan) {
    const activeEvents = await db.event.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { not: "CANCELLED" },
      },
    });

    if (activeEvents >= subscription.plan.maxEvents) {
      return { error: "Limite de eventos do plano atingido" };
    }
  }

  let slug = generateSlug(input.name);
  const existing = await db.event.findFirst({
    where: { slug, organizationId },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const event = await db.event.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      address: input.address,
      maxParticipants: input.maxParticipants,
      checkInMethods: input.checkInMethods,
      organizationId,
    },
  });

  await db.checkInPoint.create({
    data: { name: "Entrada Principal", eventId: event.id },
  });

  await db.auditLog.create({
    data: {
      action: "EVENT_CREATED",
      organizationId,
      eventId: event.id,
      userId,
      description: `Evento "${event.name}" criado`,
    },
  });

  return { event };
}

export async function updateEvent(
  eventId: string,
  organizationId: string,
  input: UpdateEventInput,
  userId: string
) {
  const event = await db.event.update({
    where: { id: eventId, organizationId, deletedAt: null },
    data: input,
  });

  await db.auditLog.create({
    data: {
      action: "EVENT_UPDATED",
      organizationId,
      eventId: event.id,
      userId,
      description: `Evento "${event.name}" atualizado`,
    },
  });

  return { event };
}

export async function deleteEvent(eventId: string, organizationId: string, userId: string) {
  const event = await db.event.update({
    where: { id: eventId, organizationId, deletedAt: null },
    data: { deletedAt: new Date(), status: "CANCELLED" },
  });

  await db.auditLog.create({
    data: {
      action: "EVENT_DELETED",
      organizationId,
      eventId: event.id,
      userId,
      description: `Evento "${event.name}" removido (soft delete)`,
    },
  });

  return { event };
}

export async function getEventsByOrganization(organizationId: string) {
  return db.event.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      _count: {
        select: {
          participants: { where: { deletedAt: null } },
          checkIns: true,
          totems: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function getAllEvents(filters?: {
  search?: string;
  status?: string;
  organizationId?: string;
}) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.organizationId) where.organizationId = filters.organizationId;

  return db.event.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          participants: { where: { deletedAt: null } },
          checkIns: true,
          totems: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventById(eventId: string, organizationId?: string) {
  const where: Record<string, unknown> = { id: eventId, deletedAt: null };
  if (organizationId) where.organizationId = organizationId;

  return db.event.findFirst({
    where,
    include: {
      organization: { select: { id: true, name: true } },
      checkInPoints: { orderBy: { createdAt: "asc" } },
      _count: {
        select: {
          participants: { where: { deletedAt: null } },
          checkIns: true,
          totems: { where: { deletedAt: null } },
        },
      },
    },
  });
}

// ============================================
// CHECK-IN POINTS
// ============================================

export async function createCheckInPoint(eventId: string, name: string, organizationId: string) {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription?.plan) {
    const count = await db.checkInPoint.count({ where: { eventId } });
    if (count >= subscription.plan.maxCheckInPointsPerEvent) {
      return { error: "Limite de pontos de check-in do plano atingido" };
    }
  }

  return db.checkInPoint.create({ data: { name, eventId } });
}

export async function updateCheckInPoint(id: string, name: string) {
  return db.checkInPoint.update({ where: { id }, data: { name } });
}

export async function deleteCheckInPoint(id: string) {
  const checkIns = await db.checkIn.count({ where: { checkInPointId: id } });
  if (checkIns > 0) {
    return { error: "Ponto tem check-ins realizados e não pode ser excluído" };
  }

  const totems = await db.totem.count({ where: { checkInPointId: id, deletedAt: null } });
  if (totems > 0) {
    return { error: "Ponto possui totens vinculados. Remova-os primeiro." };
  }

  await db.checkInPoint.delete({ where: { id } });
  return { success: true };
}
