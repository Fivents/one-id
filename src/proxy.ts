import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = [
  "/login",
  "/set-password",
  "/api/auth/login",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/set-password",
  "/api/totem/auth",
];

const totemPaths = [
  "/api/totem/check-in",
  "/api/totem/heartbeat",
  "/api/totem/participants",
];

const totemPagePaths = ["/auth", "/check-in", "/success"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — sem autenticação
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Rotas de totem API — validação via x-totem-id header
  if (totemPaths.some((p) => pathname.startsWith(p))) {
    const totemId = request.headers.get("x-totem-id");
    if (!totemId) {
      return NextResponse.json(
        { success: false, error: "Autenticação de totem obrigatória" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Páginas do totem (web) — sem auth de usuário (o próprio totem se autentica)
  if (totemPagePaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Static files e internal
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Rotas protegidas — verifica JWT no cookie
  const token = request.cookies.get("oneid-session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token inválido ou expirado
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ success: false, error: "Sessão expirada" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("oneid-session");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
