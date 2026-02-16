import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById, updateOrganization, deleteOrganization, toggleOrganizationActive, updateOrganizationSchema } from "@/domain/organizations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;
  const org = await getOrganizationById(orgId);
  if (!org) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  return NextResponse.json({ success: true, data: org });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orgId } = await params;
  const body = await request.json();

  if (body.toggleActive !== undefined) {
    const org = await toggleOrganizationActive(orgId, body.toggleActive);
    return NextResponse.json({ success: true, data: org });
  }

  const parsed = updateOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const org = await updateOrganization(orgId, parsed.data);
  return NextResponse.json({ success: true, data: org });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership || membership.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { orgId } = await params;
  await deleteOrganization(orgId);
  return NextResponse.json({ success: true });
}
