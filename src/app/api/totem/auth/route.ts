import { NextRequest, NextResponse } from "next/server";
import { authenticateTotem, totemAuthSchema } from "@/domain/totem";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = totemAuthSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "API Key é obrigatória" }, { status: 400 });
  }

  const result = await authenticateTotem(parsed.data.apiKey);

  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      totemId: result.totem.id,
      totemName: result.totem.name,
      event: {
        id: result.totem.event.id,
        name: result.totem.event.name,
        status: result.totem.event.status,
      },
      checkInPoint: {
        id: result.totem.checkInPoint.id,
        name: result.totem.checkInPoint.name,
      },
      organization: {
        id: result.totem.organization.id,
        name: result.totem.organization.name,
      },
    },
  });
}
