import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { getAllTotems } from "@/domain/totem";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const membership = session.user.memberships[0];
  if (!membership || !isSuperAdmin(membership.role)) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 });
  }

  const totems = await getAllTotems();

  return NextResponse.json({ success: true, data: totems });
}
