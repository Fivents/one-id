import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { uploadFaceImage } from "@/domain/participant";

export async function POST(
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

  if (!body.image || !body.embedding) {
    return NextResponse.json(
      { success: false, error: "image (base64) e embedding (number[]) são obrigatórios" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.embedding) || body.embedding.length !== 128) {
    return NextResponse.json(
      { success: false, error: "Embedding deve ser um array de 128 números" },
      { status: 400 }
    );
  }

  const result = await uploadFaceImage(
    participantId,
    membership.organizationId,
    body.image,
    body.embedding,
    session.user.id
  );

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({
    success: true,
    data: { faceImageUrl: result.participant.faceImageUrl },
  });
}
