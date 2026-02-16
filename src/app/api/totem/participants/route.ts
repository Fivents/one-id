import { NextRequest, NextResponse } from "next/server";
import { getEventParticipantsForTotem } from "@/domain/totem";

export async function GET(request: NextRequest) {
  const totemId = request.headers.get("x-totem-id");

  if (!totemId) {
    return NextResponse.json(
      { success: false, error: "Header x-totem-id é obrigatório" },
      { status: 400 }
    );
  }

  const participants = await getEventParticipantsForTotem(totemId);

  return NextResponse.json({ success: true, data: participants });
}
