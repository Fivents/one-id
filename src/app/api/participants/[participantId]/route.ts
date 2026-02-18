import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import {
  getParticipantById,
  updateParticipant,
  deleteParticipant,
  updateParticipantSchema,
} from "@/domain/participant";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { participantId } = await params;
  const membership = session.user.memberships[0];
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_READ)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const participant = await getParticipantById(participantId, membership.organizationId);
  if (!participant) {
    return NextResponse.json({ success: false, error: "Participante não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...participant,
      faceEmbedding: undefined, // Never send embedding to client
      hasFaceEmbedding: !!participant.faceEmbedding,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_UPDATE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { participantId } = await params;
  const body = await request.json();
  const parsed = updateParticipantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const result = await updateParticipant(
    participantId,
    membership.organizationId,
    parsed.data,
    session.user.id
  );

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: result.participant });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_DELETE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { participantId } = await params;
  const result = await deleteParticipant(participantId, membership.organizationId, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
