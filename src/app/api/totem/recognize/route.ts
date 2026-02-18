import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBestMatch } from "@/services/face-recognition";

/**
 * POST /api/totem/recognize
 *
 * Receives a face embedding captured by the totem camera
 * and finds the best matching participant.
 *
 * Headers: x-totem-id
 * Body: { embedding: number[] }
 */
export async function POST(request: NextRequest) {
  const totemId = request.headers.get("x-totem-id");

  if (!totemId) {
    return NextResponse.json(
      { success: false, error: "x-totem-id header obrigatório" },
      { status: 401 }
    );
  }

  const totem = await db.totem.findUnique({
    where: { id: totemId },
    include: { event: true },
  });

  if (!totem || !totem.isActive || totem.deletedAt) {
    return NextResponse.json(
      { success: false, error: "Totem inativo ou não encontrado" },
      { status: 401 }
    );
  }

  if (totem.event.status !== "ACTIVE") {
    return NextResponse.json(
      { success: false, error: "Evento não está ativo" },
      { status: 422 }
    );
  }

  const body = await request.json();

  if (!Array.isArray(body.embedding) || body.embedding.length !== 128) {
    return NextResponse.json(
      { success: false, error: "embedding (number[128]) é obrigatório" },
      { status: 400 }
    );
  }

  // Get all participants with face embeddings for this event
  const participants = await db.participant.findMany({
    where: {
      eventId: totem.eventId,
      deletedAt: null,
      faceEmbedding: { not: null },
    },
    select: {
      id: true,
      name: true,
      company: true,
      jobTitle: true,
      faceEmbedding: true,
      faceImageUrl: true,
    },
  });

  if (participants.length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum participante com face registrada" },
      { status: 404 }
    );
  }

  const result = findBestMatch(
    body.embedding,
    participants.filter((p) => p.faceEmbedding !== null) as unknown as {
      id: string;
      name: string;
      faceEmbedding: Buffer;
    }[]
  );

  if (!result.matched) {
    await db.auditLog.create({
      data: {
        action: "CHECK_IN_DENIED",
        organizationId: totem.organizationId,
        eventId: totem.eventId,
        totemId: totem.id,
        description: `Reconhecimento facial falhou - confiança: ${(result.confidence * 100).toFixed(1)}%`,
        metadata: { confidence: result.confidence },
      },
    });

    return NextResponse.json({
      success: false,
      error: "Participante não reconhecido",
      data: { confidence: result.confidence },
    });
  }

  // Check if already checked in at this point
  const existingCheckIn = await db.checkIn.findUnique({
    where: {
      participantId_checkInPointId: {
        participantId: result.participantId!,
        checkInPointId: totem.checkInPointId,
      },
    },
  });

  // Fetch the matched participant details
  const matchedParticipant = participants.find((p) => p.id === result.participantId);

  return NextResponse.json({
    success: true,
    data: {
      participantId: result.participantId,
      participantName: result.participantName,
      company: matchedParticipant?.company ?? null,
      jobTitle: matchedParticipant?.jobTitle ?? null,
      confidence: result.confidence,
      alreadyCheckedIn: !!existingCheckIn,
    },
  });
}
