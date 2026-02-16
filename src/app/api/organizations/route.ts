import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllOrganizations, createOrganization, createOrganizationSchema } from "@/domain/organizations";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const isActive = searchParams.get("isActive") === null ? undefined : searchParams.get("isActive") === "true";

  const orgs = await getAllOrganizations({ search, isActive });
  return NextResponse.json({ success: true, data: orgs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership || membership.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const planId = body.planId || undefined;
  const org = await createOrganization(parsed.data, planId);
  return NextResponse.json({ success: true, data: org }, { status: 201 });
}
