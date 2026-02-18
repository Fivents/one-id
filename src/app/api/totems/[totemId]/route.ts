import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { toggleTotemActive, deleteTotem, getTotemDetails } from "@/domain/totem";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ totemId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !isSuperAdmin(membership.role)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { totemId } = await params;
  const totem = await getTotemDetails(totemId);

  if (!totem) {
    return NextResponse.json({ success: false, error: "Totem não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: totem });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ totemId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !isSuperAdmin(membership.role)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { totemId } = await params;
  const body = await request.json();

  if (body.action === "toggle_active") {
    const result = await toggleTotemActive(totemId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.totem });
  }

  return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ totemId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !isSuperAdmin(membership.role)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { totemId } = await params;
  const result = await deleteTotem(totemId, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
