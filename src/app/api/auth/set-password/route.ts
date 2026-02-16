import { NextRequest, NextResponse } from "next/server";
import { setPassword, setPasswordSchema } from "@/domain/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = setPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos" },
      { status: 400 }
    );
  }

  const result = await setPassword(parsed.data, {
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if ("error" in result) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
