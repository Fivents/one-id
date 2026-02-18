import { db } from "@/lib/db";
import type { CreateParticipantInput, UpdateParticipantInput, ImportParticipantRow } from "./participant.schema";
import { embeddingToBuffer } from "@/services/face-recognition";
import { saveFaceImage, base64ToBuffer } from "@/services/storage";

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
      company: input.company,
      jobTitle: input.jobTitle,
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

export async function getParticipantsByEvent(
  eventId: string,
  organizationId: string,
  filters?: { search?: string }
) {
  const where: Record<string, unknown> = { eventId, organizationId, deletedAt: null };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { document: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.participant.findMany({
    where,
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

/**
 * Upload face image and store embedding for a participant.
 * Receives base64 image data and a pre-computed embedding from the client.
 */
export async function uploadFaceImage(
  participantId: string,
  organizationId: string,
  base64Image: string,
  embedding: number[],
  userId: string
) {
  const participant = await db.participant.findFirst({
    where: { id: participantId, organizationId, deletedAt: null },
  });

  if (!participant) return { error: "Participante não encontrado" };

  const imageBuffer = base64ToBuffer(base64Image);
  const faceImageUrl = await saveFaceImage(imageBuffer, organizationId, participantId);
  const faceEmbedding = embeddingToBuffer(embedding);

  const updated = await db.participant.update({
    where: { id: participantId },
    data: { faceImageUrl, faceEmbedding },
  });

  await db.auditLog.create({
    data: {
      action: "FACE_REGISTERED",
      organizationId,
      eventId: participant.eventId,
      userId,
      description: `Face registrada para "${participant.name}"`,
      metadata: { participantId },
    },
  });

  return { participant: updated };
}

/**
 * Import participants in bulk from parsed Excel rows.
 * Returns count of created & skipped participants.
 */
export async function importParticipants(
  organizationId: string,
  eventId: string,
  rows: ImportParticipantRow[],
  userId: string
) {
  // Verifica limite do plano
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  const event = await db.event.findFirst({
    where: { id: eventId, organizationId, deletedAt: null },
  });

  if (!event) return { error: "Evento não encontrado" };

  const existingCount = await db.participant.count({
    where: { eventId, deletedAt: null },
  });

  const planLimit = subscription?.plan?.maxParticipantsPerEvent ?? Infinity;
  const eventLimit = event.maxParticipants ?? Infinity;
  const maxAllowed = Math.min(planLimit, eventLimit);
  const slotsAvailable = maxAllowed - existingCount;

  if (slotsAvailable <= 0) {
    return { error: "Limite de participantes atingido" };
  }

  const toImport = rows.slice(0, slotsAvailable);
  let created = 0;
  let skipped = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < toImport.length; i++) {
    const row = toImport[i];
    try {
      await db.participant.create({
        data: {
          name: row.name,
          email: row.email || null,
          document: row.document || null,
          phone: row.phone || null,
          company: row.company || null,
          jobTitle: row.jobTitle || null,
          organizationId,
          eventId,
        },
      });
      created++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      // Unique constraint violation = duplicate, skip it
      if (message.includes("Unique constraint")) {
        skipped++;
      } else {
        errors.push({ row: i + 2, error: message }); // +2 for header row + 0-index
        skipped++;
      }
    }
  }

  await db.auditLog.create({
    data: {
      action: "IMPORT_DATA",
      organizationId,
      eventId,
      userId,
      description: `Importação: ${created} criados, ${skipped} ignorados de ${rows.length} linhas`,
      metadata: { created, skipped, totalRows: rows.length, errors },
    },
  });

  return {
    created,
    skipped,
    totalRows: rows.length,
    limitReached: rows.length > slotsAvailable,
    errors,
  };
}
