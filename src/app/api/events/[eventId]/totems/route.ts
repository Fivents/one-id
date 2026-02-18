import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { createTotem } from "@/domain/totem";
import { createTotemSchema } from "@/domain/totem/totem.schema";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ success: false, error: "Sem organização" }, { status: 403 });
  }

  if (!hasPermission(membership.role, Permission.TOTEM_CREATE)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { eventId } = await params;

  // Verify event belongs to org
  const event = await db.event.findFirst({
    where: {
      id: eventId,
      organizationId: membership.role === "SUPER_ADMIN" ? undefined : membership.organizationId,
      deletedAt: null,
    },
  });

  if (!event) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createTotemSchema.safeParse({ ...body, eventId });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const result = await createTotem(event.organizationId, parsed.data, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: result.totem.id,
      name: result.totem.name,
      apiKey: result.apiKey,
    },
  }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ success: false, error: "Sem organização" }, { status: 403 });
  }

  const { eventId } = await params;

  const totems = await db.totem.findMany({
    where: {
      eventId,
      organizationId: membership.role === "SUPER_ADMIN" ? undefined : membership.organizationId,
      deletedAt: null,
    },
    include: {
      checkInPoint: { select: { id: true, name: true } },
      _count: { select: { checkIns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: totems });
}
