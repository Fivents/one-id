import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { env } from "./env";

const SESSION_COOKIE = "oneid-session";
const secret = new TextEncoder().encode(env.JWT_SECRET);

// ============================================
// JWT
// ============================================

interface JWTPayload {
  sessionId: string;
  userId: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await db.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    },
  });

  const jwt = await signToken({
    sessionId: session.id,
    userId,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session;
}

/**
 * Creates session and returns cookie data for manual attachment to responses
 * (needed for redirect responses where cookies() API doesn't work)
 */
export async function createSessionAndGetCookie(
  userId: string,
  options?: { ipAddress?: string; userAgent?: string }
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await db.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    },
  });

  const jwt = await signToken({
    sessionId: session.id,
    userId,
  });

  return {
    session,
    cookie: {
      name: SESSION_COOKIE,
      value: jwt,
      options: {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax" as const,
        expires: expiresAt,
        path: "/",
      },
    },
  };
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await db.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: { organization: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      await db.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

// ============================================
// PASSWORD HASHING
// ============================================

export { hashSync as hashPassword, compareSync as comparePassword } from "bcryptjs";
