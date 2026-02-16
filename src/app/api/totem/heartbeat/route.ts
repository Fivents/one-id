import { NextRequest, NextResponse } from "next/server";
import { heartbeat } from "@/domain/totem";

export async function POST(request: NextRequest) {
  const totemId = request.headers.get("x-totem-id");

  if (!totemId) {
    return NextResponse.json(
      { success: false, error: "Header x-totem-id é obrigatório" },
      { status: 400 }
    );
  }

  await heartbeat(totemId);

  return NextResponse.json({ success: true });
}
