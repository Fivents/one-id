import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckInPoint, updateCheckInPoint, deleteCheckInPoint } from "@/domain/event";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const { eventId } = await params;
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const result = await createCheckInPoint(eventId, body.name, membership.organizationId);
  if (result && "error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "ID e nome são obrigatórios" }, { status: 400 });
  }

  const point = await updateCheckInPoint(body.id, body.name);
  return NextResponse.json({ success: true, data: point });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  const result = await deleteCheckInPoint(body.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
