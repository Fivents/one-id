import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { createEvent, createEventSchema, getEventsByOrganization } from "@/domain/event";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const orgId = request.nextUrl.searchParams.get("organizationId");
  const membership = session.user.memberships.find(
    (m) => m.organizationId === orgId
  );

  if (!membership && !session.user.memberships.some((m) => m.role === "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const targetOrgId = orgId ?? session.user.memberships[0]?.organizationId;
  if (!targetOrgId) {
    return NextResponse.json({ success: false, error: "Organização não encontrada" }, { status: 404 });
  }

  const events = await getEventsByOrganization(targetOrgId);
  return NextResponse.json({ success: true, data: events });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const orgId = request.nextUrl.searchParams.get("organizationId");
  const membership = session.user.memberships.find(
    (m) => m.organizationId === orgId
  );

  if (!membership || !hasPermission(membership.role, Permission.EVENT_CREATE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const result = await createEvent(membership.organizationId, parsed.data, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: result.event }, { status: 201 });
}
