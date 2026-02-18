import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { importParticipants, importParticipantRowSchema } from "@/domain/participant";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_IMPORT)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.eventId || !Array.isArray(body.rows)) {
    return NextResponse.json(
      { success: false, error: "eventId e rows são obrigatórios" },
      { status: 400 }
    );
  }

  // Validate each row
  const validRows = [];
  const rowErrors = [];

  for (let i = 0; i < body.rows.length; i++) {
    const parsed = importParticipantRowSchema.safeParse(body.rows[i]);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      rowErrors.push({ row: i + 2, error: "Dados inválidos" });
    }
  }

  if (validRows.length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhuma linha válida encontrada" },
      { status: 400 }
    );
  }

  const result = await importParticipants(
    membership.organizationId,
    body.eventId,
    validRows,
    session.user.id
  );

  if ("error" in result && typeof result.error === "string") {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: result });
}
