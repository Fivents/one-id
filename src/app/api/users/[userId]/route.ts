import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSetupToken } from "@/domain/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { userId } = await params;
  const target = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: { select: { id: true, name: true } } },
      },
    },
  });

  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  return NextResponse.json({ success: true, data: target });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { userId } = await params;
  const body = await request.json();

  if (body.resetPassword) {
    const token = await generateSetupToken(userId);
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${token}`;
    return NextResponse.json({ success: true, data: { setupUrl } });
  }

  if (body.toggleActive !== undefined) {
    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: body.toggleActive },
    });
    return NextResponse.json({ success: true, data: updated });
  }

  if (body.role && body.organizationId) {
    await db.membership.updateMany({
      where: { userId, organizationId: body.organizationId },
      data: { role: body.role },
    });
    return NextResponse.json({ success: true });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: body.name,
      email: body.email,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { userId } = await params;
  await db.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });

  return NextResponse.json({ success: true });
}
