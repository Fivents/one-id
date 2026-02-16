import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllPlans, createPlan, createPlanSchema, seedDefaultPlans } from "@/domain/billing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await seedDefaultPlans();
  const plans = await getAllPlans();
  return NextResponse.json({ success: true, data: plans });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership || membership.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const plan = await createPlan(parsed.data);
  return NextResponse.json({ success: true, data: plan }, { status: 201 });
}
