import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestPlanChange, getPlanChangeRequests, resolvePlanChangeRequest } from "@/domain/billing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const requests = await getPlanChangeRequests();
  return NextResponse.json({ success: true, data: requests });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const body = await request.json();

  if (body.action && body.requestId) {
    // SUPER_ADMIN resolving a request
    if (membership.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const result = await resolvePlanChangeRequest(
      body.requestId,
      body.action,
      user.id,
      body.note
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  }

  // ORG_OWNER requesting plan change
  const result = await requestPlanChange(
    membership.organizationId,
    body.requestedPlanId,
    body.message
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}
