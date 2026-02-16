import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const isSuperAdmin = session.user.memberships.some((m) => m.role === "SUPER_ADMIN");
  if (!isSuperAdmin) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const organizationId = searchParams.get("organizationId");
  const eventId = searchParams.get("eventId");
  const take = Math.min(Number(searchParams.get("take") || "50"), 200);

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (eventId) where.eventId = eventId;

  const logs = await db.auditLog.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { name: true } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({
    success: true,
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      organizationName: log.organization?.name,
      eventName: log.event?.name,
      userName: log.user?.name,
      userEmail: log.user?.email,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}
