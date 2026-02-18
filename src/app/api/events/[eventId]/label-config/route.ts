import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { eventId } = await params;
  const config = await db.labelConfig.findUnique({ where: { eventId } });

  return NextResponse.json({ success: true, data: config });
}

export async function PUT(
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

  // Only SUPER_ADMIN, ORG_OWNER, ORG_ADMIN, EVENT_MANAGER can configure labels
  if (!hasPermission(membership.role, Permission.EVENT_UPDATE)) {
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

  // Fivents logo is always required - enforce
  body.showFiventsLogo = true;

  // Ensure itemsOrder is stored as string
  if (Array.isArray(body.itemsOrder)) {
    body.itemsOrder = JSON.stringify(body.itemsOrder);
  }

  const config = await db.labelConfig.upsert({
    where: { eventId },
    create: { eventId, ...body },
    update: body,
  });

  await db.auditLog.create({
    data: {
      action: "LABEL_CONFIG_UPDATED",
      organizationId: event.organizationId,
      eventId,
      userId: session.user.id,
      description: `Configuração de etiqueta atualizada para "${event.name}"`,
    },
  });

  return NextResponse.json({ success: true, data: config });
}
