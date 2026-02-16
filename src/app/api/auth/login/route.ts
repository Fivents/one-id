import { NextRequest, NextResponse } from "next/server";
import { login, loginSchema } from "@/domain/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos" },
      { status: 400 }
    );
  }

  const result = await login(parsed.data, {
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if ("error" in result) {
    const status = result.error === "MUST_SET_PASSWORD" ? 403 : 401;
    return NextResponse.json(
      { success: false, error: result.error, setupToken: "setupToken" in result ? result.setupToken : undefined },
      { status }
    );
  }

  return NextResponse.json({ success: true });
}
