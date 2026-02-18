import { db } from "@/lib/db";
import { hashSync } from "bcryptjs";
import type { CreateTotemInput, PerformCheckInInput } from "./totem.schema";

function generateApiKey(): string {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomUUID().replace(/-/g, "").slice(0, 8)
  );
  return `otk_${segments.join("_")}`;
}

export async function createTotem(
  organizationId: string,
  input: CreateTotemInput,
  userId: string
) {
  // Verifica limites do plano
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription?.plan) {
    const count = await db.totem.count({
      where: { organizationId, deletedAt: null },
    });
    if (count >= subscription.plan.maxTotems) {
      return { error: "Limite de totens do plano atingido" };
    }
  }

  const apiKey = generateApiKey();
  const apiKeyHash = hashSync(apiKey, 10);

  const totem = await db.totem.create({
    data: {
      name: input.name,
      apiKey, // Armazena em texto para exibir 1x ao admin
      apiKeyHash,
      organizationId,
      eventId: input.eventId,
      checkInPointId: input.checkInPointId,
    },
  });

  await db.auditLog.create({
    data: {
      action: "TOTEM_AUTH",
      organizationId,
      eventId: input.eventId,
      userId,
      totemId: totem.id,
      description: `Totem "${totem.name}" criado`,
    },
  });

  // Retorna a apiKey em plain text apenas neste momento
  return { totem, apiKey };
}

export async function authenticateTotem(apiKey: string) {
  // Busca pelo apiKey diretamente (campo único)
  const totem = await db.totem.findUnique({
    where: { apiKey },
    include: {
      event: true,
      checkInPoint: true,
      organization: true,
    },
  });

  if (!totem || totem.deletedAt || !totem.isActive) {
    return { error: "Totem não encontrado ou inativo" };
  }

  if (!totem.organization.isActive || totem.organization.deletedAt) {
    return { error: "Organização inativa" };
  }

  if (totem.event.deletedAt || totem.event.status === "CANCELLED") {
    return { error: "Evento cancelado ou removido" };
  }

  // Atualiza heartbeat e status
  await db.totem.update({
    where: { id: totem.id },
    data: { lastHeartbeat: new Date(), status: "ONLINE" },
  });

  await db.auditLog.create({
    data: {
      action: "TOTEM_AUTH",
      organizationId: totem.organizationId,
      eventId: totem.eventId,
      totemId: totem.id,
      description: "Totem autenticado",
    },
  });

  return { totem };
}

export async function performCheckIn(
  totemId: string,
  input: PerformCheckInInput
) {
  const totem = await db.totem.findUnique({
    where: { id: totemId },
    include: { event: true, checkInPoint: true },
  });

  if (!totem || !totem.isActive) {
    return { error: "Totem inativo" };
  }

  // Verifica se evento está ativo
  if (totem.event.status !== "ACTIVE") {
    return { error: "Evento não está ativo para check-in" };
  }

  // Verifica se o participante pertence ao evento
  const participant = await db.participant.findFirst({
    where: {
      id: input.participantId,
      eventId: totem.eventId,
      deletedAt: null,
    },
  });

  if (!participant) {
    return { error: "Participante não encontrado neste evento" };
  }

  // Verifica se já fez check-in neste ponto (constraint @@unique impede, mas checamos antes p/ UX)
  const existingCheckIn = await db.checkIn.findUnique({
    where: {
      participantId_checkInPointId: {
        participantId: input.participantId,
        checkInPointId: totem.checkInPointId,
      },
    },
  });

  if (existingCheckIn) {
    return { error: "Participante já fez check-in neste ponto" };
  }

  const checkIn = await db.checkIn.create({
    data: {
      method: input.method,
      confidence: input.confidence,
      participantId: input.participantId,
      eventId: totem.eventId,
      checkInPointId: totem.checkInPointId,
      totemId: totem.id,
    },
    include: {
      participant: true,
      checkInPoint: true,
    },
  });

  await db.auditLog.create({
    data: {
      action: "CHECK_IN",
      organizationId: totem.organizationId,
      eventId: totem.eventId,
      totemId: totem.id,
      description: `Check-in: "${participant.name}" em "${totem.checkInPoint.name}" via ${input.method}`,
      metadata: {
        participantId: participant.id,
        participantName: participant.name,
        method: input.method,
        confidence: input.confidence,
        checkInPointId: totem.checkInPointId,
        checkInPointName: totem.checkInPoint.name,
      },
    },
  });

  // Atualiza heartbeat
  await db.totem.update({
    where: { id: totem.id },
    data: { lastHeartbeat: new Date() },
  });

  return { checkIn };
}

export async function getTotemsByOrganization(organizationId: string) {
  return db.totem.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      event: { select: { id: true, name: true, status: true } },
      checkInPoint: { select: { id: true, name: true } },
      _count: { select: { checkIns: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function heartbeat(totemId: string) {
  await db.totem.update({
    where: { id: totemId },
    data: { lastHeartbeat: new Date(), status: "ONLINE" },
  });
}

export async function getEventParticipantsForTotem(totemId: string) {
  const totem = await db.totem.findUnique({
    where: { id: totemId },
  });

  if (!totem) return [];

  return db.participant.findMany({
    where: {
      eventId: totem.eventId,
      deletedAt: null,
      faceEmbedding: { not: null },
    },
    select: {
      id: true,
      name: true,
      faceEmbedding: true,
      faceImageUrl: true,
    },
  });
}

// ─── SUPER_ADMIN Management ─────────────────────────────────

export async function getAllTotems() {
  return db.totem.findMany({
    where: { deletedAt: null },
    include: {
      organization: { select: { id: true, name: true } },
      event: { select: { id: true, name: true, status: true } },
      checkInPoint: { select: { id: true, name: true } },
      _count: { select: { checkIns: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleTotemActive(totemId: string, userId: string) {
  const totem = await db.totem.findUnique({ where: { id: totemId } });
  if (!totem || totem.deletedAt) return { error: "Totem não encontrado" };

  const updated = await db.totem.update({
    where: { id: totemId },
    data: { isActive: !totem.isActive },
  });

  await db.auditLog.create({
    data: {
      action: "TOTEM_AUTH",
      organizationId: totem.organizationId,
      eventId: totem.eventId,
      userId,
      totemId: totem.id,
      description: `Totem "${totem.name}" ${updated.isActive ? "ativado" : "desativado"}`,
    },
  });

  return { totem: updated };
}

export async function deleteTotem(totemId: string, userId: string) {
  const totem = await db.totem.findUnique({ where: { id: totemId } });
  if (!totem || totem.deletedAt) return { error: "Totem não encontrado" };

  await db.totem.update({
    where: { id: totemId },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      action: "TOTEM_AUTH",
      organizationId: totem.organizationId,
      eventId: totem.eventId,
      userId,
      totemId: totem.id,
      description: `Totem "${totem.name}" removido`,
    },
  });

  return { success: true };
}

export async function getTotemDetails(totemId: string) {
  return db.totem.findUnique({
    where: { id: totemId },
    include: {
      organization: { select: { id: true, name: true } },
      event: { select: { id: true, name: true, status: true, startsAt: true, endsAt: true } },
      checkInPoint: { select: { id: true, name: true } },
      checkIns: {
        take: 20,
        orderBy: { checkedInAt: "desc" },
        include: {
          participant: { select: { id: true, name: true, company: true } },
          checkInPoint: { select: { name: true } },
        },
      },
      _count: { select: { checkIns: true } },
    },
  });
}
