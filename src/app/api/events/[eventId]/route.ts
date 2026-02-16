import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { getEventById, updateEvent, deleteEvent, updateEventSchema } from "@/domain/event";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { eventId } = await params;
  const orgId = request.nextUrl.searchParams.get("organizationId");
  const membership = session.user.memberships.find((m) => m.organizationId === orgId);

  if (!membership && !session.user.memberships.some((m) => m.role === "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const targetOrgId = orgId ?? session.user.memberships[0]?.organizationId;
  if (!targetOrgId) {
    return NextResponse.json({ success: false, error: "Organização não encontrada" }, { status: 404 });
  }

  const event = await getEventById(eventId, targetOrgId);
  if (!event) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: event });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { eventId } = await params;
  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const orgId = request.nextUrl.searchParams.get("organizationId");
  const membership = session.user.memberships.find((m) => m.organizationId === orgId);

  if (!membership || !hasPermission(membership.role, Permission.EVENT_UPDATE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const result = await updateEvent(eventId, membership.organizationId, parsed.data, session.user.id);
  return NextResponse.json({ success: true, data: result.event });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { eventId } = await params;
  const orgId = request.nextUrl.searchParams.get("organizationId");
  const membership = session.user.memberships.find((m) => m.organizationId === orgId);

  if (!membership || !hasPermission(membership.role, Permission.EVENT_DELETE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const result = await deleteEvent(eventId, membership.organizationId, session.user.id);
  return NextResponse.json({ success: true, data: result.event });
}
