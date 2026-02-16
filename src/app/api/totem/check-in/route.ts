import { NextRequest, NextResponse } from "next/server";
import { performCheckIn, performCheckInSchema } from "@/domain/totem";

export async function POST(request: NextRequest) {
  const totemId = request.headers.get("x-totem-id");

  if (!totemId) {
    return NextResponse.json(
      { success: false, error: "Header x-totem-id é obrigatório" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = performCheckInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
  }

  const result = await performCheckIn(totemId, parsed.data);

  if ("error" in result) {
    const status = result.error?.includes("já fez check-in") ? 409 : 422;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({
    success: true,
    data: {
      checkInId: result.checkIn.id,
      participant: {
        id: result.checkIn.participant.id,
        name: result.checkIn.participant.name,
      },
      checkInPoint: {
        id: result.checkIn.checkInPoint.id,
        name: result.checkIn.checkInPoint.name,
      },
      method: result.checkIn.method,
      checkedInAt: result.checkIn.checkedInAt,
    },
  });
}
