import { db } from "@/lib/db";
import type { CreateParticipantInput, UpdateParticipantInput } from "./participant.schema";

export async function createParticipant(
  organizationId: string,
  eventId: string,
  input: CreateParticipantInput,
  userId: string
) {
  // Verifica limites do plano
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription?.plan) {
    const count = await db.participant.count({
      where: { eventId, deletedAt: null },
    });

    if (count >= subscription.plan.maxParticipantsPerEvent) {
      return { error: "Limite de participantes do plano atingido" };
    }
  }

  // Verifica limite do evento
  const event = await db.event.findFirst({
    where: { id: eventId, organizationId, deletedAt: null },
  });

  if (!event) return { error: "Evento não encontrado" };

  if (event.maxParticipants) {
    const count = await db.participant.count({
      where: { eventId, deletedAt: null },
    });
    if (count >= event.maxParticipants) {
      return { error: "Limite máximo de participantes do evento atingido" };
    }
  }

  const participant = await db.participant.create({
    data: {
      name: input.name,
      email: input.email,
      document: input.document,
      phone: input.phone,
      organizationId,
      eventId,
    },
  });

  await db.auditLog.create({
    data: {
      action: "PARTICIPANT_CREATED",
      organizationId,
      eventId,
      userId,
      description: `Participante "${participant.name}" criado`,
    },
  });

  return { participant };
}

export async function updateParticipant(
  participantId: string,
  organizationId: string,
  input: UpdateParticipantInput,
  userId: string
) {
  const participant = await db.participant.update({
    where: { id: participantId, organizationId, deletedAt: null },
    data: input,
  });

  await db.auditLog.create({
    data: {
      action: "PARTICIPANT_UPDATED",
      organizationId,
      eventId: participant.eventId,
      userId,
      description: `Participante "${participant.name}" atualizado`,
    },
  });

  return { participant };
}

export async function deleteParticipant(
  participantId: string,
  organizationId: string,
  userId: string
) {
  const participant = await db.participant.update({
    where: { id: participantId, organizationId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      action: "PARTICIPANT_DELETED",
      organizationId,
      eventId: participant.eventId,
      userId,
      description: `Participante "${participant.name}" removido`,
    },
  });

  return { participant };
}

export async function getParticipantsByEvent(eventId: string, organizationId: string) {
  return db.participant.findMany({
    where: { eventId, organizationId, deletedAt: null },
    include: {
      checkIns: {
        include: { checkInPoint: true },
      },
      consents: {
        where: { revokedAt: null },
        orderBy: { grantedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getParticipantById(
  participantId: string,
  organizationId: string
) {
  return db.participant.findFirst({
    where: { id: participantId, organizationId, deletedAt: null },
    include: {
      checkIns: {
        include: { checkInPoint: true, totem: true },
      },
      consents: {
        orderBy: { grantedAt: "desc" },
      },
    },
  });
}
