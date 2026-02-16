import { db } from "@/lib/db";
import {
  hashPassword,
  comparePassword,
  createSession,
  createSessionAndGetCookie,
  destroySession,
  getCurrentUser,
} from "@/lib/auth";
import type { LoginInput, SetPasswordInput } from "./auth.schema";

const FIVENTS_DOMAIN = "@fivents.com";

export async function login(
  input: LoginInput,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const user = await db.user.findUnique({
    where: { email: input.email },
    include: { memberships: { where: { isActive: true } } },
  });

  if (!user || user.deletedAt) {
    return { error: "Credenciais inválidas" };
  }

  if (!user.isActive) {
    return { error: "Conta desativada. Entre em contato com o suporte." };
  }

  if (user.mustSetPassword) {
    return { error: "MUST_SET_PASSWORD", setupToken: user.setupToken };
  }

  if (!user.passwordHash) {
    return { error: "Credenciais inválidas" };
  }

  const valid = comparePassword(input.password, user.passwordHash);
  if (!valid) {
    return { error: "Credenciais inválidas" };
  }

  await createSession(user.id, meta);

  const membership = user.memberships[0];
  if (membership) {
    await db.auditLog.create({
      data: {
        action: "USER_LOGIN",
        organizationId: membership.organizationId,
        userId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });
  }

  return { success: true };
}

export async function loginWithGoogle(
  googleUser: { email: string; name: string; googleId: string; avatarUrl?: string },
  meta?: { ipAddress?: string; userAgent?: string }
) {
  if (!googleUser.email.endsWith(FIVENTS_DOMAIN)) {
    return { error: "Login com Google disponível apenas para @fivents.com" };
  }

  let user = await db.user.findUnique({
    where: { email: googleUser.email },
  });

  if (user && user.deletedAt) {
    return { error: "Conta desativada" };
  }

  if (!user) {
    // Auto-create SUPER_ADMIN for @fivents.com
    user = await db.user.create({
      data: {
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        emailVerified: true,
        mustSetPassword: false,
      },
    });

    // Ensure Fivents organization exists and create SUPER_ADMIN membership
    let fiventsOrg = await db.organization.findFirst({
      where: { name: "Fivents" },
    });
    if (!fiventsOrg) {
      fiventsOrg = await db.organization.create({
        data: { name: "Fivents", slug: "fivents", email: "contato@fivents.com" },
      });
    }
    await db.membership.create({
      data: { userId: user.id, organizationId: fiventsOrg.id, role: "SUPER_ADMIN" },
    });
  } else {
    if (!user.googleId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, emailVerified: true, avatarUrl: googleUser.avatarUrl || user.avatarUrl },
      });
    }

    // Ensure SUPER_ADMIN membership exists
    const hasMembership = await db.membership.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!hasMembership) {
      let fiventsOrg = await db.organization.findFirst({
        where: { name: "Fivents" },
      });
      if (!fiventsOrg) {
        fiventsOrg = await db.organization.create({
          data: { name: "Fivents", slug: "fivents", email: "contato@fivents.com" },
        });
      }
      await db.membership.create({
        data: { userId: user.id, organizationId: fiventsOrg.id, role: "SUPER_ADMIN" },
      });
    }
  }

  const { cookie } = await createSessionAndGetCookie(user.id, meta);

  return { success: true, cookie };
}

export async function setPassword(
  input: SetPasswordInput,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const user = await db.user.findFirst({
    where: {
      setupToken: input.token,
      setupTokenExpiresAt: { gte: new Date() },
      deletedAt: null,
    },
    include: { memberships: { where: { isActive: true } } },
  });

  if (!user) {
    return { error: "Token inválido ou expirado" };
  }

  const passwordHash = hashPassword(input.password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustSetPassword: false,
      setupToken: null,
      setupTokenExpiresAt: null,
    },
  });

  await createSession(user.id, meta);

  return { success: true };
}

export async function generateSetupToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48h

  await db.user.update({
    where: { id: userId },
    data: {
      setupToken: token,
      setupTokenExpiresAt: expiresAt,
      mustSetPassword: true,
      passwordHash: null,
    },
  });

  return token;
}

export async function logout() {
  await destroySession();
  return { success: true };
}

export { getCurrentUser };
