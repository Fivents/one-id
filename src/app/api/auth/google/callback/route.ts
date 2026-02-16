import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { loginWithGoogle } from "@/domain/auth";
import { createSessionAndGetCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_token_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();

    if (!googleUser.email?.endsWith("@fivents.com")) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_domain_invalid`);
    }

    const result = await loginWithGoogle(
      {
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        googleId: googleUser.id,
        avatarUrl: googleUser.picture,
      },
      {
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      }
    );

    if ("error" in result && result.error) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(result.error)}`);
    }

    // Set cookie directly on the redirect response
    const response = NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/dashboard`);
    if ("cookie" in result && result.cookie) {
      response.cookies.set(result.cookie.name, result.cookie.value, result.cookie.options);
    }
    return response;
  } catch {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_auth_failed`);
  }
}
