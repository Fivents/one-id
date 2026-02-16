import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import {
  createParticipant,
  createParticipantSchema,
  getParticipantsByEvent,
} from "@/domain/participant";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const orgId = request.nextUrl.searchParams.get("organizationId");
  const eventId = request.nextUrl.searchParams.get("eventId");

  if (!orgId || !eventId) {
    return NextResponse.json({ success: false, error: "organizationId e eventId são obrigatórios" }, { status: 400 });
  }

  const membership = session.user.memberships.find((m) => m.organizationId === orgId);
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_READ)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const participants = await getParticipantsByEvent(eventId, orgId);
  return NextResponse.json({ success: true, data: participants });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createParticipantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const orgId = request.nextUrl.searchParams.get("organizationId");
  const eventId = request.nextUrl.searchParams.get("eventId");

  if (!orgId || !eventId) {
    return NextResponse.json({ success: false, error: "organizationId e eventId são obrigatórios" }, { status: 400 });
  }

  const membership = session.user.memberships.find((m) => m.organizationId === orgId);
  if (!membership || !hasPermission(membership.role, Permission.PARTICIPANT_CREATE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const result = await createParticipant(orgId, eventId, parsed.data, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: result.participant }, { status: 201 });
}
